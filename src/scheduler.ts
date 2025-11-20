import * as cron from "node-cron";
import { PriceFetcher, PriceData } from "./fetcher";
import { generateCommit, debugCommitInputs } from "./commit";
import { SorobanPublisher, PublishParams } from "./publisher";

export interface SchedulerConfig {
  priceFetcher: PriceFetcher;
  publisher: SorobanPublisher;
  cronExpression?: string;
  logLevel?: string;
}

export class OracleScheduler {
  private priceFetcher: PriceFetcher;
  private publisher: SorobanPublisher;
  private cronExpression: string;
  private logLevel: string;
  private cronJob: cron.ScheduledTask | null = null;

  constructor(config: SchedulerConfig) {
    this.priceFetcher = config.priceFetcher;
    this.publisher = config.publisher;
    this.cronExpression = config.cronExpression || "*/5 * * * *"; // Every 5 minutes
    this.logLevel = config.logLevel || "info";
  }

  /**
   * Execute a single update cycle: fetch → commit → publish
   * @returns Object with transaction hash and price data
   */
  async executeUpdate(): Promise<{
    txHash: string;
    price: number;
    timestamp: number;
    assetId: string;
    commit: string;
  }> {
    try {
      this.log("info", "Starting price update cycle...");

      // Step 1: Fetch price
      this.log("debug", "Fetching price data...");
      const priceData: PriceData = await this.priceFetcher.fetchPrice();
      this.log(
        "info",
        `Price fetched: ${priceData.price / 1e7} for ${priceData.assetId}`
      );

      // Step 2: Generate commitment
      this.log("debug", "Generating commitment...");
      if (this.logLevel === "debug") {
        debugCommitInputs(
          priceData.price,
          priceData.timestamp,
          priceData.assetId
        );
      }
      const commit = await generateCommit(
        priceData.price,
        priceData.timestamp,
        priceData.assetId
      );
      this.log("info", `Commitment generated: ${commit}`);

      // Step 3: Publish to Oracle
      this.log("debug", "Publishing to Soroban contract...");
      const publishParams: PublishParams = {
        assetId: priceData.assetId,
        price: priceData.price,
        timestamp: priceData.timestamp,
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
      } else {
        throw new Error("Publish returned success=false");
      }
    } catch (error) {
      this.log(
        "error",
        `Price update failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      if (this.logLevel === "debug" && error instanceof Error) {
        console.error(error.stack);
      }
      throw error;
    }
  }

  /**
   * Start the cron scheduler
   */
  start(): void {
    if (this.cronJob) {
      this.log("warn", "Scheduler is already running");
      return;
    }

    this.log(
      "info",
      `Starting scheduler with cron expression: ${this.cronExpression}`
    );

    this.cronJob = cron.schedule(this.cronExpression, async () => {
      await this.executeUpdate();
    });

    // Execute immediately on start (optional)
    this.executeUpdate().catch((error) => {
      this.log(
        "error",
        `Initial update failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    });
  }

  /**
   * Stop the cron scheduler
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      this.log("info", "Scheduler stopped");
    }
  }

  /**
   * Log message based on log level
   */
  private log(level: string, message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (level === "error") {
      console.error(logMessage);
    } else if (level === "warn") {
      console.warn(logMessage);
    } else {
      console.log(logMessage);
    }
  }
}
