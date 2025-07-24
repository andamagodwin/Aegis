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
        return self._make_request("nft/washtrade", params)