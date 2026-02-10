import os
import json
from contextlib import asynccontextmanager
from typing import List, Dict, Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select, delete
from pydantic import BaseModel
from openai import AsyncOpenAI
from duckduckgo_search import DDGS

from database import create_db_and_tables, get_session, Message

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
    title="AI Assistant Backend",
    description="Python FastAPI backend powered by OpenRouter (Free Tier) with DuckDuckGo Search.",
    version="1.3.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
        # Use synchronous DDGS (v6+ standard)
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

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
# ... (existing imports, but add UploadFile, File)
from rag import rag_system

# ... (app, lifespan, models, middleware)

# ---------- Endpoints ----------

@app.get("/")
async def root():
    return {"status": "ok", "service": "AI Assistant Backend", "default_model": DEFAULT_MODEL}

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
async def upload_document(file: UploadFile = File(...)):
    """Uploads a PDF/TXT document to the knowledge base."""
    return await rag_system.ingest(file)

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
        source_list = ", ".join([s.split("\\")[-1].split("/")[-1] for s in sources]) # Clean filenames
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

    async def generate():
        full_response = ""
        try:
            # 1. First Pass: Non-streaming to check for tool calls
            messages = [{"role": "system", "content": SYSTEM_PROMPT}] + req.messages
            
            completion = await client.chat.completions.create(
                model=active_model,
                messages=messages,
                extra_headers={"HTTP-Referer": "http://localhost:3000", "X-Title": "Yume"},
            )
            
            initial_response = completion.choices[0].message.content.strip()

            # 2. Check for Tool Call
            if initial_response.startswith('{"tool": "search"'):
                try:
                    tool_call = json.loads(initial_response)
                    query = tool_call.get("query")
                    
                    # Yield a thinking status? (Optional, maybe later)
                    # yield "Thinking...\n" 
                    
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

                except json.JSONDecodeError:
                    # Fallback to initial response
                    full_response = initial_response
                    yield initial_response
            else:
                # No tool call, yield initial response directly
                full_response = initial_response
                yield initial_response

            # 4. Save Assistant Response to DB
            if full_response:
                assistant_msg = Message(role="assistant", content=full_response)
                session.add(assistant_msg)
                session.commit()
                
        except Exception as e:
            yield f"Error: {str(e)}"

    return StreamingResponse(generate(), media_type="text/plain")
