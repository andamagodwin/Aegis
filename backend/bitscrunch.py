import requests
from fastapi import HTTPException

class BitsCrunchAPI:
    def __init__(self, api_key):
        self.base_url = "https://api.unleashnfts.com/api/v2"
        self.headers = {
            "x-api-key": f"{api_key}",
            "Content-Type": "application/json"
        }

    def _make_request(self, endpoint, params=None):
        try:
            response = requests.get(f"{self.base_url}/{endpoint}", headers=self.headers, params=params)
            response.raise_for_status()
            data = response.json()
            return data.get("data", [])
        except requests.exceptions.HTTPError as e:
            raise HTTPException(status_code=response.status_code, detail=f"bitsCrunch API error: {str(e)}")
        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=500, detail=f"Request failed: {str(e)}")

    def get_collection_stats(self, contract_address=None, slug_name=None, blockchain="ethereum", time_range="all", sort_by="sales", offset=0, limit=30):
        """Fetch stats for an NFT collection."""
        params = {
            "blockchain": blockchain,
            "time_range": time_range,
            "sort_by": sort_by,
            "offset": offset,
            "limit": limit
        }
        if contract_address:
            params["contract_address"] = contract_address
        if slug_name:
            params["slug_name"] = slug_name
        return self._make_request("nft/collection/analytics", params)

    def get_wallet_health(self, wallet, blockchain="ethereum", time_range="all", sort_by="portfolio_value", offset=0, limit=30):
        """Fetch wallet health and risk scores."""
        params = {
            "wallet": wallet,
            "blockchain": blockchain,
            "time_range": time_range,
            "sort_by": sort_by,
            "offset": offset,
            "limit": limit
        }
        return self._make_request("nft/wallet/scores", params)

    def get_nft_valuation(self, contract_address, token_id, blockchain="ethereum"):
        """Fetch valuation for a specific NFT."""
        params = {
            "contract_address": contract_address,
            "token_id": token_id,
            "blockchain": blockchain
        }
        return self._make_request("nft/liquify/price_estimate", params)

    def get_risk_scores(self, contract_address=None, slug_name=None, blockchain="ethereum", time_range="24h", sort_by="washtrade_volume", offset=0, limit=30):
        """Fetch risk scores for a collection."""
        params = {
            "blockchain": blockchain,
            "time_range": time_range,
            "sort_by": sort_by,
            "offset": offset,
            "limit": limit
        }
        if contract_address:
            params["contract_address"] = contract_address
        if slug_name:
            params["slug_name"] = slug_name
        return self._make_request("nft/collection/washtrade", params)

    # Market Insights Methods
    def get_market_analytics(self, blockchain="ethereum", time_range="24h"):
        """Get overall NFT market analytics and trends."""
        params = {
            "blockchain": blockchain,
            "time_range": time_range
        }
        return self._make_request("nft/market-insights/analytics", params)

    def get_holder_insights(self, blockchain="ethereum", time_range="24h"):
        """Get aggregated holder metrics and trends."""
        params = {
            "blockchain": blockchain,
            "time_range": time_range
        }
        return self._make_request("nft/market-insights/holders", params)

    def get_trader_insights(self, blockchain="ethereum", time_range="24h"):
        """Get aggregated trader metrics and trends."""
        params = {
            "blockchain": blockchain,
            "time_range": time_range
        }
        return self._make_request("nft/market-insights/traders", params)

    def get_market_scores(self, blockchain="ethereum", time_range="24h"):
        """Get aggregated score metrics and trends."""
        params = {
            "blockchain": blockchain,
            "time_range": time_range
        }
        return self._make_request("nft/market-insights/scores", params)

    def get_washtrade_insights(self, blockchain="ethereum", time_range="24h"):
        """Get aggregated washtrade metrics and trends."""
        params = {
            "blockchain": blockchain,
            "time_range": time_range
        }
        return self._make_request("nft/market-insights/washtrade", params)

    # Collection Advanced Methods
    def get_collection_analytics(self, contract_address=None, blockchain="ethereum", time_range="24h", sort_by="sales", offset=0, limit=30):
        """Get detailed collection analytics with trends."""
        params = {
            "blockchain": blockchain,
            "time_range": time_range,
            "sort_by": sort_by,
            "offset": offset,
            "limit": limit
        }
        if contract_address:
            params["contract_address"] = contract_address
        return self._make_request("nft/collection/analytics", params)

    def get_collection_holders(self, contract_address=None, blockchain="ethereum", time_range="24h", sort_by="holders", offset=0, limit=30):
        """Get collection holder distribution and trends."""
        params = {
            "blockchain": blockchain,
            "time_range": time_range,
            "sort_by": sort_by,
            "offset": offset,
            "limit": limit
        }
        if contract_address:
            params["contract_address"] = contract_address
        return self._make_request("nft/collection/holders", params)

    def get_collection_traders(self, contract_address=None, blockchain="ethereum", time_range="24h", sort_by="traders", offset=0, limit=30):
        """Get collection trader metrics and trends."""
        params = {
            "blockchain": blockchain,
            "time_range": time_range,
            "sort_by": sort_by,
            "offset": offset,
            "limit": limit
        }
        if contract_address:
            params["contract_address"] = contract_address
        return self._make_request("nft/collection/traders", params)

    def get_collection_scores(self, contract_address=None, blockchain="ethereum", time_range="24h", sort_by="marketcap", offset=0, limit=30):
        """Get collection performance scores and metrics."""
        params = {
            "blockchain": blockchain,
            "time_range": time_range,
            "sort_by": sort_by,
            "offset": offset,
            "limit": limit
        }
        if contract_address:
            params["contract_address"] = contract_address
        return self._make_request("nft/collection/scores", params)

    def get_collection_whales(self, contract_address=None, blockchain="ethereum", time_range="24h", sort_by="nft_count", offset=0, limit=30):
        """Get whale activity metrics for collections."""
        params = {
            "blockchain": blockchain,
            "time_range": time_range,
            "sort_by": sort_by,
            "offset": offset,
            "limit": limit
        }
        if contract_address:
            params["contract_address"] = contract_address
        return self._make_request("nft/collection/whales", params)

    def get_collection_washtrade(self, contract_address=None, blockchain="ethereum", time_range="24h", sort_by="washtrade_assets", offset=0, limit=30):
        """Get washtrade metrics for collections."""
        params = {
            "blockchain": blockchain,
            "time_range": time_range,
            "sort_by": sort_by,
            "offset": offset,
            "limit": limit
        }
        if contract_address:
            params["contract_address"] = contract_address
        return self._make_request("nft/collection/washtrade", params)

    def get_collection_profile(self, contract_address=None, blockchain="ethereum", time_range="24h", sort_by="washtrade_index", offset=0, limit=30):
        """Get collection profile metrics including fear & greed index."""
        params = {
            "blockchain": blockchain,
            "time_range": time_range,
            "sort_by": sort_by,
            "offset": offset,
            "limit": limit
        }
        if contract_address:
            params["contract_address"] = contract_address
        return self._make_request("nft/collection/profile", params)

    def get_collection_traits(self, contract_address=None, collection=None, blockchain="ethereum", sort_by="trait_type", offset=0, limit=30):
        """Get collection traits and rarity data."""
        params = {
            "blockchain": blockchain,
            "sort_by": sort_by,
            "offset": offset,
            "limit": limit,
            "time_range": "all"
        }
        if contract_address:
            params["contract_address"] = contract_address
        if collection:
            params["collection"] = collection
        return self._make_request("nft/collection/traits", params)

    def get_collection_categories(self, blockchain="ethereum", sort_by="volume", offset=0, limit=30):
        """Get collections organized by categories."""
        params = {
            "blockchain": blockchain,
            "sort_by": sort_by,
            "offset": offset,
            "limit": limit,
            "time_range": "all"
        }
        return self._make_request("nft/collection/categories", params)

    def get_collection_metadata(self, contract_address=None, slug_name=None, blockchain="ethereum", offset=0, limit=30):
        """Get collection metadata information."""
        params = {
            "blockchain": blockchain,
            "offset": offset,
            "limit": limit,
            "time_range": "all"
        }
        if contract_address:
            params["contract_address"] = contract_address
        if slug_name:
            params["slug_name"] = slug_name
        return self._make_request("nft/collection/metadata", params)

    def get_collection_owners(self, contract_address=None, collection=None, blockchain="ethereum", sort_by="acquired_date", offset=0, limit=30):
        """Get collection owners/holders list."""
        params = {
            "blockchain": blockchain,
            "sort_by": sort_by,
            "offset": offset,
            "limit": limit,
            "time_range": "all"
        }
        if contract_address:
            params["contract_address"] = contract_address
        if collection:
            params["collection"] = collection
        return self._make_request("nft/collection/owner", params)

    # Wallet Advanced Methods
    def get_wallet_analytics(self, wallet=None, blockchain="ethereum", time_range="24h", sort_by="volume", offset=0, limit=30):
        """Get detailed wallet analytics and trends."""
        params = {
            "blockchain": blockchain,
            "time_range": time_range,
            "sort_by": sort_by,
            "offset": offset,
            "limit": limit
        }
        if wallet:
            params["wallet"] = wallet
        return self._make_request("nft/wallet/analytics", params)

    def get_wallet_scores(self, wallet=None, blockchain="ethereum", time_range="24h", sort_by="portfolio_value", offset=0, limit=30):
        """Get wallet performance scores and metrics."""
        params = {
            "blockchain": blockchain,
            "time_range": time_range,
            "sort_by": sort_by,
            "offset": offset,
            "limit": limit
        }
        if wallet:
            params["wallet"] = wallet
        return self._make_request("nft/wallet/scores", params)

    def get_wallet_traders(self, wallet=None, blockchain="ethereum", time_range="24h", sort_by="traders", offset=0, limit=30):
        """Get wallet trader metrics and behavior."""
        params = {
            "blockchain": blockchain,
            "time_range": time_range,
            "sort_by": sort_by,
            "offset": offset,
            "limit": limit
        }
        if wallet:
            params["wallet"] = wallet
        return self._make_request("nft/wallet/traders", params)

    def get_wallet_washtrade(self, wallet=None, blockchain="ethereum", time_range="24h", sort_by="washtrade_volume", offset=0, limit=30):
        """Get wallet washtrade metrics and suspicious activity."""
        params = {
            "blockchain": blockchain,
            "time_range": time_range,
            "sort_by": sort_by,
            "offset": offset,
            "limit": limit
        }
        if wallet:
            params["wallet"] = wallet
        return self._make_request("nft/wallet/washtrade", params)

    def get_wallet_profile(self, wallet=None, offset=0, limit=30):
        """Get comprehensive wallet profile including classifications."""
        params = {
            "offset": offset,
            "limit": limit
        }
        if wallet:
            params["wallet"] = wallet
        return self._make_request("nft/wallet/profile", params)

    # Marketplace Methods
    def get_marketplace_metadata(self, offset=0, limit=30):
        """Get metadata for all available marketplaces."""
        params = {
            "offset": offset,
            "limit": limit
        }
        return self._make_request("nft/marketplace/metadata", params)

    def get_marketplace_analytics(self, blockchain="ethereum", time_range="24h", sort_by="volume", offset=0, limit=30):
        """Get marketplace analytics and performance."""
        params = {
            "blockchain": blockchain,
            "time_range": time_range,
            "sort_by": sort_by,
            "offset": offset,
            "limit": limit
        }
        print(f"🔍 DEBUG: Calling marketplace analytics with params: {params}")
        result = self._make_request("nft/marketplace/analytics", params)
        print(f"📊 DEBUG: Marketplace API returned {len(result) if result else 0} items")
        return result

    def get_marketplace_holders(self, blockchain="ethereum", time_range="24h", sort_by="holders", offset=0, limit=30):
        """Get marketplace holder metrics."""
        params = {
            "blockchain": blockchain,
            "time_range": time_range,
            "sort_by": sort_by,
            "offset": offset,
            "limit": limit
        }
        return self._make_request("nft/marketplace/holders", params)

    def get_marketplace_traders(self, blockchain="ethereum", time_range="24h", sort_by="traders", offset=0, limit=30):
        """Get marketplace trader metrics."""
        params = {
            "blockchain": blockchain,
            "time_range": time_range,
            "sort_by": sort_by,
            "offset": offset,
            "limit": limit
        }
        return self._make_request("nft/marketplace/traders", params)

    def get_marketplace_washtrade(self, blockchain="ethereum", time_range="24h", sort_by="washtrade_volume", offset=0, limit=30):
        """Get marketplace washtrade metrics."""
        params = {
            "blockchain": blockchain,
            "time_range": time_range,
            "sort_by": sort_by,
            "offset": offset,
            "limit": limit
        }
        return self._make_request("nft/marketplace/washtrade", params)

    # NFT Specific Methods
    def get_nft_metadata(self, contract_address=None, slug_name=None, token_id=None, blockchain="ethereum", offset=0, limit=30):
        """Get metadata for specific NFTs."""
        params = {
            "blockchain": blockchain,
            "offset": offset,
            "limit": limit,
            "time_range": "all"
        }
        if contract_address:
            params["contract_address"] = contract_address
        if slug_name:
            params["slug_name"] = slug_name
        if token_id:
            params["token_id"] = token_id
        return self._make_request("nft/metadata", params)

    def get_nft_owner(self, contract_address, token_id, blockchain="ethereum", sort_by="acquired_date", offset=0, limit=30):
        """Get current owner of specific NFT."""
        params = {
            "contract_address": contract_address,
            "token_id": token_id,
            "blockchain": blockchain,
            "sort_by": sort_by,
            "offset": offset,
            "limit": limit,
            "time_range": "all"
        }
        return self._make_request("nft/owner", params)

    # Blockchain Support Methods
    def get_supported_blockchains(self, offset=0, limit=30):
        """Get list of supported blockchains."""
        params = {
            "offset": offset,
            "limit": limit
        }
        return self._make_request("blockchains", params)

    # Helper Methods for the Agent
    def get_trending_collections(self, blockchain="ethereum", time_range="24h", limit=20):
        """Get trending collections by volume."""
        return self.get_collection_analytics(
            blockchain=blockchain,
            time_range=time_range,
            sort_by="volume",
            limit=limit
        )

    def get_top_performing_collections(self, blockchain="ethereum", time_range="24h", limit=10):
        """Get top performing collections by sales."""
        return self.get_collection_analytics(
            blockchain=blockchain,
            time_range=time_range,
            sort_by="sales",
            limit=limit
        )

    def get_market_whales(self, blockchain="ethereum", time_range="24h", limit=20):
        """Get general market whale activity."""
        return self.get_collection_whales(
            blockchain=blockchain,
            time_range=time_range,
            limit=limit
        )

    def get_market_insights(self, blockchain="ethereum", time_range="24h"):
        """Get comprehensive market insights including marketplace data."""
        try:
            # Get marketplace data
            marketplace_data = self.get_marketplace_analytics(
                blockchain=blockchain, 
                time_range=time_range, 
                sort_by="volume"
            )
            
            # Get general market data
            market_analytics = self.get_market_analytics(blockchain=blockchain, time_range=time_range)
            holder_insights = self.get_holder_insights(blockchain=blockchain, time_range=time_range)
            trader_insights = self.get_trader_insights(blockchain=blockchain, time_range=time_range)
            
            # Process marketplace data for better insights
            marketplace_summary = None
            if marketplace_data and len(marketplace_data) > 0:
                # Sort by volume and get top marketplace
                sorted_marketplaces = sorted(marketplace_data, key=lambda x: x.get('volume', 0), reverse=True)
                top_marketplace = sorted_marketplaces[0] if sorted_marketplaces else None
                
                total_volume = sum(mp.get('volume', 0) for mp in marketplace_data)
                total_sales = sum(mp.get('sales', 0) for mp in marketplace_data)
                
                marketplace_summary = {
                    "top_marketplace": {
                        "name": top_marketplace.get('name', 'Unknown') if top_marketplace else 'Unknown',
                        "volume": top_marketplace.get('volume', 0) if top_marketplace else 0,
                        "volume_change": top_marketplace.get('volume_change', 0) if top_marketplace else 0,
                        "sales": top_marketplace.get('sales', 0) if top_marketplace else 0
                    },
                    "total_market_volume": total_volume,
                    "total_market_sales": total_sales,
                    "marketplace_count": len(marketplace_data),
                    "all_marketplaces": marketplace_data[:5]  # Top 5 marketplaces
                }
            
            return {
                "marketplace_data": marketplace_summary,
                "market_analytics": market_analytics,
                "holder_insights": holder_insights,
                "trader_insights": trader_insights,
                "has_marketplace_data": marketplace_summary is not None
            }
            
        except Exception as e:
            print(f"❌ Error in get_market_insights: {str(e)}")
            return {
                "error": str(e),
                "marketplace_data": None,
                "has_marketplace_data": False
            }