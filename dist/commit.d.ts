export interface CommitInputs {
    price: number;
    timestamp: number;
    assetId: string;
}
/**
 * Generate Poseidon commitment hash
 * @param price - Price value (already multiplied by 1e7)
 * @param timestamp - Unix timestamp
 * @param assetId - Asset identifier (e.g., "TSLA")
 * @returns Hex string of the commitment hash
 */
export declare function generateCommit(price: number, timestamp: number, assetId: string): Promise<string>;
/**
 * Debug function to log commitment inputs
 */
export declare function debugCommitInputs(price: number, timestamp: number, assetId: string): void;
//# sourceMappingURL=commit.d.ts.map