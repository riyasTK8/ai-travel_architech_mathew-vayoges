# TripPlanner AI 
A full-stack application that generates 3-day travel itineraries using the Gemini 2.5 Flash API.

**Stack:** FastAPI · Next.js · Gemini API · Docker Compose

---

## Quick Start (Docker Setup)

The easiest way to run this application is by using Docker Compose. This ensures that the frontend and backend are perfectly configured to talk to each other without polluting your local system with dependencies.

### 1. Clone the repo
```bash
git clone https://github.com/sameerpt/TripPlanner-AI.git
cd travel-architect
```

### 2. Get a Google Gemini API Key
To use the AI generation, you must obtain a free API key from Google AI Studio.
1. Visit: [Google AI Studio API Keys](https://aistudio.google.com/app/apikey)
2. Create a new API key. Note: You need a project with access to the `gemini-2.5-flash` model. 

### 3. Add your Gemini API key to `.env`
Create (or edit the existing) `.env` file in the root directory:
```bash
GOOGLE_API_KEY=your_actual_key_here
```

### 4. Run with Docker Compose
Ensure Docker and Docker Compose are installed on your machine.
```bash
# This builds the frontend and backend containers and starts them in the background
docker-compose up -d --build
```

### 5. Open the app
Visit: http://localhost:3000 in your browser to start planning!

---

## 🛑 Troubleshooting

### API Quota Issues ("429 Quota Exceeded")
If you see a red quota exceeded error or API generation fails, your API key might not have access to the specific model (or you've run out of free tier quota). This project defaults to **`gemini-2.5-flash`**. If needed, you can modify `backend/main.py` lines 91-95 to use a model your key supports (like `gemini-2.0-flash` or `gemini-1.5-flash`).

### Stopping the Services
To stop the Docker containers when you're done:
```bash
docker-compose down
```

---

## Project Structure

```
travel-architect/
├── docker-compose.yml     # Orchestrates both services
├── .env                   # Your API key goes here
├── backend/
│   ├── Dockerfile         # Python 3.12 build rules
│   ├── main.py            # FastAPI app + Gemini integration
│   └── requirements.txt   # Python dependencies
└── frontend/
    ├── Dockerfile         # Node.js build rules
    ├── pages/
    │   └── index.js       # Main UI
    └── package.json       # React/Next dependencies
```

## How it Works

1. User enters a **destination** and **travel style** on the web UI.
2. Next.js Frontend sends a POST request to `/generate-itinerary` on the FastAPI backend.
3. FastAPI calls the **Gemini API** using a structural prompt for a JSON 3-day plan.
4. FastAPI validates and returns the result to the Frontend.
5. The Frontend renders the result in a clean day-by-day UI format.
