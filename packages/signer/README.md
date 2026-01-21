# Signer Package

Produces cryptographically signed proofs of aggregated stock prices.

## Overview

This package provides:
- Cryptographic signing of price data
- Proof generation for price attestations
- Signature verification utilities
- Key management integration

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Installation

Install dependencies:

```bash
npm install
```

### Building the Package

Build the TypeScript package:

```bash
npm run build
```

This will compile the TypeScript source files to JavaScript in the `dist/` directory.

### Testing

Run tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run tests with coverage:

```bash
npm run test:cov
```

### Linting

Check code style:

```bash
npm run lint
```

## Usage

After building, import the package in your application:

```typescript
import { PriceData, SignedPriceProof } from '@oracle-stocks/signer';
```

## Project Structure

```
packages/signer/
├── src/
│   ├── index.ts       # Main entry point
│   └── types.ts       # Type definitions
├── dist/              # Compiled output (generated)
├── package.json       # Dependencies and scripts
├── tsconfig.json      # TypeScript configuration
└── README.md         # This file
```

## Status

🚧 Under construction - Signing logic will be implemented in subsequent issues.
