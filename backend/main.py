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
    allow_origins=["https://aegisai.andama.me", "http://localhost:5173", "https://aegisai.andama.me/"],  # Add your frontend URLs
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

@app.get("/test-cors")
async def test_cors():
    return {"message": "CORS test"}
    
@app.get("/")
async def root():
    return {"message": "Welcome to Aegis NFT Portfolio Assistant!"}

@app.get("/test-cors")
async def test_cors():
    return {"message": "CORS test"}

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

# New enhanced endpoints using BitsCrunch V2 API
@app.get("/market-insights")
async def get_market_insights():
    """Get overall NFT market analytics and trends"""
    try:
        return {
            "analytics": bits_api.get_market_analytics(),
            "holders": bits_api.get_holder_insights(),
            "traders": bits_api.get_trader_insights(),
            "scores": bits_api.get_market_scores()
        }
    except Exception as e:
        return {"error": f"Failed to fetch market insights: {str(e)}"}

@app.get("/trending-collections")
async def get_trending_collections(blockchain: str = "ethereum", time_range: str = "24h"):
    """Get trending NFT collections"""
    try:
        return bits_api.get_collection_analytics(
            blockchain=blockchain,
            time_range=time_range,
            sort_by="volume",
            limit=20
        )
    except Exception as e:
        return {"error": f"Failed to fetch trending collections: {str(e)}"}

@app.get("/collection-traits/{collection_id}")
async def get_collection_traits(collection_id: str, blockchain: str = "ethereum"):
    """Get traits and rarity data for a collection"""
    try:
        return bits_api.get_collection_traits(
            contract_address=collection_id,
            blockchain=blockchain
        )
    except Exception as e:
        return {"error": f"Failed to fetch collection traits: {str(e)}"}

@app.get("/whale-activity/{collection_id}")
async def get_whale_activity(collection_id: str, blockchain: str = "ethereum"):
    """Get whale activity for a specific collection"""
    try:
        return bits_api.get_collection_whales(
            contract_address=collection_id,
            blockchain=blockchain,
            time_range="24h"
        )
    except Exception as e:
        return {"error": f"Failed to fetch whale activity: {str(e)}"}

@app.get("/marketplace-analytics")
async def get_marketplace_analytics(blockchain: str = "ethereum"):
    """Get marketplace analytics and performance"""
    try:
        return {
            "marketplace_stats": bits_api.get_marketplace_analytics(blockchain=blockchain),
            "marketplace_metadata": bits_api.get_marketplace_metadata()
        }
    except Exception as e:
        return {"error": f"Failed to fetch marketplace analytics: {str(e)}"}

@app.get("/wallet-profile/{wallet_address}")
async def get_wallet_profile(wallet_address: str):
    """Get comprehensive wallet profile including holdings and classifications"""
    try:
        return bits_api.get_wallet_profile(wallet=wallet_address)
    except Exception as e:
        return {"error": f"Failed to fetch wallet profile: {str(e)}"}

@app.get("/collection-categories")
async def get_collection_categories(blockchain: str = "ethereum"):
    """Get collections organized by categories"""
    try:
        return bits_api.get_collection_categories(
            blockchain=blockchain,
            sort_by="volume",
            limit=50
        )
    except Exception as e:
        return {"error": f"Failed to fetch collection categories: {str(e)}"}

@app.post("/advanced-collection-analysis")
async def advanced_collection_analysis(request: dict):
    """Get comprehensive collection analysis including all metrics"""
    contract_address = request.get("contract_address")
    blockchain = request.get("blockchain", "ethereum")
    
    if not contract_address:
        return {"error": "Missing contract_address"}
    
    try:
        return {
            "analytics": bits_api.get_collection_analytics(contract_address=[contract_address], blockchain=blockchain),
            "holders": bits_api.get_collection_holders(contract_address=[contract_address], blockchain=blockchain),  
            "traders": bits_api.get_collection_traders(contract_address=[contract_address], blockchain=blockchain),
            "scores": bits_api.get_collection_scores(contract_address=[contract_address], blockchain=blockchain),
            "whales": bits_api.get_collection_whales(contract_address=[contract_address], blockchain=blockchain),
            "washtrade": bits_api.get_collection_washtrade(contract_address=[contract_address], blockchain=blockchain),
            "profile": bits_api.get_collection_profile(contract_address=[contract_address], blockchain=blockchain)
        }
    except Exception as e:
        return {"error": f"Failed to fetch advanced collection analysis: {str(e)}"}

@app.post("/advanced-wallet-analysis") 
async def advanced_wallet_analysis(request: dict):
    """Get comprehensive wallet analysis including all metrics"""
    wallet_address = request.get("wallet_address")
    blockchain = request.get("blockchain", "ethereum")
    
    if not wallet_address:
        return {"error": "Missing wallet_address"}
    
    try:
        return {
            "analytics": bits_api.get_wallet_analytics(wallet=[wallet_address], blockchain=blockchain),
            "scores": bits_api.get_wallet_scores(wallet=[wallet_address], blockchain=blockchain),
            "traders": bits_api.get_wallet_traders(wallet=[wallet_address], blockchain=blockchain),
            "washtrade": bits_api.get_wallet_washtrade(wallet=[wallet_address], blockchain=blockchain),
            "profile": bits_api.get_wallet_profile(wallet=[wallet_address])
        }
    except Exception as e:
        return {"error": f"Failed to fetch advanced wallet analysis: {str(e)}"}



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
    1. If user asks casual greetings ("hi", "hello", "how are you") or general questions, use "general_conversation"
    2. If user asks about comparing wallets or "which wallet is better", use "wallet_comparison"
    3. If user asks about trending/hot/performing collections or "what's trending", use "market_trending"
    4. If user asks about risk/safety/security of holdings, use "risk_analysis"
    5. If user asks about "wallets" or "my wallets" generally, use "wallet_overview"
    6. If user asks about a specific collection stats, use "collection_stats"
    7. If user asks about overall portfolio/performance, use "portfolio_analysis"
    8. If user asks about market insights, general NFT market, or "how's the market", use "market_insights"
    9. If user asks about collection traits or rarity, use "collection_traits"
    10. If user asks about whale activity or big holders, use "whale_analysis"
    11. Only set needs_user_input=true if the query requires specific data we don't have
    12. For general questions about user's assets, always try to help with available data
    
    Available actions:
    - general_conversation: For greetings, casual chat, non-NFT questions
    - wallet_overview: Show general wallet health for all or specific wallets
    - wallet_comparison: Compare performance between multiple wallets
    - collection_stats: Show stats for specific collections
    - market_trending: Show trending collections and market performance
    - portfolio_analysis: Comprehensive portfolio analysis across all wallets
    - risk_analysis: Risk assessment of user's holdings and collections
    - market_insights: General NFT market analytics and trends
    - collection_traits: Show traits and rarity data for collections
    - whale_analysis: Show whale activity for collections or market
    - nft_valuation: Specific NFT pricing (needs collection + token ID)
    
    Respond with JSON (no extra text):
    {{
        "action": "general_conversation|wallet_overview|wallet_comparison|collection_stats|market_trending|portfolio_analysis|risk_analysis|market_insights|collection_traits|whale_analysis|nft_valuation",
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
        
        if action == "general_conversation":
            # No data fetching needed for general conversation
            data = {
                "user_context": {
                    "wallet_count": len(user_wallets),
                    "collection_count": len(user_collections),
                    "has_portfolio": len(user_wallets) > 0 or len(user_collections) > 0
                }
            }
        
        elif action == "wallet_overview":
            if user_wallets:
                # Get data for the first wallet or specified wallet
                target_wallet = decision.get("target_wallet") or user_wallets[0]
                try:
                    wallet_data = bits_api.get_wallet_health(target_wallet)
                    data = {
                        "wallet_count": len(user_wallets),
                        "current_wallet": target_wallet,
                        "wallet_data": wallet_data,
                        "has_data": bool(wallet_data and len(str(wallet_data).strip()) > 2)  # Check if more than just []
                    }
                except Exception as e:
                    data = {
                        "wallet_count": len(user_wallets),
                        "current_wallet": target_wallet,
                        "wallet_data": None,
                        "has_data": False,
                        "error": str(e)
                    }
        
        elif action == "wallet_comparison":
            if len(user_wallets) >= 2:
                # Compare up to 3 wallets for performance
                data = {"comparison": [], "total_compared": min(len(user_wallets), 3), "successful_fetches": 0}
                for i, wallet in enumerate(user_wallets[:3]):
                    try:
                        wallet_data = bits_api.get_wallet_health(wallet)
                        has_data = wallet_data and len(str(wallet_data).strip()) > 2
                        data["comparison"].append({
                            "wallet_name": f"Wallet {i+1}",
                            "address": wallet[:6] + "..." + wallet[-4:],
                            "data": wallet_data,
                            "full_address": wallet,
                            "has_data": has_data
                        })
                        if has_data:
                            data["successful_fetches"] += 1
                    except Exception as e:
                        data["comparison"].append({
                            "wallet_name": f"Wallet {i+1}",
                            "address": wallet[:6] + "..." + wallet[-4:],
                            "data": None,
                            "full_address": wallet,
                            "has_data": False,
                            "error": str(e)
                        })
            elif len(user_wallets) == 1:
                # If only one wallet, show its performance over time
                try:
                    wallet_data = bits_api.get_wallet_health(user_wallets[0])
                    has_data = wallet_data and len(str(wallet_data).strip()) > 2
                    data = {
                        "wallet_data": wallet_data,
                        "comparison_note": "Only one wallet available - showing detailed analysis",
                        "has_data": has_data
                    }
                except Exception as e:
                    data = {
                        "wallet_data": None,
                        "comparison_note": "Only one wallet available - showing detailed analysis",
                        "has_data": False,
                        "error": str(e)
                    }
        
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
        
        elif action == "market_trending":
            # Get trending collections and market performance
            try:
                data = {
                    "trending_collections": bits_api.get_trending_collections(),
                    "market_analytics": bits_api.get_market_insights(),
                    "top_performers": bits_api.get_top_performing_collections()
                }
            except Exception as e:
                data = {"error": f"Failed to fetch trending data: {str(e)}"}
        
        elif action == "market_insights":
            print("🔍 Processing market insights request...")
            
            # Extract blockchain and time_range from query
            blockchain = "ethereum"
            time_range = "24h"
            
            if "polygon" in request.query.lower():
                blockchain = "polygon"
            elif "bsc" in request.query.lower() or "binance" in request.query.lower():
                blockchain = "bsc"
            
            if "7d" in request.query.lower() or "week" in request.query.lower():
                time_range = "7d"
            elif "30d" in request.query.lower() or "month" in request.query.lower():
                time_range = "30d"
            
            print(f"📊 Getting market insights for {blockchain} over {time_range}")
            
            # Get comprehensive market insights using our new method
            try:
                data = bits_api.get_market_insights(blockchain=blockchain, time_range=time_range)
                print(f"🔍 Market insights response: {data}")
                
                # Add debugging info to data
                data["debug_info"] = {
                    "blockchain": blockchain,
                    "time_range": time_range,
                    "query": request.query,
                    "has_marketplace_data": data.get("has_marketplace_data", False)
                }
                
            except Exception as e:
                print(f"❌ Error in market insights: {str(e)}")
                data = {"error": f"Failed to fetch market insights: {str(e)}"}
        
        elif action == "collection_traits":
            # Get traits and rarity data
            if user_collections:
                data = {"traits_analysis": []}
                for collection in user_collections[:3]:
                    try:
                        traits_data = bits_api.get_collection_traits(collection)
                        data["traits_analysis"].append({
                            "collection_id": collection,
                            "traits": traits_data
                        })
                    except Exception as e:
                        continue
            else:
                data = {"message": "No collections available for traits analysis"}
        
        elif action == "whale_analysis":
            # Get whale activity data
            try:
                data = {"whale_activity": []}
                if user_collections:
                    for collection in user_collections[:3]:
                        try:
                            whale_data = bits_api.get_collection_whales(collection)
                            data["whale_activity"].append({
                                "collection_id": collection,
                                "whale_metrics": whale_data
                            })
                        except Exception as e:
                            continue
                else:
                    # General market whale activity
                    data["general_whale_activity"] = bits_api.get_market_whales()
            except Exception as e:
                data = {"error": f"Failed to fetch whale data: {str(e)}"}
        
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
        
        # If no data was fetched or data is empty, provide a helpful fallback
        if not data and user_wallets:
            try:
                wallet_data = bits_api.get_wallet_health(user_wallets[0])
                has_data = wallet_data and len(str(wallet_data).strip()) > 2
                data = {
                    "wallet_data": wallet_data,
                    "has_data": has_data,
                    "wallet_address": user_wallets[0][:6] + "..." + user_wallets[0][-4:]
                }
                action = "wallet_overview"
            except Exception as e:
                data = {
                    "wallet_data": None,
                    "has_data": False,
                    "error": str(e),
                    "wallet_address": user_wallets[0][:6] + "..." + user_wallets[0][-4:]
                }
                action = "wallet_overview"
        
        # Generate contextual response based on action type
        context_info = f"User has {len(user_wallets)} wallet(s) and {len(user_collections)} watched collection(s)."
        
        # Customize prompt based on action
        if action == "general_conversation":
            final_prompt = f"""
            User said: "{request.query}"
            Context: I am Aegis, an NFT Portfolio Assistant. {context_info}
            
            Respond to their greeting or general question in a friendly, helpful way:
            - Acknowledge their message warmly
            - Briefly introduce what I can help with (NFT analysis, portfolio tracking, risk assessment)
            - If they have wallets/collections, mention I can analyze their portfolio
            - If they don't have any data yet, suggest they add wallet addresses or collections
            - Keep it conversational and under 100 words
            - Don't end with "Stay safe in the NFT market!" for casual greetings
            
            Be natural and helpful, like a friendly financial advisor specializing in NFTs.
            """
        
        elif action == "wallet_comparison":
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
        
        elif action == "market_trending":
            final_prompt = f"""
            User asked: "{request.query}"
            Context: {context_info}
            Action: Market Trending Analysis
            Data: {data}
            
            Provide insights on trending collections and market performance:
            - Top performing collections right now
            - Market volume and activity trends
            - Emerging opportunities
            - What's hot in the NFT space
            Keep under 200 words. End with "Stay safe in the NFT market!"
            """
        
        elif action == "market_insights":
            # Check if we have marketplace data and customize the prompt accordingly
            has_marketplace_data = data.get("has_marketplace_data", False) if data else False
            marketplace_data = data.get("marketplace_data", {}) if data else {}
            
            if has_marketplace_data and marketplace_data:
                top_marketplace = marketplace_data.get("top_marketplace", {})
                all_marketplaces = marketplace_data.get("all_marketplaces", [])
                
                # Create a detailed marketplace summary
                marketplace_summary = f"Top Marketplace: {top_marketplace.get('name', 'Unknown')} with ${top_marketplace.get('volume', 0):,.2f} volume"
                if all_marketplaces:
                    marketplace_summary += f"\nAll Marketplaces: " + ", ".join([
                        f"{mp.get('name', 'Unknown')} (${mp.get('volume', 0):,.2f})" 
                        for mp in all_marketplaces[:3]
                    ])
                
                final_prompt = f"""
                User asked: "{request.query}"
                Context: {context_info}
                Action: NFT Market Insights with Real Marketplace Data
                
                CURRENT MARKETPLACE DATA:
                {marketplace_summary}
                Total Market Volume: ${marketplace_data.get('total_market_volume', 0):,.2f}
                Total Market Sales: {marketplace_data.get('total_market_sales', 0):,}
                Active Marketplaces: {marketplace_data.get('marketplace_count', 0)}
                
                Additional Market Data: {data}
                
                Based on the REAL marketplace data provided above, answer the user's specific question.
                If they asked about "which marketplace has the best volume" or similar, reference the actual data.
                Provide specific numbers and insights from the current market data.
                Keep under 200 words. End with "Stay safe in the NFT market!"
                """
            else:
                final_prompt = f"""
                User asked: "{request.query}"
                Context: {context_info}
                Action: NFT Market Insights
                Data: {data}
                
                Provide comprehensive market analysis based on available data:
                - Overall market health and trends
                - Trading volume and holder activity
                - Risk indicators and wash trading metrics
                - Market outlook and recommendations
                
                Note: If specific marketplace data was requested but not available, mention this limitation.
                Keep under 200 words. End with "Stay safe in the NFT market!"
                """
        
        elif action == "collection_traits":
            final_prompt = f"""
            User asked: "{request.query}"
            Context: {context_info}
            Action: Collection Traits Analysis
            Data: {data}
            
            Analyze collection traits and rarity:
            - Most valuable and rare traits
            - Trait distribution and rarity percentages
            - Investment opportunities based on traits
            - Recommendations for trait-based decisions
            Keep under 200 words. End with "Stay safe in the NFT market!"
            """
        
        elif action == "whale_analysis":
            final_prompt = f"""
            User asked: "{request.query}"
            Context: {context_info}
            Action: Whale Activity Analysis
            Data: {data}
            
            Analyze whale activity and large holder behavior:
            - Major whale movements and transactions
            - Impact on collection prices and volume
            - Whale accumulation or distribution patterns
            - What whale activity means for retail investors
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
            
            IMPORTANT: Check if the data is empty, null, or just contains "[]" or similar empty values.
            
            If the data is empty or shows no NFT activity:
            - Explain that the wallet appears to have no NFT activity or data
            - Suggest this could mean: no NFTs owned, new wallet, or privacy settings
            - Offer to help with other wallets if they have multiple
            - Provide general advice about getting started with NFTs
            - Keep encouraging and helpful tone
            
            If the data has content:
            - Provide a helpful, conversational response about their {action.replace('_', ' ')}
            - Be specific about the data shown
            - Highlight key insights and numbers
            - Give actionable advice if relevant
            
            Keep under 200 words. End with "Stay safe in the NFT market!"
            
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
        # Improved fallback response if AI fails
        if user_wallets:
            try:
                fallback_data = bits_api.get_wallet_health(user_wallets[0])
                
                # Check if wallet has meaningful data
                if fallback_data and len(str(fallback_data).strip()) > 2 and str(fallback_data) != "[]":
                    return {
                        "response": f"I found information about your wallet ({user_wallets[0][:6]}...{user_wallets[0][-4:]}). Here's a quick overview: {str(fallback_data)[:200]}... Stay safe in the NFT market!",
                        "action_taken": "fallback_wallet_check",
                        "reasoning": f"AI processing failed, showing wallet data: {str(e)}"
                    }
                else:
                    return {
                        "response": f"I checked your wallet ({user_wallets[0][:6]}...{user_wallets[0][-4:]}), but it appears to have no NFT activity or the data is currently unavailable. This could be a new wallet, or you might not have any NFTs yet. Feel free to ask about other wallets if you have multiple ones! Stay safe in the NFT market!",
                        "action_taken": "fallback_empty_wallet",
                        "reasoning": f"AI processing failed, wallet appears empty: {str(e)}"
                    }
            except Exception as wallet_error:
                return {
                    "response": f"I'm having trouble accessing your wallet data right now. This could be due to network issues or the wallet address format. Please make sure your wallet address is correct and try again in a moment. Stay safe in the NFT market!",
                    "action_taken": "fallback_error",
                    "reasoning": f"Both AI and wallet check failed: {str(e)}, {str(wallet_error)}"
                }
        
        # If no wallets available
        return {
            "response": "I'd love to help analyze your NFT portfolio! To get started, please add your wallet address to your profile, then ask me questions like 'how are my wallets doing?' or 'show me my portfolio performance.'",
            "action_taken": "fallback_no_wallets",
            "reasoning": f"AI failed and no wallets available: {str(e)}"
        }

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

