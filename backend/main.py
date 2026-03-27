from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import engine, SessionLocal

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

from ws_server import app as ws_app
app.mount("/ws", ws_app)
