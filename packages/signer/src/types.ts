/**
 * Type definitions for the Signer package
 */

/**
 * Represents aggregated stock price data that will be signed
 */
export interface PriceData {
  symbol: string;
  price: number;
  timestamp: number;
  source?: string;
}

/**
 * Represents a signed price proof
 */
export interface SignedPriceProof {
  data: PriceData;
  signature: string;
  publicKey: string;
  timestamp: number;
}

/**
 * Configuration options for signing
 */
export interface SignerConfig {
  privateKey: string;
  algorithm?: string;
}
