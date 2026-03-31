from .qdrant import get_qdrant_client
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langchain.agents import create_agent
from langchain.agents.middleware import SummarizationMiddleware, AgentMiddleware
from langchain_community.tools import DuckDuckGoSearchRun
from .models import User, Document, DocumentRefered
from channels.db import database_sync_to_async
from typing import TypedDict, Annotated, List, Dict, Any, Required, NotRequired, Sequence
from langchain_core.messages import BaseMessage, AnyMessage, ToolMessage
from langgraph.graph.message import add_messages
from langgraph.types import Command
from langgraph.prebuilt import InjectedState
from langgraph.config import get_config
from langgraph.checkpoint.memory import MemorySaver
import operator

from .services import embed_text
import logging

logger = logging.getLogger('django')

thinking_model = ChatOpenAI(
    base_url="http://localhost:5300",       
    model="qwen3.5-9b",
    api_key="",        
    temperature=0.7,
    streaming=True,
    extra_body={"include_reasoning": True}
)

response_agent_system_prompt = """
- You are a helpfullegal assistant AI. \
- You are given a query and context. \
- You need to answer the query based on the documents.\
- You can use tool to retrive documents. by searching in the vector store. **Use keywords to get better results** \
- You are also provided with a search tool so you can get information from internet, \
- make sure your answer is correct and mentions the source of the information in consize manner.\
- you must give answer in Markdown format.\
"""



@tool
def search_documents(search: str, state: Annotated[dict, InjectedState]):
    """
    Use this tool to search for documents in the vector store. Use **Key words** to search for relevent pages
    """
    logger.info(f"Searching documents for: {search}")
    client = get_qdrant_client()
    try:
        search_result = client.query_points(
            collection_name="legal_documents",
            query=embed_text(search, is_query=True),
            limit=10, # Increased limit to see more results
        ).points
        logger.info(f"Qdrant returned {len(search_result)} raw points")
    except Exception as e:
        logger.error(f"Qdrant search error: {e}")
        search_result = []

    last_message = state["messages"][-1]
    tool_call_id = last_message.tool_calls[0]["id"] if hasattr(last_message, "tool_calls") and last_message.tool_calls else "unknown"

    if not search_result:
        return Command(
            update={
                "messages": [ToolMessage(content="No documents found in the database for this search query.", tool_call_id=tool_call_id)]
            }
        )

    docs = []
    referred_docs = []
    for hit in search_result:
        payload = hit.payload or {}
        title = payload.get("title", "Unknown")
        text = payload.get("text", "").strip()
        
        # Skip blank or irrelevant chunks
        if not text or not text.replace('_', '').replace('-', '').strip():
            logger.info(f"Skipping blank chunk from doc: {title}")
            continue
            
        pages = payload.get("page_numbers", [])
        # Support both old and new keys for backward compatibility
        doc_id = payload.get("doc_id") or payload.get("document_id")
        
        docs.append(f"Document Title: {title}\nPages: {pages}\nContent: {text}")
        if doc_id:
            referred_docs.append({"doc_id": doc_id, "title": title, "pages": pages})

    formatted_result = "\n\n---\n\n".join(docs)
    if not docs:
        formatted_result = "Search returned results but they contained no readable text."

    logger.info(f"search_documents returning Command with {len(referred_docs)} referred docs")
    return Command(
        update={
            "referred_documents": referred_docs,
            "messages": [ToolMessage(content=formatted_result, tool_call_id=tool_call_id)]
        }
    )

def merge_referred_docs(left: list[dict[str, Any]], right: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Deduplicate referred documents by doc_id."""
    if not left: return right
    if not right: return left
    seen = {d.get("doc_id") for d in left if d.get("doc_id")}
    res = list(left)
    for d in right:
        d_id = d.get("doc_id")
        if d_id and d_id not in seen:
            res.append(d)
            seen.add(d_id)
    return res

class ResponseAgentState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
    referred_documents: Annotated[list[dict[str, Any]], merge_referred_docs]
    user_details: dict[str, Any]
    # Compatibility fields for internal AgentState
    jump_to: NotRequired[Any]
    structured_response: NotRequired[Any]

class UserDetailMiddleware(AgentMiddleware):
    async def abefore_agent(self, state: ResponseAgentState, runtime: Any) -> dict[str, Any] | None:
        config = get_config()
        user_id = config.get("configurable", {}).get("user_id")
        if user_id:
            try:
                user = await User.objects.aget(id=user_id)
                return {
                    "user_details": {
                        "state": user.state,
                        "city": user.city,
                        "occupation": user.occupation,
                        "details": user.details
                    }
                }
            except Exception as e:
                logger.warning(f"Error fetching user {user_id}: {e}")
        return None

search_web = DuckDuckGoSearchRun()


checkpointer = MemorySaver()

response_agent = create_agent(
    model=thinking_model,
    tools=[search_documents, search_web],
    system_prompt=response_agent_system_prompt,
    middleware=[
        UserDetailMiddleware(),
        SummarizationMiddleware(
            model=thinking_model,
            trigger=("tokens", 4000),
            keep=("messages", 20),

        )
    ],
    state_schema=ResponseAgentState,
    response_format=None,
    context_schema=None,
    checkpointer=checkpointer,
    store=None,
    interrupt_before=None,
    interrupt_after=None,
    debug=False,
    name=None,
    cache=None,
)


    



