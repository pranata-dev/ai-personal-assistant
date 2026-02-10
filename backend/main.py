import os
import re
import json
from contextlib import asynccontextmanager
from typing import List, Dict, Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select, delete
from pydantic import BaseModel
from openai import AsyncOpenAI
from duckduckgo_search import DDGS

from database import create_db_and_tables, get_session, Message
from rag import rag_system

# Load environment variables
load_dotenv()

# OpenRouter client
client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

DEFAULT_MODEL = "tngtech/deepseek-r1t2-chimera:free"

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

# FastAPI app
app = FastAPI(
    title="Yume AI Backend",
    description="Python FastAPI backend powered by OpenRouter (Free Tier) with DuckDuckGo Search.",
    version="1.4.0",
    lifespan=lifespan,
)

# CORS - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Models ----------

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    model: Optional[str] = None


class ChatResponse(BaseModel):
    response: str


# ---------- Tool Logic ----------

async def perform_web_search(query: str) -> str:
    """Performs a real-time web search using DuckDuckGo."""
    try:
        results = DDGS().text(query, max_results=5)
        if not results:
            return "No search results found."
        
        formatted_results = "\n\n".join(
            [f"Title: {r['title']}\nSnippet: {r['body']}\nURL: {r['href']}" for r in results]
        )
        return formatted_results
    except Exception as e:
        return f"Error performing search: {str(e)}"


# ---------- Endpoints ----------

@app.get("/")
async def root():
    return {"status": "ok", "service": "Yume AI Backend", "default_model": DEFAULT_MODEL}

@app.get("/history", response_model=List[Message])
async def get_history(session: Session = Depends(get_session)):
    messages = session.exec(select(Message).order_by(Message.timestamp)).all()
    return messages

@app.delete("/history")
async def clear_history(session: Session = Depends(get_session)):
    """Clears the entire chat history."""
    session.exec(delete(Message))
    session.commit()
    return {"status": "success", "message": "History cleared"}

@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...), 
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """Uploads a PDF/TXT document to the knowledge base (Async)."""
    
    # Save file to temp location
    temp_filename = f"temp_{file.filename}"
    with open(temp_filename, "wb") as f:
        content = await file.read()
        f.write(content)
        
    # Add background task
    background_tasks.add_task(rag_system.process_file, temp_filename, file.filename)
    
    return {"status": "processing_started", "message": f"Ingesting {file.filename} in background."}

@app.post("/chat")
async def chat(req: ChatRequest, session: Session = Depends(get_session)):
    """
    Agentic Loop (Streaming, Persistent, & Contextual RAG):
    0. Retrieve relevant documents (RAG).
    1. Receive full conversation history.
    2. Save User Message to DB.
    3. Stream Thinking/Response.
    4. Save Assistant Response to DB.
    """
    
    # Save User Message
    if req.messages and req.messages[-1]["role"] == "user":
        last_msg = req.messages[-1]
        user_msg = Message(role="user", content=last_msg["content"])
        session.add(user_msg)
        session.commit()
        
        # RAG Retrieval
        user_query = last_msg["content"]
        print(f"📚 Searching knowledge base for: {user_query}")
        rag_result = rag_system.search(user_query)
        retrieved_context = rag_result["context"]
        sources = rag_result["sources"]
        
        # Format sources for prompt
        source_list = ", ".join([s.split("\\")[-1].split("/")[-1] for s in sources])
    else:
        retrieved_context = ""
        source_list = ""
    
    # System prompt
    SYSTEM_PROMPT = f"""
    You are a helpful AI assistant.
    
    KNOWLEDGE BASE CONTEXT:
    {retrieved_context if retrieved_context else "No relevant documents found."}
    
    SOURCES:
    {source_list if source_list else "None"}
    
    CRITICAL INSTRUCTION:
    If 'KNOWLEDGE BASE CONTEXT' is provided, you MUST explicitly cite the filenames from 'SOURCES' when answering.
    Example: "According to 'resume.pdf', the candidate has..."
    
    If the user asks about current events, news, or real-time information that requires internet access, you MUST output a JSON object in this exact format:
    {{"tool": "search", "query": "your search query here"}}
    
    Do NOT output anything else if you want to search. Just the JSON.
    
    If the user asks a normal question (coding, greetings, general knowledge), just answer normally using the provided KNOWLEDGE BASE CONTEXT if applicable.
    """

    # Resolve model
    active_model = req.model or DEFAULT_MODEL
    print(f"🤖 Using model: {active_model}")
    
    # ⚡ Hybrid Logic: Fast Reflex vs. Deep Reasoning
    FAST_MODEL_ID = "z-ai/glm-4.5-air:free"
    
    def is_search_intent(query: str) -> bool:
        """Regex-based intent detection for fast models."""
        # 1. Explicit keywords
        keywords = ["news", "latest", "weather", "price", "stock", "score", "schedule", "current", "today"]
        if any(k in query.lower() for k in keywords):
            return True
        # 2. Starts with 5W1H (Who, What, Where, When, Why, How)
        pattern = r"^(who|what|where|when|why|how|is|are|was|were|do|does|did)\s"
        if re.match(pattern, query, re.IGNORECASE):
            return True
        # 3. Ends with question mark
        if query.strip().endswith("?"):
            return True
        return False

    async def generate():
        full_response = ""
        user_query = req.messages[-1]['content'] if req.messages else ""
        
        try:
            # PATH A: Fast Model + Search Intent (Reflex)
            if active_model == FAST_MODEL_ID and is_search_intent(user_query):
                print(f"⚡ Fast Model Reflex Search: {user_query}")
                try:
                    search_results = await perform_web_search(user_query)
                    
                    # Contextual Stream
                    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + req.messages
                    messages.append({
                        "role": "system", 
                        "content": f"Here are the search results for '{user_query}':\n\n{search_results}\n\nPlease answer the user's original question based on these results."
                    })
                    
                    stream = await client.chat.completions.create(
                        model=active_model,
                        messages=messages,
                        stream=True,
                        extra_headers={"HTTP-Referer": "http://localhost:3000", "X-Title": "Yume"},
                    )
                    
                    async for chunk in stream:
                        content = chunk.choices[0].delta.content or ""
                        if content:
                            full_response += content
                            yield content
                            
                except Exception as e:
                    yield f"Search Error: {str(e)}"

            # PATH B: Fast Model (No Search) OR Logic Model (Tool Parsing)
            else:
                should_check_tools = (active_model != FAST_MODEL_ID)
                
                if not should_check_tools:
                    # Fast Model, No Search Intent -> Direct Stream
                    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + req.messages
                    stream = await client.chat.completions.create(
                        model=active_model,
                        messages=messages,
                        stream=True,
                        extra_headers={"HTTP-Referer": "http://localhost:3000", "X-Title": "Yume"},
                    )
                    async for chunk in stream:
                        content = chunk.choices[0].delta.content or ""
                        if content:
                            full_response += content
                            yield content
                else:
                    # Logic Model -> Tool Check Loop
                    try:
                        # 1. First Pass: Non-streaming to check for tool calls
                        messages = [{"role": "system", "content": SYSTEM_PROMPT}] + req.messages
                        
                        completion = await client.chat.completions.create(
                            model=active_model,
                            messages=messages,
                            extra_headers={"HTTP-Referer": "http://localhost:3000", "X-Title": "Yume"},
                        )
                        
                        initial_response = completion.choices[0].message.content.strip()

                        # 2. Check for Tool Call using Regex
                        tool_pattern = r'\{"tool":\s*"search",\s*"query":\s*"(.*?)"\}'
                        match = re.search(tool_pattern, initial_response, re.DOTALL)

                        if match:
                            try:
                                json_match = re.search(r'\{"tool":\s*"search",\s*"query":\s*".*?"\}', initial_response, re.DOTALL)
                                if json_match:
                                    tool_json_str = json_match.group(0)
                                    tool_call = json.loads(tool_json_str)
                                    query = tool_call.get("query")
                                    
                                    print(f"🔎 Perform Search: {query}")
                                    search_results = await perform_web_search(query)
                                    
                                    # 3. Second Pass: Streaming answer with context
                                    messages.append({"role": "assistant", "content": initial_response})
                                    messages.append({
                                        "role": "system", 
                                        "content": f"Here are the search results for '{query}':\n\n{search_results}\n\nPlease answer the user's original question based on these results."
                                    })
                                    
                                    stream = await client.chat.completions.create(
                                        model=active_model,
                                        messages=messages,
                                        stream=True,
                                        extra_headers={"HTTP-Referer": "http://localhost:3000", "X-Title": "Yume"},
                                    )

                                    async for chunk in stream:
                                        content = chunk.choices[0].delta.content or ""
                                        if content:
                                            full_response += content
                                            yield content
                                else:
                                    full_response = initial_response
                                    yield initial_response

                            except json.JSONDecodeError:
                                full_response = initial_response
                                yield initial_response
                        else:
                            # No tool call, yield initial response directly
                            full_response = initial_response
                            yield initial_response
                    except Exception as e:
                         yield f"Error in logic flow: {str(e)}"

            # 4. Save Assistant Response to DB
            if full_response:
                assistant_msg = Message(role="assistant", content=full_response)
                session.add(assistant_msg)
                session.commit()
                
        except Exception as e:
            yield f"Error: {str(e)}"
    
    return StreamingResponse(generate(), media_type="text/plain")
