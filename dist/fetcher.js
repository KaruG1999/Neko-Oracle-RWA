"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceFetcher = void 0;
const axios_1 = __importDefault(require("axios"));
class PriceFetcher {
    constructor(apiKey, assetId) {
        this.maxRetries = 3;
        this.retryDelay = 2000; // 2 seconds
        this.apiKey = apiKey;
        this.assetId = assetId;
        this.axiosInstance = axios_1.default.create({
            timeout: 10000,
        });
    }
    /**
     * Fetch price from AlphaVantage API
     */
    async fetchFromAlphaVantage() {
        const url = `https://www.alphavantage.co/query`;
        const response = await this.axiosInstance.get(url, {
            params: {
                function: 'GLOBAL_QUOTE',
                symbol: this.assetId,
                apikey: this.apiKey,
            },
        });
        const quote = response.data['Global Quote'];
        if (!quote || !quote['05. price']) {
            throw new Error(`Invalid response from AlphaVantage: ${JSON.stringify(response.data)}`);
        }
        const price = parseFloat(quote['05. price']);
        const timestamp = Math.floor(Date.now() / 1000); // Current Unix timestamp
        return {
            price: Math.round(price * 1e7), // Multiply by 1e7 to avoid floats
            timestamp,
            assetId: this.assetId,
        };
    }
    /**
     * Fetch price from Finnhub API (alternative)
     */
    async fetchFromFinnhub() {
        const url = `https://finnhub.io/api/v1/quote`;
        const response = await this.axiosInstance.get(url, {
            params: {
                symbol: this.assetId,
                token: this.apiKey,
            },
        });
        if (!response.data || response.data.c === 0) {
            throw new Error(`Invalid response from Finnhub: ${JSON.stringify(response.data)}`);
        }
        const price = response.data.c; // Current price
        const timestamp = response.data.t || Math.floor(Date.now() / 1000); // Timestamp from API or current
        return {
            price: Math.round(price * 1e7), // Multiply by 1e7 to avoid floats
            timestamp,
            assetId: this.assetId,
        };
    }
    /**
     * Retry wrapper for API calls
     */
    async retry(fn, retries = this.maxRetries) {
        try {
            return await fn();
        }
        catch (error) {
            if (retries <= 0) {
                throw error;
            }
            console.warn(`Retry attempt ${this.maxRetries - retries + 1}/${this.maxRetries}`);
            await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
            return this.retry(fn, retries - 1);
        }
    }
    /**
     * Fetch price data with retry logic
     * Tries AlphaVantage first, falls back to Finnhub if available
     */
    async fetchPrice() {
        try {
            // Try AlphaVantage first
            return await this.retry(() => this.fetchFromAlphaVantage());
        }
        catch (alphaVantageError) {
            console.warn('AlphaVantage failed, trying Finnhub...', alphaVantageError);
            try {
                // Fallback to Finnhub
                return await this.retry(() => this.fetchFromFinnhub());
            }
            catch (finnhubError) {
                throw new Error(`Both price APIs failed. AlphaVantage: ${alphaVantageError}, Finnhub: ${finnhubError}`);
            }
        }
    }
}
exports.PriceFetcher = PriceFetcher;
//# sourceMappingURL=fetcher.js.map