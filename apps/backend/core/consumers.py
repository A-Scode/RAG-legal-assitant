import json
from channels.auth import UserLazyObject
from channels.generic.websocket import AsyncWebsocketConsumer
import logging

from .services import clean_group_name

from .llm_responses import generate_llm_response

logger = logging.getLogger('django')

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        logger.info("connecting")
        self.user = self.scope.get('user')
        self.room_group_name = None

        if not self.user or self.user.is_anonymous:
            logger.info("user is anonymous")
            await self.close()
        
        self.room_group_name = f'chat_{clean_group_name(self.scope['url_route']['kwargs']['session_id'])}'
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        logger.info("user connected")

    async def disconnect(self, code):
        logger.info("disconnecting")
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        logger.info(f"received: {text_data}")
        data = json.loads(text_data)
        message = data['message']
        await generate_llm_response(message , self.room_group_name)

    async def chat_message(self, event):
        message = event['message']
        
        await self.send(text_data=json.dumps({
            "type" : "chat_message",
            'message': message
        }))

    async def stream_status_message(self , event):
        status = event['stream_status']

        await self.send(text_data=json.dumps({
            'type' : "stream_status",
            'stream_status': status # can be 1-start, 0-end
        }))

    async def chunk_message(self , event):
        chunk = event['chunk']

        await self.send(text_data=json.dumps({
            'type' : "chunk_message",
            'chunk': chunk
        }))