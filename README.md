<img width="2940" height="770" alt="image" src="https://github.com/user-attachments/assets/7f6504f2-1849-4507-9216-5f413b0e32c2" />

# RWA Oracle (Stellar)

This repository contains an early PoC implementation of the Neko Protocol RWA price oracle for the Stellar ecosystem. The goal is to provide trust‑minimized, verifiable pricing data for tokenized real‑world assets (RWAs) such as equities, bonds, and other financial instruments.

Although this version focuses on simplicity, the architecture is designed to evolve toward higher security and more resilient data ingestion.

## Overview

The oracle fetches asset prices from multiple independent API providers. We make sure of the following:

* The two or more feeds are close enough to each other according to a predefined tolerance rule.
* A final aggregated price was computed correctly.

The on‑chain smart contract (Soroban) verifies the proof and updates the RWA price stored in the protocol.

This design allows Neko Protocol to operate a lending and borrowing system backed by real‑world assets.

## How It Works

1. **Fetch Prices:** Off‑chain oracle service retrieves price data for the asset from multiple independent APIs.
2. **Validate Consistency:** Check sources fall within the configured tolerance window; reject if not.
3. **Aggregate:** Compute the agreed price (e.g. median or trimmed mean) from accepted feeds.
4. **Submit Price:** Publish the aggregated price to the Soroban contract via a transaction.
5. **Consume:** Lending/borrowing contracts read the stored RWA price to evaluate collateral and liquidation thresholds.

## Current Limitations (Roadmap)

This initial implementation is intentionally lightweight. The roadmap includes:

* Integrating more than five data sources.
* Implementing feed attestation, signatures, and Merkle proofs.
* Adding detection for outliers and adversarial price behavior.
* Introducing distributed oracle operators and proof rotation.
* Deploying a high‑availability, fault‑tolerant oracle relay.
* Expanding support to additional RWA categories (treasuries, corporate bonds, commodities).

## Architecture Diagram

<img width="300" height="1000" alt="Diagram RWA Lending" src="https://github.com/user-attachments/assets/125c403a-07c7-4453-85f6-a29343bf62a1" />

## License

MIT License.
