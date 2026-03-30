from langchain_openai import ChatOpenAI
from langchain.agents import create_agent
from langchain.agents.middleware import SummarizationMiddleware

thinking_model = ChatOpenAI(
    base_url="http://localhost:5300",       
    model="qwen3.5-9b",
    api_key="",        
    temperature=0.7,
    extra_body={"include_reasoning": True}
)

response_agent_system_prompt = """
- You are a helpfullegal assistant AI. \
- You are given a query and context. \
- You need to answer the query based on the documents.\
- You can use tool to retrive documents. by searching in the vector store. \
- You are also provided with a search tool so you can get information from internet, \
- make sure your answer is correct and mentions the source of the information in consize manner.\
- you must give answer in Markdown format.\
"""

response_agent = create_agent(
    model=thinking_model,
    tools=[],
    system_prompt=response_agent_system_prompt,
    middleware=[
        SummarizationMiddleware(
            model=thinking_model,
            trigger=("tokens", 4000),
            keep=("messages", 20),

        )
    ],
    response_format=None,
    state_schema=None,
    context_schema=None,
    checkpointer=None,
    store=None,
    interrupt_before=None,
    interrupt_after=None,
    debug=False,
    name=None,
    cache=None,
)



