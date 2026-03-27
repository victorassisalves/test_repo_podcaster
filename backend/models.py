from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
import datetime
from database import Base

class Podcast(Base):
    __tablename__ = "podcasts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    status = Column(String, default="draft") # draft, recording, done
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    agents = relationship("Agent", back_populates="podcast")
    transcripts = relationship("Transcript", back_populates="podcast")

class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    role = Column(String) # Host, Co-host, Moderator, Fact-checker, Dummy
    voice_provider = Column(String) # google, elevenlabs
    voice_id = Column(String)
    system_prompt = Column(Text)
    podcast_id = Column(Integer, ForeignKey("podcasts.id"))

    podcast = relationship("Podcast", back_populates="agents")

class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(Integer, primary_key=True, index=True)
    podcast_id = Column(Integer, ForeignKey("podcasts.id"))
    speaker = Column(String) # user, agent_name
    text = Column(Text)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    podcast = relationship("Podcast", back_populates="transcripts")
