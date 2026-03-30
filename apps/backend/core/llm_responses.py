from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
async def generate_llm_response(query: str , room_group_name: str):
    channel_layer = get_channel_layer()
    await channel_layer.group_send(
        room_group_name,
        {
            "type": "chat_message",
            "message": "hii",
        }
    )