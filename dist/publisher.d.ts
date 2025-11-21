export interface PublishParams {
    assetId: string;
    price: bigint;
    timestamp: bigint;
    commit: string;
}
export interface PublishResult {
    txHash: string;
    success: boolean;
}
export declare class SorobanPublisher {
    private client;
    private server;
    private keypair;
    private networkPassphrase;
    constructor(rpcUrl: string, contractId: string, secretKey: string);
    private toAsset;
    publishToOracle(params: PublishParams): Promise<PublishResult>;
}
//# sourceMappingURL=publisher.d.ts.map