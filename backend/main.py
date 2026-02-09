import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import AsyncOpenAI

# Load environment variables
load_dotenv()

# OpenRouter client (uses the standard OpenAI Python library)
client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

# Hardcoded free-tier model to ensure $0 cost
MODEL = "google/gemini-2.0-flash-lite-preview-02-05:free"

# FastAPI app
app = FastAPI(
    title="AI Assistant Backend",
    description="Python FastAPI backend powered by OpenRouter (Free Tier).",
    version="0.1.0",
)

# CORS — allow the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Request / Response models ----------

class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str


# ---------- Endpoints ----------

@app.get("/")
async def root():
    return {"status": "ok", "service": "AI Assistant Backend", "model": MODEL}


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Send a message to OpenRouter and return the response."""
    try:
        completion = await client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "user", "content": req.message},
            ],
            extra_headers={
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Local Jarvis",
            },
        )

        reply = completion.choices[0].message.content
        return ChatResponse(response=reply)

    except Exception as e:
        raise HTTPException(status_code=503, detail=f"OpenRouter API error: {str(e)}")
