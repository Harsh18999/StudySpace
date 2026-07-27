from unittest.mock import patch
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from rest_framework import status
from ai.tasks import dummy_task


class KeepAliveEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_dummy_task_direct(self):
        result = dummy_task("test_user")
        self.assertIn("test_user", result)

    @patch("ai.views.keep_alive.dummy_task.delay")
    def test_keep_alive_default_get(self, mock_delay):
        mock_delay.return_value.id = "mocked-task-id-123"
        response = self.client.get("/keep_alive/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "ok")
        self.assertEqual(response.data["name"], "keep_alive")
        self.assertEqual(response.data["task_id"], "mocked-task-id-123")
        mock_delay.assert_called_once_with(name="keep_alive")

    @patch("ai.views.keep_alive.dummy_task.delay")
    def test_keep_alive_with_url_name_param(self, mock_delay):
        mock_delay.return_value.id = "mocked-task-id-456"
        response = self.client.get("/keep_alive/?name=my_service")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "ok")
        self.assertEqual(response.data["name"], "my_service")
        self.assertEqual(response.data["task_id"], "mocked-task-id-456")
        mock_delay.assert_called_once_with(name="my_service")

    @patch("ai.views.keep_alive.dummy_task.delay")
    def test_api_keep_alive_query_param(self, mock_delay):
        mock_delay.return_value.id = "mocked-task-id-789"
        response = self.client.get("/api/keep_alive/?name=query_name")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "query_name")
        mock_delay.assert_called_once_with(name="query_name")

    @patch("ai.views.keep_alive.dummy_task.delay")
    def test_keep_alive_post(self, mock_delay):
        mock_delay.return_value.id = "mocked-task-id-999"
        response = self.client.post("/api/keep_alive/", {"name": "post_name"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "post_name")
        mock_delay.assert_called_once_with(name="post_name")


from accounts.models import User, CreditWallet
from payments.models import CreditUsage
from spaces.models import Space, Module, Resource, YoutubeVideo
from django.utils import timezone
import datetime


class ChatVideoCreditTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="chatuser@example.com",
            name="Chat User",
            password="Password123!",
        )
        self.wallet, _ = CreditWallet.objects.get_or_create(user=self.user)
        self.wallet.balance = 5
        self.wallet.save()
        self.client.force_authenticate(user=self.user)

        self.space = Space.objects.create(name="Test Space", description="Desc", user=self.user)
        self.module = Module.objects.create(name="Test Module", space=self.space)
        self.resource = Resource.objects.create(module=self.module, type="youtube")
        self.yt_video = YoutubeVideo.objects.create(
            resource=self.resource,
            title="Test Video",
            video_id="test_vid_123",
            channel_name="Test Channel",
            channel_id="chan_123",
            duration=datetime.timedelta(minutes=5),
            published_at=timezone.now(),
            thumbnail_url="http://example.com/thumb.jpg",
        )

    @patch("ai.views.chat.PostgresSaver")
    @patch("ai.views.chat.build_graph")
    def test_chat_video_debits_2_credits(self, mock_build_graph, mock_postgres_saver):
        self.assertEqual(self.wallet.balance, 5)
        payload = {
            "resource_id": str(self.resource.id),
            "messages": [{"role": "user", "content": "What is this video about?"}],
        }
        response = self.client.post("/api/ai/chat-video/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        _ = list(response.streaming_content)
        
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, 3)

        usage = CreditUsage.objects.filter(wallet=self.wallet).last()
        self.assertIsNotNone(usage)
        self.assertEqual(usage.amount, 2)
        self.assertEqual(usage.transaction_type, "debit")

    def test_chat_video_insufficient_credits(self):
        self.wallet.balance = 1
        self.wallet.save()

        payload = {
            "resource_id": str(self.resource.id),
            "messages": [{"role": "user", "content": "Hello?"}],
        }
        response = self.client.post("/api/ai/chat-video/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data.get("message"), "Insufficient credits")
        self.assertEqual(response.data.get("required_credits"), 2)


from ai.models import IndexVideos
from ai.services.workflow import save_summaries


class ResourceIndexedStatusTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="indexuser@example.com",
            name="Index User",
            password="Password123!",
        )
        self.client.force_authenticate(user=self.user)
        self.space = Space.objects.create(name="Test Space", description="Desc", user=self.user)
        self.module = Module.objects.create(name="Test Module", space=self.space)
        self.resource = Resource.objects.create(module=self.module, type="youtube")
        self.yt_video = YoutubeVideo.objects.create(
            resource=self.resource,
            title="Test Video",
            video_id="vid_test_xyz",
            channel_name="Test Channel",
            channel_id="chan_123",
            duration=datetime.timedelta(minutes=5),
            published_at=timezone.now(),
            thumbnail_url="http://example.com/thumb.jpg",
        )

    def test_resource_indexed_status_endpoint(self):
        # Unindexed initial check
        res = self.client.get(f"/api/ai/resource-indexed/?resource_id={self.resource.id}")
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.data["is_indexed"])

        # Index the video
        IndexVideos.objects.create(
            video_id="vid_test_xyz",
            collection_name="test_collection",
            transcript=[],
        )

        res = self.client.get(f"/api/ai/resource-indexed/?resource_id={self.resource.id}")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data["is_indexed"])

    @patch("ai.services.workflow.video_vector_store")
    def test_save_summaries_node_debits_50_credits(self, mock_vector_store):
        wallet, _ = CreditWallet.objects.get_or_create(user=self.user)
        wallet.balance = 100
        wallet.save()

        state = {
            "resource": self.resource,
            "summarise": ["Summary text"],
            "instructions": [],
        }

        save_summaries(state)

        wallet.refresh_from_db()
        self.assertEqual(wallet.balance, 50)
        usage = CreditUsage.objects.filter(wallet=wallet).last()
        self.assertIsNotNone(usage)
        self.assertEqual(usage.amount, 50)
        self.assertEqual(usage.transaction_type, "debit")


