from langchain_openai import ChatOpenAI
from langchain.agents import create_agent

thinking_model = ChatOpenAI(
    base_url="http://localhost:5300",       
    model="qwen3.5-9b",               
    temperature=0.7
)

response_agent_system_prompt = """

"""

response_agent = create_agent(
    model=thinking_model,
    tools=[],
    system_prompt=response_agent_system_prompt,
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

