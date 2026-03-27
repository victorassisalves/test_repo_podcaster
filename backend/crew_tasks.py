import asyncio
from crewai import Agent, Task, Crew, Process
from pydantic import BaseModel
import websockets

class CrewInput(BaseModel):
    transcript_chunk: str

async def run_crew_async(transcript_chunk: str):
    # Defining agents with different roles
    fact_checker = Agent(
        role='Fact Checker',
        goal='Verify the accuracy of statements made in the podcast transcript.',
        backstory='You are an expert researcher dedicated to finding the truth and ensuring factual accuracy.',
        verbose=True,
        allow_delegation=False
    )

    moderator = Agent(
        role='Moderator',
        goal='Ensure the conversation stays on topic and follows the podcast guidelines.',
        backstory='You are an experienced podcast moderator who keeps discussions focused and engaging.',
        verbose=True,
        allow_delegation=False
    )

    # Creating tasks for the agents
    task1 = Task(
        description=f'Analyze the following transcript chunk for factual accuracy: {transcript_chunk}',
        expected_output='A brief fact-checking report highlighting any inaccuracies.',
        agent=fact_checker
    )

    task2 = Task(
        description=f'Review the following transcript chunk to ensure it stays on topic: {transcript_chunk}',
        expected_output='A brief moderation report with suggestions if the conversation is drifting.',
        agent=moderator
    )

    # Assembling the crew
    crew = Crew(
        agents=[fact_checker, moderator],
        tasks=[task1, task2],
        process=Process.sequential, # Tasks run sequentially for simplicity in this example
        verbose=True
    )

    # Kick off the crew
    # In a real scenario, you'd want to handle the output and send it via WebSockets
    result = crew.kickoff()

    # Simulate sending the result via WebSocket to the frontend Teleprompter
    async with websockets.connect("ws://localhost:8000/ws/teleprompter") as websocket:
        await websocket.send(str(result))

    return result
