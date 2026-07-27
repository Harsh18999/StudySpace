from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from spaces.permissions import IsSpaceOwner
from rest_framework.exceptions import ValidationError
from django.conf import settings
from django.http import StreamingHttpResponse
import uuid
from langchain_core.messages import HumanMessage, AIMessage

from spaces.models import Resource, Module
from spaces.serializers import RetrieveResourceSerializer
from ai.models import VideoChatSession, IndexVideos, IndexPDFs
from ai.serializers import ChatVideoSerializer
from langgraph.checkpoint.postgres import PostgresSaver
from ai.services.chat import build_graph
from accounts.models import CreditWallet
from payments.models import CreditUsage
from payments.utils import check_user_has_credits


class ChatVideoView(APIView):
    permission_classes = [IsSpaceOwner]

    @extend_schema(request=ChatVideoSerializer)
    def post(self, request):
        serializer = ChatVideoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        has_credits, balance = check_user_has_credits(request.user, 2)
        if not has_credits:
            return Response(
                {
                    "message": "Insufficient credits",
                    "detail": f"Insufficient credits. Video chat requires 2 credits per question, but your current balance is {balance} credits.",
                    "required_credits": 2,
                    "current_balance": balance,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        resource_id = serializer.validated_data["resource_id"]
        try:
            resource = Resource.objects.select_related("module__space", "youtube_video").get(pk=resource_id)
            if resource.module.space.user != request.user:
                raise ValidationError("You are not authorized to access this resource.")
        except Resource.DoesNotExist:
            raise ValidationError("Resource not found.")

        session, _ = VideoChatSession.objects.get_or_create(
            resource=resource,
            defaults={"thread_id": str(uuid.uuid4())}
        )

        thread_id = serializer.validated_data.get("thread_id") or session.thread_id
        video_id = serializer.validated_data.get("video_id") or getattr(resource.youtube_video, "video_id", "")

        def generate():
            with PostgresSaver.from_conn_string(
                settings.VECTOR_DB_CONN_STRING
            ) as checkpointer:
                model = build_graph(checkpointer)

                for message, metadata in model.stream(
                    {
                        "messages": serializer.validated_data["messages"],
                        "tool_messages": [],
                    },
                    stream_mode="messages",
                    version="v2",
                    config={
                        "configurable": {
                            "thread_id": thread_id,
                            "video_id": video_id,
                        }
                    },
                ):
                    if metadata.get("langgraph_node") == "chat" and getattr(message, "content", None):
                        yield message.content.encode("utf-8")
                
                wallet, _ = CreditWallet.objects.get_or_create(user=request.user)
                if wallet.debit(2):
                    CreditUsage.objects.create(
                        wallet=wallet,
                        amount=2,
                        transaction_type="debit",
                        description="Debited 2 credits for Video Chat response",
                    )


        return StreamingHttpResponse(
            generate(),
            content_type="text/plain",
        )

    def get(self, request):
        resource_id = request.query_params.get("resource_id")
        if not resource_id:
            raise ValidationError("Resource ID is required.")
        try:
            resource = Resource.objects.select_related("module__space", "youtube_video").get(pk=resource_id)
            if resource.module.space.user != request.user:
                raise ValidationError("You are not authorized to access this resource.")

            session, _ = VideoChatSession.objects.get_or_create(
                resource=resource,
                defaults={"thread_id": str(uuid.uuid4())}
            )

            video_id = getattr(resource.youtube_video, "video_id", "")
            is_indexed = IndexVideos.objects.filter(video_id=video_id).exists() if video_id else False

            if not is_indexed:
                return Response(
                    {
                        "is_indexed": False,
                        "messages": [],
                        "thread_id": session.thread_id,
                        "video_id": video_id,
                        "message": "Video is not processed yet."
                    },
                    status=status.HTTP_200_OK
                )

            try:
                with PostgresSaver.from_conn_string(
                    settings.VECTOR_DB_CONN_STRING
                ) as checkpointer:
                    checkpoint_tuple = checkpointer.get_tuple(config={'configurable': {'thread_id': session.thread_id}})
                    if checkpoint_tuple is None or 'channel_values' not in checkpoint_tuple.checkpoint or 'messages' not in checkpoint_tuple.checkpoint['channel_values']:
                        return Response(
                            {
                                "is_indexed": True,
                                "messages": [],
                                "thread_id": session.thread_id,
                                "video_id": video_id,
                            },
                            status=status.HTTP_200_OK
                        )

                    raw_messages = checkpoint_tuple.checkpoint['channel_values']['messages']
                    formatted_messages = []
                    for msg in raw_messages:
                        if isinstance(msg, HumanMessage):
                            formatted_messages.append({'role': 'user', 'content': msg.content})
                        elif isinstance(msg, AIMessage):
                            formatted_messages.append({'role': 'assistant', 'content': msg.content})
                        elif hasattr(msg, 'content'):
                            role = 'user' if getattr(msg, 'type', '') == 'human' else 'assistant'
                            formatted_messages.append({'role': role, 'content': msg.content})

                    return Response(
                        {
                            "is_indexed": True,
                            "messages": formatted_messages,
                            "thread_id": session.thread_id,
                            "video_id": video_id,
                        },
                        status=status.HTTP_200_OK
                    )
            except Exception:
                return Response(
                    {
                        "is_indexed": True,
                        "messages": [],
                        "thread_id": session.thread_id,
                        "video_id": video_id,
                    },
                    status=status.HTTP_200_OK
                )
        except Resource.DoesNotExist:
            raise ValidationError("Resource not found.")

    def delete(self, request):
        resource_id = request.query_params.get("resource_id")
        if not resource_id:
            raise ValidationError("Resource ID is required.")
        try:
            session = VideoChatSession.objects.select_related("resource__module__space").get(resource_id=resource_id)
            if session.resource.module.space.user != request.user:
                raise ValidationError("You are not authorized to access this resource.")

            with PostgresSaver.from_conn_string(
                settings.VECTOR_DB_CONN_STRING
            ) as checkpointer:
                try:
                    checkpointer.delete_thread(session.thread_id)
                except Exception:
                    pass

            session.delete()
            return Response(
                {
                    "message": "Video chat session reset successfully.",
                },
                status=status.HTTP_200_OK
            )
        except VideoChatSession.DoesNotExist:
            return Response({"message": "No active session found."}, status=status.HTTP_200_OK)


class IndexedModuleResourcesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        module_id = request.query_params.get("module_id")
        if not module_id:
            raise ValidationError("Module ID is required.")
        try:
            module = Module.objects.select_related("space").get(
                pk=module_id,
                space__user=request.user,
            )
        except Module.DoesNotExist:
            return Response({"detail": "Module not found."}, status=status.HTTP_404_NOT_FOUND)

        resources = Resource.objects.select_related(
            "youtube_video", "pdf_file"
        ).filter(module=module)

        indexed_resources = []
        for resource in resources:
            if resource.type == "file":
                if hasattr(resource, 'pdf_file') and IndexPDFs.objects.filter(file=resource.pdf_file).exists():
                    indexed_resources.append(resource)
            elif resource.type == "youtube":
                if hasattr(resource, 'youtube_video') and IndexVideos.objects.filter(
                    video_id=resource.youtube_video.video_id
                ).exists():
                    indexed_resources.append(resource)

        return Response(
            RetrieveResourceSerializer(indexed_resources, many=True).data,
            status=status.HTTP_200_OK,
        )
