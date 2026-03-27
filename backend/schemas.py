from pydantic import BaseModel
from typing import List, Optional
import datetime

class AgentBase(BaseModel):
    name: str
    role: str
    voice_provider: str
    voice_id: Optional[str] = None
    system_prompt: Optional[str] = None

class AgentCreate(AgentBase):
    pass

class Agent(AgentBase):
    id: int
    podcast_id: Optional[int] = None

    class Config:
        from_attributes = True

class PodcastBase(BaseModel):
    title: str
    status: Optional[str] = "draft"

class PodcastCreate(PodcastBase):
    pass

class Podcast(PodcastBase):
    id: int
    created_at: datetime.datetime
    agents: List[Agent] = []

    class Config:
        from_attributes = True

class TranscriptBase(BaseModel):
    speaker: str
    text: str

class TranscriptCreate(TranscriptBase):
    pass

class Transcript(TranscriptBase):
    id: int
    podcast_id: int
    timestamp: datetime.datetime

    class Config:
        from_attributes = True

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    voice_id: str = "EXAVITQu4vr4xnSDxMaL" # Bella (ElevenLabs Default)
