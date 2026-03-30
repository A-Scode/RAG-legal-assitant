from channels.layers import get_channel_layer
from .agents import response_agent
from .models import ChatMessage
import logging , json
from langchain_core.messages import AIMessageChunk, HumanMessage

logger = logging.getLogger('django')

async def generate_llm_response(query: str , room_group_name: str , session_id: str):
    channel_layer = get_channel_layer()
    history = await ChatMessage.model_chat_context(session_id)
    
    # Append the current query as a HumanMessage to satisfy the LLM's user prompt requirement
    history.append(HumanMessage(content=query))

    
    async for event in response_agent.astream_events({
        "input": query,
        "messages": history
    }, version="v2"):
        kind = event["event"]

        # logger.info(f"event: {event}")
        
        if kind == "on_chat_model_stream":
            chunk = event["data"]["chunk"]
            content = ""
            thinking = ""
            if isinstance(chunk, AIMessageChunk):
                content = str(chunk.content) if chunk.content else ""
                thinking = chunk.additional_kwargs.get("reasoning_content", "")
            elif hasattr(chunk, 'content'):
                content = str(chunk.content) if chunk.content else ""
                if hasattr(chunk, 'additional_kwargs'):
                    thinking = chunk.additional_kwargs.get("reasoning_content", "")
            elif isinstance(chunk, dict):
                content = str(chunk.get('content', ''))
                thinking = chunk.get('additional_kwargs', {}).get("reasoning_content", "")

            if thinking:
                message = {
                    "stage" : "thinking",
                    "content" : thinking,
                    "isEnd" : False,
                }
                await channel_layer.group_send(room_group_name, {
                    "type": "stream_message",
                    "message": message,
                })
            
            if content:
                message = {
                    "stage" : "answer",
                    "content" : content,
                    "isEnd" : False,
                }
                await channel_layer.group_send(room_group_name, {
                    "type": "stream_message",
                    "message": message,
                })
        elif kind == "on_tool_start":
            message = {
                "stage" : "tool_calling",
                "tool" : event.get("name", "unknown"),
            }
            await channel_layer.group_send(room_group_name, {
                "type": "stream_message",
                "message": message,
            })
            
    message = {
        "stage": "done",
        "content" : "",
        "docs_refered": []
    }
    await channel_layer.group_send(room_group_name, {
        "type": "stream_message",
        "message": message,
    })
