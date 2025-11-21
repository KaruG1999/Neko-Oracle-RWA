"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.OracleScheduler = void 0;
const cron = __importStar(require("node-cron"));
const commit_1 = require("./commit");
class OracleScheduler {
    constructor(config) {
        this.cronJob = null;
        this.intervalId = null;
        this.priceFetcher = config.priceFetcher;
        this.publisher = config.publisher;
        this.cronExpression = config.cronExpression || null;
        this.intervalSeconds = config.intervalSeconds || null;
        this.logLevel = config.logLevel || "info";
    }
    /**
     * Execute a single update cycle: fetch → commit → publish
     * @returns Object with transaction hash and price data
     */
    async executeUpdate() {
        try {
            this.log("info", "Starting price update cycle...");
            // Step 1: Fetch price
            this.log("debug", "Fetching price data...");
            const priceData = await this.priceFetcher.fetchPrice();
            this.log("info", `Price fetched: ${priceData.price / 1e7} for ${priceData.assetId}`);
            // Step 2: Generate commitment
            this.log("debug", "Generating commitment...");
            if (this.logLevel === "debug") {
                (0, commit_1.debugCommitInputs)(priceData.price, priceData.timestamp, priceData.assetId);
            }
            const commit = await (0, commit_1.generateCommit)(priceData.price, priceData.timestamp, priceData.assetId);
            this.log("info", `Commitment generated: ${commit}`);
            // Step 3: Publish to Oracle
            this.log("debug", "Publishing to Soroban contract...");
            const publishParams = {
                assetId: priceData.assetId,
                price: BigInt(priceData.price),
                timestamp: BigInt(priceData.timestamp),
                commit,
            };
            const result = await this.publisher.publishToOracle(publishParams);
            if (result.success) {
                this.log("info", `Price update successful! TX: ${result.txHash}`);
                return {
                    txHash: result.txHash,
                    price: priceData.price,
                    timestamp: priceData.timestamp,
                    assetId: priceData.assetId,
                    commit,
                };
            }
            else {
                throw new Error("Publish returned success=false");
            }
        }
        catch (error) {
            this.log("error", `Price update failed: ${error instanceof Error ? error.message : String(error)}`);
            if (this.logLevel === "debug" && error instanceof Error) {
                console.error(error.stack);
            }
            throw error;
        }
    }
    /**
     * Start the scheduler (cron or interval based)
     */
    start() {
        if (this.cronJob || this.intervalId) {
            this.log("warn", "Scheduler is already running");
            return;
        }
        // Use interval in seconds if provided (for testing)
        if (this.intervalSeconds && this.intervalSeconds > 0) {
            this.log("info", `Starting scheduler with interval: ${this.intervalSeconds} seconds`);
            this.intervalId = setInterval(async () => {
                await this.executeUpdate();
            }, this.intervalSeconds * 1000);
            // Execute immediately on start (optional)
            this.executeUpdate().catch((error) => {
                this.log("error", `Initial update failed: ${error instanceof Error ? error.message : String(error)}`);
            });
        }
        else if (this.cronExpression) {
            // Use cron expression if provided
            this.log("info", `Starting scheduler with cron expression: ${this.cronExpression}`);
            this.cronJob = cron.schedule(this.cronExpression, async () => {
                await this.executeUpdate();
            });
            // Execute immediately on start (optional)
            this.executeUpdate().catch((error) => {
                this.log("error", `Initial update failed: ${error instanceof Error ? error.message : String(error)}`);
            });
        }
        else {
            this.log("error", "No cron expression or interval specified");
        }
    }
    /**
     * Stop the scheduler
     */
    stop() {
        if (this.cronJob) {
            this.cronJob.stop();
            this.cronJob = null;
            this.log("info", "Scheduler stopped (cron)");
        }
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.log("info", "Scheduler stopped (interval)");
        }
    }
    /**
     * Log message based on log level
     */
    log(level, message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        if (level === "error") {
            console.error(logMessage);
        }
        else if (level === "warn") {
            console.warn(logMessage);
        }
        else {
            console.log(logMessage);
        }
    }
}
exports.OracleScheduler = OracleScheduler;
//# sourceMappingURL=scheduler.js.map