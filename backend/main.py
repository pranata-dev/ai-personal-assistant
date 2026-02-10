import os
import json
from contextlib import asynccontextmanager
from typing import List, Dict
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session
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

MODEL = "arcee-ai/trinity-large-preview:free"

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

@app.get("/")
async def root():
    return {"status": "ok", "service": "AI Assistant Backend", "model": MODEL}


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, session: Session = Depends(get_session)):
    """
    Agentic Loop (Context Aware & Persistent):
    1. Receive full conversation history.
    2. Save User Message to DB.
    3. Process with LLM (Thinking Loop).
    4. Save Assistant Response to DB.
    5. Return final response.
    """
    
    # Save User Message to DB
    # We assume the frontend sends the full history, and the LAST message is the new user input.
    if req.messages and req.messages[-1]["role"] == "user":
        last_msg = req.messages[-1]
        user_msg = Message(role="user", content=last_msg["content"])
        session.add(user_msg)
        session.commit()
    
    # System prompt to enforce tool usage via JSON
    SYSTEM_PROMPT = """
    You are a helpful AI assistant.
    
    CRITICAL INSTRUCTION:
    If the user asks about current events, news, or real-time information that requires internet access, you MUST output a JSON object in this exact format:
    {"tool": "search", "query": "your search query here"}
    
    Do NOT output anything else if you want to search. Just the JSON.
    
    If the user asks a normal question (coding, greetings, general knowledge), just answer normally.
    """

    try:
        # 1. Construct Context: System Prompt + History
        messages = [{"role": "system", "content": SYSTEM_PROMPT}] + req.messages

        # 2. First Pass: Ask the LLM
        completion = await client.chat.completions.create(
            model=MODEL,
            messages=messages,
            extra_headers={
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Local Jarvis",
            },
        )
        
        initial_response = completion.choices[0].message.content.strip()
        final_answer = initial_response

        # 3. Check for Tool Call
        if initial_response.startswith('{"tool": "search"'):
            try:
                # Parse JSON
                tool_call = json.loads(initial_response)
                query = tool_call.get("query")
                
                # Execute Search
                print(f"🔎 Perform Search: {query}")
                search_results = await perform_web_search(query)
                
                # 4. Second Pass: Answer with Context
                # Append the "Thinking" output and the results to the context
                messages.append({"role": "assistant", "content": initial_response})
                messages.append({
                    "role": "system", 
                    "content": f"Here are the search results for '{query}':\n\n{search_results}\n\nPlease answer the user's original question based on these results."
                })
                
                final_completion = await client.chat.completions.create(
                    model=MODEL,
                    messages=messages,
                    extra_headers={
                        "HTTP-Referer": "http://localhost:3000",
                        "X-Title": "Local Jarvis",
                    },
                )
                
                final_answer = final_completion.choices[0].message.content
                
            except json.JSONDecodeError:
                # Fallback if JSON is malformed
                pass
        
        # Save Assistant Response to DB
        assistant_msg = Message(role="assistant", content=final_answer)
        session.add(assistant_msg)
        session.commit()

        # Return final answer
        return ChatResponse(response=final_answer)

    except Exception as e:
        raise HTTPException(status_code=503, detail=f"OpenRouter/Backend API error: {str(e)}")
