from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI
import os
import json
import re

# Load .env file
load_dotenv()

# Configure NVIDIA API
api_key = os.getenv("NVIDIA_API_KEY")
if not api_key:
    raise RuntimeError("NVIDIA_API_KEY not found in .env file!")

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=api_key
)

app = FastAPI(title="DevMind Solution Architect API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins — tighten this after testing by replacing * with your Vercel URL e.g. "https://devmind.vercel.app"
    allow_credentials=False,  # Must be False when allow_origins=["*"]
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
    
    # 1. Try to find the first '{' and the last '}'
    start_idx = text.find('{')
    end_idx = text.rfind('}')
    
    if start_idx == -1 or end_idx == -1:
        raise ValueError("No JSON object found in response")
        
    json_str = text[start_idx:end_idx + 1]
    
    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        # 2. If it fails, try cleaning out common markdown artifacts
        json_str = json_str.replace('```json', '').replace('```', '')
        try:
            return json.loads(json_str)
        except:
            raise ValueError(f"Failed to parse JSON: {str(e)}")

def fix_mermaid(diagram: str) -> str:
    """Fix common Mermaid syntax issues."""
    diagram = diagram.replace('--->', '-->')
    diagram = re.sub(r'-->\|([^|]+)\|>', r'-->|\1|', diagram)
    diagram = diagram.replace(';', '')
    return diagram.strip()

@app.get("/")
def read_root():
    return {"status": "Running"}

@app.post("/generate")
async def generate_architecture(request: ArchitectureRequest):
    if not request.requirement.strip():
        raise HTTPException(status_code=400, detail="Requirement empty")

    try:
        completion = client.chat.completions.create(
            model="meta/llama-3.1-405b-instruct",
            messages=[
                {"role": "system", "content": "You are an AWS Architect. Output JSON only."},
                {"role": "user", "content": PROMPT_TEMPLATE.format(requirement=request.requirement)}
            ],
            temperature=0.2,
        )

        raw_text = completion.choices[0].message.content
        data = extract_json(raw_text)

        if "mermaid_diagram" in data:
            data["mermaid_diagram"] = fix_mermaid(data["mermaid_diagram"])

        return data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))