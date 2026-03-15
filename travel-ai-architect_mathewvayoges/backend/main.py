import os
import json
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")

app = FastAPI(title="Travel Architect API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ItineraryRequest(BaseModel):
    destination: str
    travel_style: str

class Activity(BaseModel):
    time: str
    title: str
    description: str
    tips: str

class DayPlan(BaseModel):
    day: int
    theme: str
    activities: list[Activity]

class ItineraryResponse(BaseModel):
    destination: str
    travel_style: str
    days: list[DayPlan]

@app.get("/")
def health_check():
    return {"status": "Travel Architect API is running"}

@app.post("/generate-itinerary", response_model=ItineraryResponse)
async def generate_itinerary(request: ItineraryRequest):
    prompt = f"""
    You are an expert travel planner. Create a detailed 3-day travel itinerary for:
    - Destination: {request.destination}
    - Travel Style: {request.travel_style}

    Return ONLY a valid JSON object with this exact structure:
    {{
      "destination": "{request.destination}",
      "travel_style": "{request.travel_style}",
      "days": [
        {{
          "day": 1,
          "theme": "A short theme title for the day",
          "activities": [
            {{
              "time": "Morning",
              "title": "Activity name",
              "description": "2-3 sentence description of the activity",
              "tips": "One practical tip for the traveler"
            }},
            {{
              "time": "Afternoon",
              "title": "Activity name",
              "description": "2-3 sentence description of the activity",
              "tips": "One practical tip for the traveler"
            }},
            {{
              "time": "Evening",
              "title": "Activity name",
              "description": "2-3 sentence description of the activity",
              "tips": "One practical tip for the traveler"
            }}
          ]
        }}
      ]
    }}

    Include all 3 days with morning, afternoon, and evening activities.
    Make it specific, exciting, and tailored to the {request.travel_style} style.
    Return ONLY the JSON. No markdown. No extra text.
    """

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GOOGLE_API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json"}
        }

        response = requests.post(url, json=payload, timeout=60)
        response.raise_for_status()

        data = response.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        itinerary_data = json.loads(text)
        return ItineraryResponse(**itinerary_data)

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Gemini returned invalid JSON")
    except requests.exceptions.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
