import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY environment variable is not set.")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.0-flash")

# FastAPI app
app = FastAPI(
    title="AI Assistant Backend",
    description="Python FastAPI backend powered by Google Gemini.",
    version="0.1.0",
)

# CORS — allow the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Request / Response schemas ----------

class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    mode: str = "bestfriend"
    history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    response: str
    model: str


# ---------- System prompts by mode ----------

SYSTEM_PROMPTS: dict[str, str] = {
    "bestfriend": (
        "You are a warm, supportive best-friend AI assistant. "
        "Be casual, friendly, and helpful. Use emojis occasionally."
    ),
    "professional": (
        "You are a professional AI assistant. "
        "Be concise, accurate, and formal in your responses."
    ),
    "creative": (
        "You are a creative AI assistant. "
        "Be imaginative, think outside the box, and inspire the user."
    ),
}


# ---------- Endpoints ----------

@app.get("/")
async def root():
    return {"status": "ok", "service": "AI Assistant Backend"}


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Send a message to Gemini and return the response."""
    try:
        # Build the conversation history for Gemini
        system_prompt = SYSTEM_PROMPTS.get(req.mode, SYSTEM_PROMPTS["bestfriend"])

        contents = []

        # Add conversation history
        for msg in req.history:
            role = "user" if msg.role == "user" else "model"
            contents.append({"role": role, "parts": [msg.content]})

        # Add the current user message
        contents.append({"role": "user", "parts": [req.message]})

        # Call Gemini
        response = model.generate_content(
            contents=contents,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                max_output_tokens=2048,
            ),
            system_instruction=system_prompt,
        )

        return ChatResponse(
            response=response.text,
            model="gemini-2.0-flash",
        )

    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Gemini API error: {str(e)}")
