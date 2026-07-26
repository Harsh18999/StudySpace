import json
from langgraph.graph import StateGraph, END
from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage, AIMessageChunk, BaseMessage, ToolCall, ToolMessage, SystemMessage
from ai.services.prompts import video_chat_system_prompt
from langchain.tools import tool
import operator
from typing import TypedDict, Annotated
try:
    from typing import NotRequired
except ImportError:
    from typing_extensions import NotRequired
from langgraph.config import RunnableConfig
from ai.services.dep import video_vector_store
from langchain_core.messages.utils import (
    trim_messages,
    count_tokens_approximately,
)
from ai.models import IndexVideos


@tool
def fetch_content(text: str, config: RunnableConfig):
    """
    Search and retrieve relevant transcript content, concepts, definitions, formulas, or summaries from the video.
    Always call this tool when answering questions, doubts, or requests for summaries about the video.
    """
    video_id = config['configurable']['video_id']

    try:
        documents = video_vector_store.similarity_search(
            query=text,
            filter={
                "video_id": video_id,
                "content_type": 'content'
            },
            k=5
        )
        return "\n\n".join([doc.page_content for doc in documents])
    except Exception:
        # retry once
        try:
            documents = video_vector_store.similarity_search(
                query=text,
                filter={
                    "video_id": video_id,
                    "content_type": 'content'
                },
                k=5
            )
            return "\n\n".join([doc.page_content for doc in documents])
        except Exception as e:
            # Don't raise — a raised exception inside a tool call kills the graph run.
            # Return a message the model can react to instead.
            return f"Error fetching content: {e}"


@tool
def fetch_content_timeline(start_time: float, end_time: float, config: RunnableConfig):
    '''
    fetch the content between specific timeline [start_time - end_time] of the video.
    start_time -> timestamp in seconds
    end_time -> timestamp in seconds
    '''
    content = ''
    video_id = config['configurable']['video_id']

    try:
        index_video = IndexVideos.objects.get(video_id=video_id)
        transcript = getattr(index_video, 'transcript', []) or []

        for segment in transcript:
            if segment['start_time'] >= start_time:
                content += segment['text']

            if segment['start_time'] + segment['duration'] >= end_time:
                break

            if len(content) > 8000:
                break

        return content
    except Exception:
        return ''


tools = [fetch_content, fetch_content_timeline]
tool_dict = {t.name: t for t in tools}


class State(TypedDict):
    messages: Annotated[list[BaseMessage], operator.add]
    tool_messages: NotRequired[list[BaseMessage]]


chat_model = init_chat_model(
    model="gpt-4.1",
    model_provider='openai',
    temperature=0.5
).bind_tools(tools)


def chat_node(state: State):
    tool_messages = state.get('tool_messages') or []

    trimmed = trim_messages(
        state["messages"],
        strategy="last",
        max_tokens=4000,
        token_counter=count_tokens_approximately,
        start_on="human",
        include_system=False,
    )

    if tool_messages:
        trimmed = [*trimmed, *tool_messages]

    response = chat_model.invoke(
        [
            SystemMessage(content=video_chat_system_prompt),
            *trimmed,
        ]
    )

    print(f"[chat_node] response.tool_calls = {response.tool_calls}")

    if response.tool_calls:
        # Append, don't overwrite — a follow-up tool call still needs the
        # prior AIMessage/ToolMessage history for context.
        return {
            "tool_messages": [*tool_messages, response]
        }

    return {
        "messages": [response],
        "tool_messages": []
    }


def tool_node(state: State, config: RunnableConfig):
    tool_messages = state.get('tool_messages') or []
    if not tool_messages:
        return {}

    last_message = tool_messages[-1]
    tool_calls = getattr(last_message, "tool_calls", None)

    if not tool_calls:
        return {}

    for tool_call in tool_calls:
        if isinstance(tool_call, dict):
            name = tool_call["name"]
            args = tool_call["args"]
            call_id = tool_call["id"]
        else:
            name = tool_call.name
            args = tool_call.args
            call_id = tool_call.id

        if isinstance(args, str):
            args = json.loads(args)

        print(f"[tool_node] calling tool={name} args={args}")

        try:
            result = tool_dict[name].invoke(args, config=config)
            print(f"[tool_node] result={str(result)[:200]}")
        except Exception as e:
            result = f"Error running tool '{name}': {e}"
            print(f"[tool_node] {result}")

        tool_messages.append(
            ToolMessage(
                content=str(result),
                tool_call_id=call_id,
            )
        )

    return {
        "tool_messages": tool_messages
    }


def should_continue(state: State):
    tool_messages = state.get('tool_messages') or []
    if tool_messages and getattr(tool_messages[-1], "tool_calls", None):
        return "tool"
    return END


def build_graph(checkpointer):
    builder = StateGraph(State)

    builder.add_node("chat", chat_node)
    builder.add_node("tool", tool_node)

    builder.set_entry_point("chat")

    builder.add_conditional_edges(
        "chat",
        should_continue,
        {
            "tool": "tool",
            END: END,
        },
    )

    builder.add_edge("tool", "chat")

    return builder.compile(
        checkpointer=checkpointer
    )