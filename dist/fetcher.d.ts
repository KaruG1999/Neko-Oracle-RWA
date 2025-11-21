export interface PriceData {
    price: number;
    timestamp: number;
    assetId: string;
}
export declare class PriceFetcher {
    private axiosInstance;
    private apiKey;
    private assetId;
    private maxRetries;
    private retryDelay;
    constructor(apiKey: string, assetId: string);
    /**
     * Fetch price from AlphaVantage API
     */
    private fetchFromAlphaVantage;
    /**
     * Fetch price from Finnhub API (alternative)
     */
    private fetchFromFinnhub;
    /**
     * Retry wrapper for API calls
     */
    private retry;
    /**
     * Fetch price data with retry logic
     * Tries AlphaVantage first, falls back to Finnhub if available
     */
    fetchPrice(): Promise<PriceData>;
}
//# sourceMappingURL=fetcher.d.ts.map