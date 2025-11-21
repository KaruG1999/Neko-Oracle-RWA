"use strict";
// publisher.ts — FINAL TESTNET VERSION using your generated Client binding
Object.defineProperty(exports, "__esModule", { value: true });
exports.SorobanPublisher = void 0;
const stellar_sdk_1 = require("@stellar/stellar-sdk");
const oracle_1 = require("oracle"); // your binding
class SorobanPublisher {
    constructor(rpcUrl, contractId, secretKey) {
        this.keypair = stellar_sdk_1.Keypair.fromSecret(secretKey);
        this.networkPassphrase = rpcUrl.includes("testnet")
            ? stellar_sdk_1.Networks.TESTNET
            : stellar_sdk_1.Networks.FUTURENET; // fallback
        this.client = new oracle_1.Client({
            rpcUrl,
            contractId,
            publicKey: this.keypair.publicKey(),
            networkPassphrase: this.networkPassphrase,
        });
        this.server = new stellar_sdk_1.rpc.Server(rpcUrl, {
            allowHttp: rpcUrl.startsWith("http://"),
        });
        console.log("[PUBLISHER] Running in TESTNET");
        console.log("[PUBLISHER] Contract:", contractId);
        console.log("[PUBLISHER] Feeder wallet:", this.keypair.publicKey());
    }
    // Convert "TSLA" to Asset enum
    toAsset(assetId) {
        return { tag: "Other", values: [assetId] };
    }
    async publishToOracle(params) {
        console.log("\n[PUBLISH] Preparing on-chain price update…");
        console.log("  Asset:", params.assetId);
        console.log("  Price (i128):", params.price.toString());
        console.log("  Timestamp:", params.timestamp.toString());
        console.log("  Commit:", params.commit);
        // 1) Build + simulate
        const tx = await this.client.set_asset_price({
            asset_id: this.toAsset(params.assetId),
            price: params.price,
            timestamp: params.timestamp,
        }, {
            fee: 300000, // safe fee for testnet
            simulate: true,
        });
        console.log("[PUBLISH] Simulation succeeded.");
        // 2) Sign
        tx.sign(this.keypair);
        // 3) Send TX
        const sendResult = await tx.send();
        console.log("[PUBLISH] TX sent. Hash:", sendResult.hash);
        // 4) Wait for confirmation (poll)
        let result = await this.server.getTransaction(sendResult.hash);
        while (result.status === stellar_sdk_1.rpc.Api.GetTransactionStatus.NOT_FOUND) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            result = await this.server.getTransaction(sendResult.hash);
        }
        if (result.status === stellar_sdk_1.rpc.Api.GetTransactionStatus.FAILED) {
            console.error("[PUBLISH] TX FAILED:", JSON.stringify(result));
            throw new Error("Soroban transaction failed");
        }
        console.log("[PUBLISH] TX confirmed on TESTNET.");
        return {
            txHash: sendResult.hash,
            success: true,
        };
    }
}
exports.SorobanPublisher = SorobanPublisher;
//# sourceMappingURL=publisher.js.map