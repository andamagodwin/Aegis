from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel
import requests
import os
from bitscrunch import BitsCrunchAPI
from fastapi.middleware.cors import CORSMiddleware
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
    user_wallets = request.user_wallets
    user_collections = request.user_collections
    
    # IMPROVED: More specific and directive AI prompt with granular actions
    analysis_prompt = f"""
    User query: "{request.query}"
    Available data:
    - User's wallet addresses: {user_wallets} ({len(user_wallets)} wallets)
    - User's watchlist collections: {user_collections} ({len(user_collections)} collections)
    
    IMPORTANT RULES:
    1. If user asks about comparing wallets or "which wallet is better", use "wallet_comparison"
    2. If user asks about trending/hot/performing collections, use "collection_performance"
    3. If user asks about risk/safety/security of holdings, use "risk_analysis"
    4. If user asks about "wallets" or "my wallets" generally, use "wallet_overview"
    5. If user asks about a specific collection stats, use "collection_stats"
    6. If user asks about overall portfolio/performance, use "portfolio_analysis"
    7. Only set needs_user_input=true if the query requires specific data we don't have
    8. For general questions about user's assets, always try to help with available data
    
    Available actions:
    - wallet_overview: Show general wallet health for all or specific wallets
    - wallet_comparison: Compare performance between multiple wallets
    - collection_stats: Show stats for specific collections
    - collection_performance: Show trending/performing collections from watchlist
    - portfolio_analysis: Comprehensive portfolio analysis across all wallets
    - risk_analysis: Risk assessment of user's holdings and collections
    - nft_valuation: Specific NFT pricing (needs collection + token ID)
    
    Respond with JSON (no extra text):
    {{
        "action": "wallet_overview|wallet_comparison|collection_stats|collection_performance|portfolio_analysis|risk_analysis|nft_valuation",
        "target_wallet": "specific_wallet_or_first_wallet_or_null",
        "target_collection": "collection_id_or_null", 
        "reasoning": "why this action was chosen",
        "needs_user_input": false,
        "response_focus": "what the response should emphasize"
    }}
    """
    
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
        # More robust JSON extraction
        json_match = re.search(r'\{[\s\S]*\}', decision_content, re.DOTALL)
        if json_match:
            decision = json.loads(json_match.group())
        else:
            # Fallback: assume wallet overview if we have wallets
            if user_wallets:
                decision = {
                    "action": "wallet_overview",
                    "target_wallet": user_wallets[0],
                    "reasoning": "Fallback to wallet overview",
                    "needs_user_input": False,
                    "response_focus": "wallet performance"
                }
            else:
                return {
                    "needs_input": True,
                    "message": "I need your wallet address or collection information to help you.",
                    "reasoning": "No user data available"
                }
        
        # IMPROVED: Only return needs_input if absolutely necessary
        if decision.get("needs_user_input", False) and not user_wallets and not user_collections:
            return {
                "needs_input": True,
                "message": "I need your wallet address or collection information to help you better.",
                "reasoning": decision.get("reasoning", "")
            }
        
        # Fetch data based on action
        data = None
        action = decision.get("action")
        
        if action == "wallet_overview":
            if user_wallets:
                # Get data for the first wallet or specified wallet
                target_wallet = decision.get("target_wallet") or user_wallets[0]
                data = bits_api.get_wallet_health(target_wallet)
                data["wallet_count"] = len(user_wallets)
                data["current_wallet"] = target_wallet
        
        elif action == "wallet_comparison":
            if len(user_wallets) >= 2:
                # Compare up to 3 wallets for performance
                data = {"comparison": [], "total_compared": min(len(user_wallets), 3)}
                for i, wallet in enumerate(user_wallets[:3]):
                    try:
                        wallet_data = bits_api.get_wallet_health(wallet)
                        data["comparison"].append({
                            "wallet_name": f"Wallet {i+1}",
                            "address": wallet[:6] + "..." + wallet[-4:],
                            "data": wallet_data,
                            "full_address": wallet
                        })
                    except Exception as e:
                        continue
            elif len(user_wallets) == 1:
                # If only one wallet, show its performance over time
                data = bits_api.get_wallet_health(user_wallets[0])
                data["comparison_note"] = "Only one wallet available - showing detailed analysis"
        
        elif action == "collection_performance":
            if user_collections:
                # Get performance data for watchlisted collections
                data = {"collections": [], "total_collections": len(user_collections)}
                for collection in user_collections[:5]:  # Limit to 5 for performance
                    try:
                        collection_data = bits_api.get_collection_stats(collection)
                        data["collections"].append({
                            "collection_id": collection,
                            "stats": collection_data
                        })
                    except Exception as e:
                        continue
            else:
                # Fallback: get trending collections (you might want to implement this in BitsCrunch API)
                data = {"message": "No watchlist collections found", "suggestion": "Add collections to your watchlist"}
        
        elif action == "risk_analysis":
            # Comprehensive risk analysis
            data = {"risk_summary": {"wallets": [], "collections": []}}
            
            # Analyze wallet risks
            if user_wallets:
                for i, wallet in enumerate(user_wallets[:3]):
                    try:
                        # Get risk scores for wallet
                        risk_data = bits_api.get_risk_scores(wallet)
                        wallet_health = bits_api.get_wallet_health(wallet)
                        data["risk_summary"]["wallets"].append({
                            "wallet": f"Wallet {i+1}",
                            "address": wallet[:6] + "..." + wallet[-4:],
                            "risk_score": risk_data,
                            "health_indicators": wallet_health
                        })
                    except Exception as e:
                        continue
            
            # Analyze collection risks
            if user_collections:
                for collection in user_collections[:3]:
                    try:
                        risk_data = bits_api.get_risk_scores(collection)
                        collection_stats = bits_api.get_collection_stats(collection)
                        data["risk_summary"]["collections"].append({
                            "collection_id": collection,
                            "risk_score": risk_data,
                            "market_data": collection_stats
                        })
                    except Exception as e:
                        continue
        
        elif action == "portfolio_analysis":
            if user_wallets:
                # Aggregate data from multiple wallets
                data = {"portfolio_summary": [], "total_wallets": len(user_wallets)}
                for i, wallet in enumerate(user_wallets[:3]):  # Limit to 3 for performance
                    try:
                        wallet_data = bits_api.get_wallet_health(wallet)
                        data["portfolio_summary"].append({
                            "wallet": f"Wallet {i+1}",
                            "address": wallet[:6] + "..." + wallet[-4:],  # Shortened for display
                            "data": wallet_data
                        })
                    except Exception as e:
                        continue
        
        elif action == "collection_stats":
            target_collection = decision.get("target_collection")
            if target_collection:
                data = bits_api.get_collection_stats(target_collection)
            elif user_collections:
                # Use first collection if no specific one mentioned
                data = bits_api.get_collection_stats(user_collections[0])
        
        elif action == "nft_valuation":
            if decision.get("target_collection") and decision.get("target_token"):
                data = bits_api.get_nft_valuation(decision["target_token"], decision["target_collection"])
        
        # If no data was fetched, provide a helpful fallback
        if not data and user_wallets:
            data = bits_api.get_wallet_health(user_wallets[0])
            action = "wallet_overview"
        
        # Generate contextual response based on action type
        context_info = f"User has {len(user_wallets)} wallet(s) and {len(user_collections)} watched collection(s)."
        
        # Customize prompt based on action
        if action == "wallet_comparison":
            final_prompt = f"""
            User asked: "{request.query}"
            Context: {context_info}
            Action: Wallet Comparison Analysis
            Data: {data}
            
            Compare the wallets based on the data provided. Highlight:
            - Performance differences between wallets
            - Which wallet is performing better and why
            - Key metrics to focus on
            - Recommendations for optimization
            Keep under 200 words. End with "Stay safe in the NFT market!"
            """
        
        elif action == "collection_performance":
            final_prompt = f"""
            User asked: "{request.query}"
            Context: {context_info}
            Action: Collection Performance Analysis
            Data: {data}
            
            Analyze the performance of their watchlisted collections:
            - Which collections are trending up/down
            - Volume and price movements
            - Market sentiment indicators
            - Recommendations for collection management
            Keep under 200 words. End with "Stay safe in the NFT market!"
            """
        
        elif action == "risk_analysis":
            final_prompt = f"""
            User asked: "{request.query}"
            Context: {context_info}
            Action: Risk Assessment
            Data: {data}
            
            Provide a comprehensive risk analysis focusing on:
            - Overall portfolio risk level
            - High-risk vs low-risk holdings
            - Diversification recommendations
            - Warning signs to watch for
            - Actionable steps to reduce risk
            Keep under 200 words. End with "Stay safe in the NFT market!"
            """
        
        else:
            # Default prompt for other actions
            final_prompt = f"""
            User asked: "{request.query}"
            Context: {context_info}
            Action taken: {action}
            Focus area: {decision.get('response_focus', 'general overview')}
            Data: {data}
            
            Provide a helpful, conversational response about their {action.replace('_', ' ')}:
            - Be specific about the data shown
            - Highlight key insights and numbers
            - Give actionable advice if relevant
            - Keep under 200 words
            - End with "Stay safe in the NFT market!"
            
            If the data shows multiple wallets, mention that this is from their portfolio.
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
        # Fallback response if AI fails
        if user_wallets:
            try:
                fallback_data = bits_api.get_wallet_health(user_wallets[0])
                return {
                    "response": f"I found information about your wallet. Here's a quick overview: {str(fallback_data)[:200]}... Stay safe in the NFT market!",
                    "action_taken": "fallback_wallet_check",
                    "reasoning": f"AI processing failed: {str(e)}"
                }
            except:
                pass
        
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

