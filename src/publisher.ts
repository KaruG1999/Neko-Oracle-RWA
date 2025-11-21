// publisher.ts — FINAL TESTNET VERSION using your generated Client binding

import { Keypair, rpc, Networks } from "@stellar/stellar-sdk";
import { Client, type Asset } from "oracle"; // your binding

export interface PublishParams {
  assetId: string; // e.g. "TSLA"
  price: bigint; // i128 scaled, e.g. BigInt(25215_00000000)
  timestamp: bigint; // unix timestamp (u64)
  commit: string; // hash or metadata string
}

export interface PublishResult {
  txHash: string;
  success: boolean;
}

export class SorobanPublisher {
  private client: Client;
  private server: rpc.Server;
  private keypair: Keypair;
  private networkPassphrase: string;

  constructor(rpcUrl: string, contractId: string, secretKey: string) {
    this.keypair = Keypair.fromSecret(secretKey);

    this.networkPassphrase = rpcUrl.includes("testnet")
      ? Networks.TESTNET
      : Networks.FUTURENET; // fallback

    this.client = new Client({
      rpcUrl,
      contractId,
      publicKey: this.keypair.publicKey(),
      networkPassphrase: this.networkPassphrase,
    });

    this.server = new rpc.Server(rpcUrl, {
      allowHttp: rpcUrl.startsWith("http://"),
    });

    console.log("[PUBLISHER] Running in TESTNET");
    console.log("[PUBLISHER] Contract:", contractId);
    console.log("[PUBLISHER] Feeder wallet:", this.keypair.publicKey());
  }

  // Convert "TSLA" to Asset enum
  private toAsset(assetId: string): Asset {
    return { tag: "Other", values: [assetId] };
  }

  async publishToOracle(params: PublishParams): Promise<PublishResult> {
    console.log("\n[PUBLISH] Preparing on-chain price update…");
    console.log("  Asset:", params.assetId);
    console.log("  Price (i128):", params.price.toString());
    console.log("  Timestamp:", params.timestamp.toString());
    console.log("  Commit:", params.commit);

    // 1) Build + simulate
    const tx = await this.client.set_asset_price(
      {
        asset_id: this.toAsset(params.assetId),
        price: params.price,
        timestamp: params.timestamp,
      },
      {
        fee: 300000, // safe fee for testnet
        simulate: true,
      }
    );

    console.log("[PUBLISH] Simulation succeeded.");

    // 2) Sign
    tx.sign(this.keypair);

    // 3) Send TX
    const sendResult = await tx.send();

    console.log("[PUBLISH] TX sent. Hash:", sendResult.hash);

    // 4) Wait for confirmation (poll)
    let result = await this.server.getTransaction(sendResult.hash);

    while (result.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      result = await this.server.getTransaction(sendResult.hash);
    }

    if (result.status === rpc.Api.GetTransactionStatus.FAILED) {
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
