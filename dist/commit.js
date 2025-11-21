"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCommit = generateCommit;
exports.debugCommitInputs = debugCommitInputs;
const circomlibjs_1 = require("circomlibjs");
/**
 * Convert assetId string to integer for Poseidon hash
 */
function assetIdToInt(assetId) {
    let hash = 0;
    for (let i = 0; i < assetId.length; i++) {
        const char = assetId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return BigInt(Math.abs(hash));
}
/**
 * Generate Poseidon commitment hash
 * @param price - Price value (already multiplied by 1e7)
 * @param timestamp - Unix timestamp
 * @param assetId - Asset identifier (e.g., "TSLA")
 * @returns Hex string of the commitment hash
 */
async function generateCommit(price, timestamp, assetId) {
    const poseidon = await (0, circomlibjs_1.buildPoseidon)();
    const assetIdInt = assetIdToInt(assetId);
    // Poseidon hash: commit = Poseidon([price, timestamp, assetId_as_int])
    const inputs = [
        BigInt(price),
        BigInt(timestamp),
        assetIdInt,
    ];
    const commitment = poseidon(inputs);
    const commitmentBN = poseidon.F.toString(commitment);
    // Convert to hex string
    return BigInt(commitmentBN).toString(16);
}
/**
 * Debug function to log commitment inputs
 */
function debugCommitInputs(price, timestamp, assetId) {
    const assetIdInt = assetIdToInt(assetId);
    console.log('=== Commit Debug Info ===');
    console.log(`Price: ${price} (raw: ${price / 1e7})`);
    console.log(`Timestamp: ${timestamp} (${new Date(timestamp * 1000).toISOString()})`);
    console.log(`Asset ID: ${assetId}`);
    console.log(`Asset ID (as int): ${assetIdInt}`);
    console.log('========================');
}
// TODO: Insert Noir proof generation here later
//# sourceMappingURL=commit.js.map