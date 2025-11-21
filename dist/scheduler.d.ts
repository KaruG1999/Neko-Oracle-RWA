import { PriceFetcher } from "./fetcher";
import { SorobanPublisher } from "./publisher";
export interface SchedulerConfig {
    priceFetcher: PriceFetcher;
    publisher: SorobanPublisher;
    cronExpression?: string;
    intervalSeconds?: number;
    logLevel?: string;
}
export declare class OracleScheduler {
    private priceFetcher;
    private publisher;
    private cronExpression;
    private intervalSeconds;
    private logLevel;
    private cronJob;
    private intervalId;
    constructor(config: SchedulerConfig);
    /**
     * Execute a single update cycle: fetch → commit → publish
     * @returns Object with transaction hash and price data
     */
    executeUpdate(): Promise<{
        txHash: string;
        price: number;
        timestamp: number;
        assetId: string;
        commit: string;
    }>;
    /**
     * Start the scheduler (cron or interval based)
     */
    start(): void;
    /**
     * Stop the scheduler
     */
    stop(): void;
    /**
     * Log message based on log level
     */
    private log;
}
//# sourceMappingURL=scheduler.d.ts.map