from channels.generic.websocket import AsyncJsonWebsocketConsumer


class WorkflowConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):
        self.job_id = self.scope["url_route"]["kwargs"]["job_id"]

        self.group = f"workflow_{self.job_id}"

        await self.channel_layer.group_add(
            self.group,
            self.channel_name,
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group,
            self.channel_name,
        )

    async def workflow_update(self, event):
        await self.send_json(event["data"])
        