# AI Podcast Studio

This is a full-fledged podcast management and recording platform that allows you to record live audio podcasts with AI agents serving as co-hosts and a background crew running asynchronously.

## Features
- **Frontend**: Next.js (React) application built with Tailwind CSS. It connects to Google Gemini Live and ElevenLabs APIs via direct WebSockets for ultra-low latency conversational AI co-hosts.
- **Backend**: FastAPI (Python) backend using CrewAI for background orchestration. Async tasks run a "Fact-Checker" and "Moderator" during the podcast, analyzing the transcript and pushing real-time insights to the frontend's Teleprompter.
- **Database**: SQLite database managed via SQLAlchemy for storing podcast drafts, transcripts, and AI agent configurations.
- **Live Studio UI**: Features microphone controls, live scrolling transcript, active AI indicators, and a teleprompter for background crew messages.

## Prerequisites
- Node.js (v18 or higher)
- Python (v3.10 or higher)

## Setup and Execution

### 1. Backend (Python/FastAPI)

1. Open a terminal and navigate to the `backend` directory:
   ```
   cd backend
   ```
2. Create and activate a Python virtual environment (e.g., using `python3 -m venv venv` and `source venv/bin/activate`).
3. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```
4. Start the FastAPI server (it will automatically create the `sql_app.db` SQLite database):
   ```
   uvicorn main:app --reload --port 8000
   ```
   The backend API will now be running at `http://localhost:8000`.

### 2. Frontend (Next.js)

1. Open a new terminal and navigate to the `frontend` directory:
   ```
   cd frontend
   ```
2. Install the required Node modules:
   ```
   npm install
   ```
3. Start the Next.js development server:
   ```
   npm run dev &
   ```
   The frontend UI will now be running at `http://localhost:3000`.

## Usage
1. Open your browser and go to `http://localhost:3000`.
2. Navigate to **Manage Agents** to configure your AI Co-hosts, Moderators, and Fact-Checkers.
3. Navigate to the **Dashboard** to draft a new podcast episode and assign your created agents to the crew.
4. Navigate to the **Live Studio**, select your drafted podcast, and click **Start Recording** to test the live transcription and background teleprompter features.
