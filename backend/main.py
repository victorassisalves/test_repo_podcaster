import os
import base64
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from openai import OpenAI

import models
import schemas
from database import engine, SessionLocal
from ws_server import app as ws_app

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

# For LLM we'll use OpenAI for simplicity, but it can be pointed to Google via compatibility layers if needed
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Initialize OpenAI Client
llm_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/agents/", response_model=schemas.Agent)
def create_agent(agent: schemas.AgentCreate, db: Session = Depends(get_db)):
    db_agent = models.Agent(**agent.dict())
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent

@app.get("/agents/", response_model=List[schemas.Agent])
def read_agents(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    agents = db.query(models.Agent).offset(skip).limit(limit).all()
    return agents

@app.post("/podcasts/", response_model=schemas.Podcast)
def create_podcast(podcast: schemas.PodcastCreate, db: Session = Depends(get_db)):
    db_podcast = models.Podcast(**podcast.dict())
    db.add(db_podcast)
    db.commit()
    db.refresh(db_podcast)
    return db_podcast

@app.get("/podcasts/", response_model=List[schemas.Podcast])
def read_podcasts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    podcasts = db.query(models.Podcast).offset(skip).limit(limit).all()
    return podcasts

@app.post("/podcasts/{podcast_id}/agents/{agent_id}")
def assign_agent_to_podcast(podcast_id: int, agent_id: int, db: Session = Depends(get_db)):
    db_agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if not db_agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    db_podcast = db.query(models.Podcast).filter(models.Podcast.id == podcast_id).first()
    if not db_podcast:
        raise HTTPException(status_code=404, detail="Podcast not found")

    db_agent.podcast_id = podcast_id
    db.commit()
    return {"message": f"Agent {agent_id} assigned to Podcast {podcast_id}"}


async def generate_elevenlabs_audio(text: str, voice_id: str) -> str:
    """Generate TTS audio from ElevenLabs and return as base64 string"""
    if not ELEVENLABS_API_KEY:
        return ""

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    data = {
        "text": text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=data, headers=headers, timeout=30.0)

        if response.status_code == 200:
            return base64.b64encode(response.content).decode("utf-8")
        else:
            print(f"ElevenLabs Error: {response.text}")
            return ""

@app.post("/api/chat")
async def chat_endpoint(request: schemas.ChatRequest):
    """
    Takes a conversation history, gets the next LLM response,
    and returns both the text and the ElevenLabs base64 audio.
    """
    if not llm_client:
        return {
            "text": "I am a simulated AI because no API keys were provided.",
            "audio_base64": ""
        }

    # Prepend a strong system prompt for deep conversational co-host
    system_message = {
        "role": "system",
        "content": "You are a highly engaging, extremely human-sounding podcast co-host. You thrive on deep, philosophical, and insightful conversations. Keep your responses concise (1-3 sentences) so the conversation flows naturally back and forth like a real podcast. Do NOT act like an AI assistant. Act like a passionate, opinionated human co-host."
    }

    messages = [system_message] + [{"role": m.role, "content": m.content} for m in request.messages]

    try:
        # Get LLM Response
        response = llm_client.chat.completions.create(
            model="gpt-4o-mini", # Standard fast model
            messages=messages,
            max_tokens=150,
            temperature=0.8
        )
        ai_text = response.choices[0].message.content

        # Get Audio
        audio_b64 = await generate_elevenlabs_audio(ai_text, request.voice_id)

        return {
            "text": ai_text,
            "audio_base64": audio_b64
        }
    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

app.mount("/ws", ws_app)
