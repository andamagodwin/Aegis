from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
from bitscrunch import BitsCrunchAPI
from typing import List, Optional

load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)
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
    # First, let AI determine what data is needed
    analysis_prompt = f"""
    User query: "{request.query}"
    Available context: wallet_address={request.wallet_address}, collection_id={request.collection_id}, token_id={request.token_id}
    
    Analyze this query and respond with JSON indicating what NFT data is needed:
    {{
        "action": "wallet_health|collection_stats|nft_valuation|risk_scores",
        "reasoning": "brief explanation",
        "missing_info": ["list any missing required parameters"]
    }}
    
    Actions:
    - wallet_health: for wallet analysis, portfolio health, wallet performance
    - collection_stats: for collection floor price, volume, general collection info
    - nft_valuation: for specific NFT pricing (needs both collection_id and token_id)
    - risk_scores: for risk analysis of collections
    """

    # Get AI decision on what data to fetch
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GRADIENTAI_KEY}"
    }

    decision_payload = {
        "messages": [
            {
                "role": "user",
                "content": analysis_prompt
            }
        ],
        "stream": False,
        "include_functions_info": False,
        "include_retrieval_info": False,
        "include_guardrails_info": False
    }

    decision_response = requests.post(GRADIENTAI_URL, headers=headers, json=decision_payload)
    
    try:
        decision_data = decision_response.json()
        decision_content = decision_data["choices"][0]["message"]["content"]
        
        # Parse the JSON response (you might want to add better JSON parsing)
        import json
        import re
        json_match = re.search(r'\{.*\}', decision_content, re.DOTALL)
        if json_match:
            decision = json.loads(json_match.group())
        else:
            # Fallback if JSON parsing fails
            decision = {"action": "risk_scores", "reasoning": "default fallback"}
            
    except Exception as e:
        return {"error": f"Failed to parse AI decision: {str(e)}"}

    # Check for missing information
    if "missing_info" in decision and decision["missing_info"]:
        return {
            "error": "Missing required information",
            "missing": decision["missing_info"],
            "message": "Please provide the missing information to continue."
        }

    # Fetch data based on AI decision
    data = None
    action = decision.get("action", "risk_scores")
    
    try:
        if action == "wallet_health" and request.wallet_address:
            data = bits_api.get_wallet_health(request.wallet_address)
        elif action == "nft_valuation" and request.collection_id and request.token_id:
            data = bits_api.get_nft_valuation(request.token_id, request.collection_id)
        elif action == "collection_stats" and request.collection_id:
            data = bits_api.get_collection_stats(request.collection_id)
        else:
            data = bits_api.get_risk_scores(request.collection_id or "default")
    except Exception as e:
        return {"error": f"Failed to fetch NFT data: {str(e)}"}

    # Construct prompt for the final response
    user_prompt = (
        f"User asked: '{request.query}'. "
        f"Based on analysis, I fetched {action} data: {data}. "
        f"AI reasoning: {decision.get('reasoning', '')}. "
        f"Provide a helpful response in a friendly, concise tone under 200 words, "
        f"focusing on the key insights. End with 'Stay safe in the NFT market!'"
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



# New models for user management
class UserProfile(BaseModel):
    user_id: str
    wallet_addresses: List[str] = []
    watchlist_collections: List[str] = []
    preferences: dict = {}

class SmartQueryRequest(BaseModel):
    query: str
    user_id: Optional[str] = None
    user_wallets: List[str] = []  # Frontend sends wallets directly
    user_collections: List[str] = []  # Frontend sends collections directly

# Enhanced query endpoint that uses user profile data
@app.post("/smart-query")
async def smart_query(request: SmartQueryRequest):
    """
    Smart query that can fetch user's wallet data automatically
    """
    # Use wallets and collections sent from frontend
    user_wallets = request.user_wallets
    user_collections = request.user_collections
    
    # AI decides what data to fetch and from where
    analysis_prompt = f"""
    User query: "{request.query}"
    User's wallet addresses: {user_wallets}
    User's watchlist collections: {user_collections}
    
    Analyze this query and determine:
    1. What NFT data is needed
    2. Which specific wallet/collection to use (if any)
    3. If additional info is needed from the user
    
    Respond with JSON:
    {{
        "action": "wallet_health|collection_stats|nft_valuation|portfolio_overview",
        "target_wallet": "wallet_address_to_use_or_null",
        "target_collection": "collection_id_to_use_or_null",
        "target_token": "token_id_if_needed_or_null",
        "reasoning": "brief explanation",
        "needs_user_input": false
    }}
    """
    
    # Get AI decision
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GRADIENTAI_KEY}"
    }
    
    decision_payload = {
        "messages": [{"role": "user", "content": analysis_prompt}],
        "stream": False,
        "include_functions_info": False,
        "include_retrieval_info": False,
        "include_guardrails_info": False
    }
    
    try:
        decision_response = requests.post(GRADIENTAI_URL, headers=headers, json=decision_payload)
        decision_data = decision_response.json()
        decision_content = decision_data["choices"][0]["message"]["content"]
        
        import json
        import re
        json_match = re.search(r'\{.*\}', decision_content, re.DOTALL)
        if json_match:
            decision = json.loads(json_match.group())
        else:
            return {"error": "Could not parse AI decision"}
            
        # If AI needs user input, return early
        if decision.get("needs_user_input", False):
            return {
                "needs_input": True,
                "message": "I need more specific information to help you.",
                "reasoning": decision.get("reasoning", "")
            }
        
        # Fetch the appropriate data
        data = None
        action = decision.get("action")
        
        if action == "wallet_health" and decision.get("target_wallet"):
            data = bits_api.get_wallet_health(decision["target_wallet"])
        elif action == "collection_stats" and decision.get("target_collection"):
            data = bits_api.get_collection_stats(decision["target_collection"])
        elif action == "nft_valuation" and decision.get("target_collection") and decision.get("target_token"):
            data = bits_api.get_nft_valuation(decision["target_token"], decision["target_collection"])
        elif action == "portfolio_overview" and user_wallets:
            # Aggregate data from multiple wallets
            data = {"wallets": []}
            for wallet in user_wallets[:3]:  # Limit to first 3 wallets
                wallet_data = bits_api.get_wallet_health(wallet)
                data["wallets"].append({"address": wallet, "data": wallet_data})
        
        # Generate final response
        final_prompt = f"""
        User asked: "{request.query}"
        AI Analysis: {decision.get('reasoning', '')}
        Data fetched: {data}
        
        Provide a helpful, conversational response under 200 words.
        Focus on key insights and actionable advice.
        End with "Stay safe in the NFT market!"
        """
        
        final_payload = {
            "messages": [{"role": "user", "content": final_prompt}],
            "stream": False,
            "include_functions_info": False,
            "include_retrieval_info": False,
            "include_guardrails_info": False
        }
        
        final_response = requests.post(GRADIENTAI_URL, headers=headers, json=final_payload)
        final_data = final_response.json()
        llm_response = final_data["choices"][0]["message"]["content"]
        
        return {
            "response": llm_response,
            "action_taken": action,
            "data_source": decision.get("target_wallet") or decision.get("target_collection"),
            "reasoning": decision.get("reasoning")
        }
        
    except Exception as e:
        return {"error": f"Smart query failed: {str(e)}"}

# Appwrite integration endpoints (you'll implement these)
@app.post("/user/profile")
async def save_user_profile(profile: UserProfile):
    """Save user profile to Appwrite"""
    # TODO: Implement Appwrite integration
    return {"message": "Profile saved successfully"}

@app.get("/user/profile/{user_id}")
async def get_user_profile(user_id: str):
    """Get user profile from Appwrite"""
    # TODO: Implement Appwrite integration
    return {"user_id": user_id, "wallet_addresses": [], "watchlist_collections": []}

