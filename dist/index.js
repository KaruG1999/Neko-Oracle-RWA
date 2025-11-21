"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const fetcher_1 = require("./fetcher");
const publisher_1 = require("./publisher");
const scheduler_1 = require("./scheduler");
// Load environment variables
dotenv_1.default.config();
// Validate required environment variables
const requiredEnvVars = [
    "API_KEY",
    "ASSET_ID",
    "SOROBAN_RPC",
    "ORACLE_CONTRACT_ID",
    "ORACLE_SECRET_KEY",
];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(", ")}`);
    console.error("Please check your .env file");
    process.exit(1);
}
// Initialize components
const priceFetcher = new fetcher_1.PriceFetcher(process.env.API_KEY, process.env.ASSET_ID);
const publisher = new publisher_1.SorobanPublisher(process.env.SOROBAN_RPC, process.env.ORACLE_CONTRACT_ID, process.env.ORACLE_SECRET_KEY);
const scheduler = new scheduler_1.OracleScheduler({
    priceFetcher,
    publisher,
    // For testing: run every 5 seconds
    intervalSeconds: 5,
    // For production: use cron expression every 5 minutes
    // cronExpression: "*/5 * * * *", // Every 5 minutes
    logLevel: process.env.LOG_LEVEL || "info",
});
// Express app for force-update endpoint
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use(express_1.default.json());
/**
 * Force update endpoint
 * GET /force-update
 * Manually triggers a price update cycle
 * Returns JSON with txHash
 */
app.get("/force-update", async (req, res) => {
    try {
        console.log("[FORCE-UPDATE] Manual update requested");
        // Execute update cycle
        const result = await scheduler.executeUpdate();
        res.json({
            success: true,
            txHash: result.txHash,
            price: result.price / 1e7, // Convert back to readable format
            timestamp: result.timestamp,
            assetId: result.assetId,
            commit: result.commit,
            timestamp_iso: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error("[FORCE-UPDATE] Error:", error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
        });
    }
});
/**
 * Health check endpoint
 */
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
    });
});
// Start Express server
app.listen(PORT, () => {
    console.log(`Express server running on port ${PORT}`);
    console.log(`   Force update: GET http://localhost:${PORT}/force-update`);
    console.log(`   Health check: GET http://localhost:${PORT}/health`);
});
// Start scheduler
console.log("Oracle Feeder starting...");
scheduler.start();
console.log("Oracle Feeder running...");
// Graceful shutdown
process.on("SIGINT", () => {
    console.log("\nShutting down gracefully...");
    scheduler.stop();
    process.exit(0);
});
process.on("SIGTERM", () => {
    console.log("\nShutting down gracefully...");
    scheduler.stop();
    process.exit(0);
});
//# sourceMappingURL=index.js.map