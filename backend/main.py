import os
import json
from typing import List, Dict
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import AsyncOpenAI
from duckduckgo_search import DDGS

# Load environment variables
load_dotenv()

# OpenRouter client
client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

MODEL = "arcee-ai/trinity-large-preview:free"

# FastAPI app
app = FastAPI(
    title="AI Assistant Backend",
    description="Python FastAPI backend powered by OpenRouter (Free Tier) with DuckDuckGo Search.",
    version="1.2.0",
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
async def chat(req: ChatRequest):
    """
    Agentic Loop (Context Aware):
    1. Receive full conversation history.
    2. Check if search is needed (Thinking Loop).
    3. Return final response.
    """
    
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
                
                # Return final answer
                return ChatResponse(response=final_completion.choices[0].message.content)
                
            except json.JSONDecodeError:
                # Fallback if JSON is malformed
                return ChatResponse(response=initial_response)
        
        # No tool call, return initial response
        return ChatResponse(response=initial_response)

    except Exception as e:
        raise HTTPException(status_code=503, detail=f"OpenRouter/Backend API error: {str(e)}")
