const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://aegis.andama.me';

export interface QueryRequest {
  query: string;
  wallet_address?: string;
  collection_id?: string;
  token_id?: string;
}

export interface QueryResponse {
  response: string;
  error?: string;
  raw?: unknown;
}

export interface CollectionStatsRequest {
  collection_id: string;
}

export interface WalletHealthRequest {
  wallet_address: string;
}

export interface NFTValuationRequest {
  token_id: string;
  collection_id: string;
}

class APIService {
  private async makeRequest<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async query(request: QueryRequest): Promise<QueryResponse> {
    return this.makeRequest<QueryResponse>('/query', request);
  }

  async getCollectionStats(request: CollectionStatsRequest) {
    return this.makeRequest('/get-collection-stats', request);
  }

  async getWalletHealth(request: WalletHealthRequest) {
    return this.makeRequest('/get-wallet-health', request);
  }

  async getNFTValuation(request: NFTValuationRequest) {
    return this.makeRequest('/get-nft-valuation', request);
  }

  async getChartData(collectionId: string) {
    return this.makeRequest(`/chart-data/${collectionId}`);
  }

  // Enhanced query method that can intelligently route requests
  async smartQuery(query: string, walletAddress?: string, collectionId?: string, tokenId?: string): Promise<QueryResponse> {
    const request: QueryRequest = {
      query,
      wallet_address: walletAddress,
      collection_id: collectionId,
      token_id: tokenId,
    };

    return this.query(request);
  }
}

export const apiService = new APIService();
