from channels.db import database_sync_to_async
from channels.layers import get_channel_layer
from .models import ChatMessage, Document, DocumentRefered
import logging , json
from langchain_core.messages import AIMessageChunk, HumanMessage
from .agents import response_agent, ResponseAgentState

logger = logging.getLogger('django')

async def generate_llm_response(query: str , room_group_name: str , session_id: str , user_id:str):
    channel_layer = get_channel_layer()
    history = await ChatMessage.model_chat_context(session_id)
    
    # Append the current query as a HumanMessage to satisfy the LLM's user prompt requirement
    history.append(HumanMessage(content=query))

    model_reponse_message = ""


    config = {"configurable": {"user_id": user_id, "thread_id": session_id}}

    assistant_message_obj = None

    async for event in response_agent.astream_events({
        "input": query,
        "messages": history
    }, config=config, version="v2",
    include_types=["chat_model"] ):
        kind = event["event"]

        logger.info(f"event: {event}")

        if kind == "on_chat_model_start":
            await ChatMessage.objects.acreate(
                session_id = session_id,
                content = query,
                role = "user"
            )
        
        if kind == "on_chat_model_stream":
            chunk = event["data"]["chunk"]
            content = ""
            thinking = ""
            if isinstance(chunk, AIMessageChunk):
                content = str(chunk.content) if chunk.content else ""
                model_reponse_message += content
                thinking = chunk.additional_kwargs.get("reasoning_content", "")
            elif hasattr(chunk, 'content'):
                content = str(chunk.content) if chunk.content else ""
                model_reponse_message += content
                if hasattr(chunk, 'additional_kwargs'):
                    thinking = chunk.additional_kwargs.get("reasoning_content", "")
            elif isinstance(chunk, dict):
                content = str(chunk.get('content', ''))
                model_reponse_message += content
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
    
        elif kind == "on_chat_model_end":
            logger.info(f"on_chat_model_end: {event}")
            assistant_message_obj = await ChatMessage.objects.acreate(
                session_id = session_id,
                content = model_reponse_message,
                role = "assistant"
            )

    # Get final state to retrieve referred documents
    final_state = await response_agent.aget_state(config)
    referred_docs_from_state = final_state.values.get("referred_documents", [])
    logger.info(f"Final state referred_documents: {referred_docs_from_state}")
    
    docs_refered_data = []

    if assistant_message_obj and referred_docs_from_state:
        # Deduplicate and save to DB
        seen_docs = set()
        for doc_info in referred_docs_from_state:
            d_id = doc_info.get("doc_id")
            if d_id and d_id not in seen_docs:
                try:
                    doc_obj = await Document.objects.aget(doc_id=d_id)
                    await DocumentRefered.objects.acreate(
                        message=assistant_message_obj,
                        document=doc_obj,
                        pages=doc_info.get("pages", [])
                    )
                    seen_docs.add(d_id)
                    logger.info(f"Saved DocumentRefered for doc {d_id}")
                except Exception as e:
                    logger.warning(f"Error saving reference for doc {d_id}: {e}")

        # Get formatted references for frontend
        docs_refered_data = await database_sync_to_async(DocumentRefered.get_document_refered)(assistant_message_obj.msg_id)
        logger.info(f"Fetched {len(docs_refered_data)} formatted references for frontend")

    message = {
        "stage": "done",
        "content" : "",
        "docs_refered": docs_refered_data
    }
    await channel_layer.group_send(room_group_name, {
        "type": "stream_message",
        "message": message,
    })
