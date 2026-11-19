from fastapi import FastAPI

app = FastAPI(title="DevMind Backend API")

@app.get("/")
def read_root():
    return {"message": "Welcome to DevMind API"}

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "DevMind Backend"}
