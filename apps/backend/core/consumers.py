import json
import asyncio
from channels.auth import UserLazyObject
from channels.generic.websocket import AsyncWebsocketConsumer
import logging

from .models import ChatMessage

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

        history = await ChatMessage.get_message_history(self.scope['url_route']['kwargs']['session_id'])
        
        logger.info(f"history: {history}")
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'history_message',
                'message': history
            }
        )

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
        _ = asyncio.create_task(generate_llm_response(message , self.room_group_name , self.scope['url_route']['kwargs']['session_id'], self.user.id))

    async def stream_message(self, event):
        message = event['message']
        data = {
            'type' : 'stream',
            'data' : message
        }
        logger.info(f"stream_message: {message}")

        await self.send(text_data=json.dumps(data))
    
    async def history_message(self , event):
        message = event['message']
        data = {
            'type' : 'history',
            'data' : message
        }
        logger.info(f"history_message: {message}")

        await self.send(text_data=json.dumps(data))
        