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
        response = self.client.get("/keep_alive/my_service/")
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
