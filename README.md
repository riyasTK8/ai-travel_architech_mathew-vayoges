🌍 AI Travel Architect

AI Travel Architect is a full-stack AI-powered travel planning application that generates a structured 3-day travel itinerary for any destination in the world.

The application uses Google Gemini AI to automatically create travel plans based on a destination and travel style (Adventure, Foodie, Culture, Relaxation, Luxury).

This project demonstrates how Artificial Intelligence can be integrated into a modern full-stack web application to generate intelligent travel recommendations.

🚀 Features

🌎 Search any travel destination in the world

🤖 AI-powered itinerary generation using Gemini API

🗺️ Generates a 3-day structured travel plan

🎒 Supports different travel styles:

Adventure

Foodie

Culture

Relaxation

Luxury

⚡ Fast API backend for AI processing

💻 Modern frontend using Next.js

🐳 Docker support for containerized deployment

🧠 How It Works

User enters a destination and travel style

The frontend sends a request to the FastAPI backend

The backend sends a prompt to Google Gemini AI

Gemini generates a 3-day itinerary

The response is returned to the frontend and displayed to the user





🛠️ Tech Stack
Frontend

Next.js

React

Tailwind CSS

Backend

FastAPI

Python

Uvicorn

AI

Google Gemini API

DevOps

Docker

Docker Compose

📂 Project Structure
travel-ai-architect/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── models.json
│   └── Dockerfile
│
├── frontend/
│   ├── pages/
│   ├── styles/
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
⚙️ Installation
1️⃣ Clone Repository
git clone https://github.com/yourusername/travel-ai-architect.git
cd travel-ai-architect
🐍 Backend Setup (FastAPI)

Navigate to backend folder:

cd backend

Create virtual environment:

python3 -m venv venv

Activate environment:

source venv/bin/activate

Install dependencies:

pip install -r requirements.txt

Create .env file:

GOOGLE_API_KEY=your_gemini_api_key

Run backend server:

uvicorn main:app --reload

Backend will run at:
