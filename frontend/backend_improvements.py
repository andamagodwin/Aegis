# Improved smart_query endpoint
@app.post("/smart-query")
async def smart_query(request: SmartQueryRequest):
    """
    Smart query that can fetch user's wallet data automatically
    """
    user_wallets = request.user_wallets
    user_collections = request.user_collections
    
    # IMPROVED: More specific and directive AI prompt
    analysis_prompt = f"""
    User query: "{request.query}"
    Available data:
    - User's wallet addresses: {user_wallets} ({len(user_wallets)} wallets)
    - User's watchlist collections: {user_collections} ({len(user_collections)} collections)
    
    IMPORTANT RULES:
    1. If user asks about "wallets" or "my wallets" and we have wallet addresses, use action "wallet_overview"
    2. If user asks about a specific collection and we have collections, use "collection_stats"
    3. If user asks about portfolio/performance and we have wallets, use "portfolio_analysis"
    4. Only set needs_user_input=true if the query requires specific data we don't have
    5. For general questions about user's assets, always try to help with available data
    
    Available actions:
    - wallet_overview: Show general wallet health for all or specific wallets
    - collection_stats: Show stats for specific collections
    - portfolio_analysis: Comprehensive portfolio analysis across all wallets
    - nft_valuation: Specific NFT pricing (needs collection + token ID)
    
    Respond with JSON (no extra text):
    {{
        "action": "wallet_overview|collection_stats|portfolio_analysis|nft_valuation",
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
        
        # Generate contextual response
        context_info = f"User has {len(user_wallets)} wallet(s) and {len(user_collections)} watched collection(s)."
        
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
