import os
import json
import re
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai

# Load .env file
load_dotenv()

# Initialize Gemini Client
gemini_api_key = os.getenv("GEMINI_API_KEY", "dummy_key_for_testing")
client = genai.Client(api_key=gemini_api_key)

app = FastAPI(title="DevMind Solution Architect API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ArchitectureRequest(BaseModel):
    requirement: str

PROMPT_TEMPLATE = """You are an expert AWS Solution Architect. 
User requirement: "{requirement}"

Respond ONLY with a valid JSON object. 
The JSON must follow this exact structure:
{{
  "architecture_name": "Name",
  "overview": "Summary",
  "aws_services": [{{ "service": "Name", "purpose": "Why", "estimated_monthly_cost": "₹X" }}],
  "mermaid_diagram": "graph TD syntax using alphanumeric IDs (e.g. AGW['Gateway'])",
  "implementation_steps": ["Step 1"],
  "alternative_architectures": ["Alt 1"]
}}

Rules:
- Use alphanumeric node IDs in Mermaid (e.g., S3["Storage"])
- Quote all labels
- No backticks or markdown in response
"""

def extract_json(text: str) -> dict:
    """Robustly extract JSON from the AI response."""
    text = text.strip()
    
    start_idx = text.find('{')
    end_idx = text.rfind('}')
    
    if start_idx == -1 or end_idx == -1:
        raise ValueError("No JSON object found in response")
        
    json_str = text[start_idx:end_idx + 1]
    
    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        json_str = json_str.replace('```json', '').replace('```', '')
        try:
            return json.loads(json_str)
        except Exception:
            raise ValueError(f"Failed to parse JSON: {str(e)}")

def fix_mermaid(diagram: str) -> str:
    """Fix common Mermaid syntax issues."""
    diagram = diagram.replace('--->', '-->')
    diagram = re.sub(r'-->\|([^|]+)\|>', r'-->|\1|', diagram)
    diagram = diagram.replace(';', '')
    return diagram.strip()

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "DevMind Backend"}

@app.get("/")
def read_root():
    return {"status": "Running"}

@app.post("/generate")
async def generate_architecture(request: ArchitectureRequest):
    if not request.requirement.strip():
        raise HTTPException(status_code=400, detail="Requirement empty")

    try:
        # Corrected call for Google GenAI SDK
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=PROMPT_TEMPLATE.format(requirement=request.requirement),
        )

        raw_text = response.text
        data = extract_json(raw_text)

        if "mermaid_diagram" in data:
            data["mermaid_diagram"] = fix_mermaid(data["mermaid_diagram"])

        return data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))