import time
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from dashboard.models import StudySession

USER_CONNECTIONS = {}  
USER_LAST_TICK = {}    


class StudySessionConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):
        self.user = self.scope.get("user")
        if not self.user or self.user.is_anonymous:
            await self.accept()
            await self.send_json({
                "type": "error",
                "message": "Authentication failed. Invalid or expired token."
            })
            await self.close(code=4001)
            return

        await self.accept()

        self.user_id = str(self.user.id)
        self.group_name = f"study_session_user_{self.user_id}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)

        USER_CONNECTIONS[self.user_id] = USER_CONNECTIONS.get(self.user_id, 0) + 1

        session_data = await self.get_or_create_active_session()
        self.session_id = session_data["session_id"]

        await self.send_json({
            "type": "session_connected",
            "session_id": str(self.session_id),
            "duration": session_data["duration"],
            "message": "Study session active"
        })

    async def disconnect(self, close_code):
        if hasattr(self, "user_id") and self.user_id:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

            if self.user_id in USER_CONNECTIONS:
                USER_CONNECTIONS[self.user_id] -= 1
                if USER_CONNECTIONS[self.user_id] <= 0:
                    USER_CONNECTIONS.pop(self.user_id, None)
                    USER_LAST_TICK.pop(self.user_id, None)
                    if hasattr(self, "session_id"):
                        await self.finalize_session(self.session_id)

    async def receive_json(self, content):
        msg_type = content.get("type")
        if msg_type in ["tick", "heartbeat"]:
            now = time.time()
            last_tick = USER_LAST_TICK.get(self.user_id, 0)

            if now - last_tick >= 25:
                USER_LAST_TICK[self.user_id] = now
                updated_duration = await self.update_session_duration(self.session_id)

                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        "type": "session_update_broadcast",
                        "duration": updated_duration
                    }
                )

    async def session_update_broadcast(self, event):
        await self.send_json({
            "type": "session_updated",
            "duration": event["duration"]
        })

    @database_sync_to_async
    def get_or_create_active_session(self):
        session = StudySession.objects.filter(
            user=self.user,
            ended_at__isnull=True
        ).order_by('-started_at').first()

        now = timezone.now()
        if not session:
            session = StudySession.objects.create(user=self.user)
            duration = 0
        else:
            duration = int((now - session.started_at).total_seconds())
            session.duration = duration
            session.save(update_fields=['duration'])

        return {
            "session_id": session.session_id,
            "duration": duration
        }

    @database_sync_to_async
    def update_session_duration(self, session_id):
        try:
            session = StudySession.objects.get(session_id=session_id)
            if session.ended_at is None:
                duration = int((timezone.now() - session.started_at).total_seconds())
                session.duration = duration
                session.save(update_fields=['duration'])
                return duration
            return session.duration
        except StudySession.DoesNotExist:
            return 0

    @database_sync_to_async
    def finalize_session(self, session_id):
        try:
            session = StudySession.objects.get(session_id=session_id)
            if session.ended_at is None:
                now = timezone.now()
                session.ended_at = now
                session.duration = int((now - session.started_at).total_seconds())
                session.save(update_fields=['ended_at', 'duration'])
        except StudySession.DoesNotExist:
            pass
