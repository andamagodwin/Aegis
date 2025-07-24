from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel
import requests
import os
from bitscrunch import BitsCrunchAPI

load_dotenv()

app = FastAPI()
BITSCRUNCH_API_KEY = os.getenv("BITSCRUNCH_API_KEY")
GRADIENTAI_KEY = os.getenv("MODEL_ACCESS_KEY")
GRADIENTAI_URL = "https://tofi3x35k5q62sti3ofx4lcu.agents.do-ai.run/api/v1/chat/completions"

bits_api = BitsCrunchAPI(BITSCRUNCH_API_KEY)

class QueryRequest(BaseModel):
    query: str
    wallet_address: str = None
    collection_id: str = None
    token_id: str = None
    
@app.get("/")
async def root():
    return {"message": "Welcome to Aegis NFT Portfolio Assistant!"}

@app.post("/query")
async def process_query(request: QueryRequest):
    # Fetch bitsCrunch data
    if request.wallet_address:
        data = bits_api.get_wallet_health(request.wallet_address)
    elif request.collection_id and request.token_id:
        data = bits_api.get_nft_valuation(request.token_id, request.collection_id)
    elif request.collection_id:
        data = bits_api.get_collection_stats(request.collection_id)
    else:
        data = bits_api.get_risk_scores(request.collection_id or "default")

    # Construct prompt for the agent
    user_prompt = (
        f"User asked: '{request.query}'. "
        f"Here is some NFT-related data: {data}. "
        f"Summarize this in a friendly, concise tone under 200 words, "
        f"focusing on price, risk, wallet health. End with 'Stay safe in the NFT market!'"
    )

    # Agent API call
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GRADIENTAI_KEY}"
    }

    payload = {
        "messages": [
            {
                "role": "user",
                "content": user_prompt
            }
        ],
        "stream": False,
        "include_functions_info": False,
        "include_retrieval_info": False,
        "include_guardrails_info": False
    }

    response = requests.post(GRADIENTAI_URL, headers=headers, json=payload)
    response_data = response.json()

    try:
        llm_response = response_data["choices"][0]["message"]["content"]
    except (KeyError, IndexError):
        return {"error": "Failed to parse LLM response", "raw": response_data}

    return {"response": llm_response}


@app.post("/get-collection-stats")
async def get_collection_stats(request: dict):
    collection_id = request.get("collection_id")
    if not collection_id:
        return {"error": "Missing collection_id"}
    return bits_api.get_collection_stats(collection_id)

@app.post("/get-wallet-health")
async def get_wallet_health(request: dict):
    wallet_address = request.get("wallet_address")
    if not wallet_address:
        return {"error": "Missing wallet_address"}
    return bits_api.get_wallet_health(wallet_address)

@app.post("/get-nft-valuation")
async def get_nft_valuation(request: dict):
    token_id = request.get("token_id")
    collection_id = request.get("collection_id")
    if not (token_id and collection_id):
        return {"error": "Missing token_id or collection_id"}
    return bits_api.get_nft_valuation(collection_id, token_id)

@app.get("/chart-data/{collection_id}")
async def get_chart_data(collection_id: str):
    stats = bits_api.get_collection_stats(collection_id)
    # Parse real data (replace with actual fields)
    chart = {
        "type": "line",
        "data": {
            "labels": ["Day 1", "Day 7", "Day 14", "Day 21", "Day 30"],
            "datasets": [{
                "label": f"{collection_id} Floor Price",
                "data": [10, 12, 15, 14, 15.5],  # Replace with stats.get("floor_price", [])
                "borderColor": "#2196F3",
                "backgroundColor": "rgba(33, 150, 243, 0.2)",
                "fill": True
            }]
        },
        "options": {
            "responsive": True,
            "scales": {
                "y": {"title": {"display": True, "text": "Price (ETH)"}},
                "x": {"title": {"display": True, "text": "Time"}}
            }
        }
    }
    return chart
