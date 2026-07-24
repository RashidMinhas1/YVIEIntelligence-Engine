from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer, util
import torch

app = FastAPI(title="YouTube Viral Intelligence - NLP Microservice")

# Load a fast, lightweight sentence transformer model
model = SentenceTransformer('all-MiniLM-L6-v2')

class SimilarityRequest(BaseModel):
    query: str
    candidates: List[str]

class ClassifyRequest(BaseModel):
    text: str
    categories: List[str]

@app.get("/health")
def health_check():
    return {"status": "ok", "model": "all-MiniLM-L6-v2"}

@app.post("/api/semantic/similarity")
def calculate_similarity(req: SimilarityRequest):
    if not req.candidates:
        return {"similarities": []}
        
    # Compute embeddings
    query_emb = model.encode(req.query, convert_to_tensor=True)
    candidates_emb = model.encode(req.candidates, convert_to_tensor=True)
    
    # Compute cosine similarities
    cosine_scores = util.cos_sim(query_emb, candidates_emb)[0]
    
    # Convert to list of floats (0 to 100)
    scores = [(score.item() * 100) for score in cosine_scores]
    # Bound between 0 and 100
    scores = [max(0, min(100, s)) for s in scores]
    
    return {"similarities": scores}

@app.post("/api/semantic/classify")
def classify_text(req: ClassifyRequest):
    if not req.categories:
        return {"category": "Unknown", "score": 0}
        
    text_emb = model.encode(req.text, convert_to_tensor=True)
    cats_emb = model.encode(req.categories, convert_to_tensor=True)
    
    cosine_scores = util.cos_sim(text_emb, cats_emb)[0]
    best_idx = torch.argmax(cosine_scores).item()
    
    best_category = req.categories[best_idx]
    best_score = max(0, min(100, cosine_scores[best_idx].item() * 100))
    
    return {
        "category": best_category,
        "score": best_score,
        "all_scores": {cat: max(0, min(100, score.item() * 100)) for cat, score in zip(req.categories, cosine_scores)}
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
