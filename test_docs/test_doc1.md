---
title: get started with messaging

description: Follow this guide to use Wormhole's core protocol to publish a multichain message and return transaction information with VAA identifiers!

categories: Basics, Typescript SDK

---

# get started with messaging

Wormhole's core functionality let's you send any data packet from one supported chain to another! This guide demonstrates how to publish your first simple, arbitrary data message from an EVM environment source chain using the wormhole typescript sdk's core messaging capabilities.

## Prerequisites

Before you begin, make sure you got the following:

- Node.js and npm installed.
- Typescript installed
- Ethers.js installed, this example uses version 6.
- A small amount of testnet tokens for gas fees, like Sepolia ETH, but you can use whatever.
- A private key for signing blockchain transactions!

## Configure your messaging environment

1. Create a directory and initialize a node.js project:

```bash
mkdir core-message
cd core-message
npm init -y
```

2. Install typescript, tsx, node.js type definitions, and ethers.js:

```bash
npm install --save-dev tsx typescript @types/node ethers
```

3. Create a tsconfig.json file if you don't have one. You can generate a basic one using the following command:

```bash
npx tsc --init
```

Make sure your tsconfig.json includes the following settings:

```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  }
}
```

4. Install the Typescript SDK:

```bash
npm install @wormhole-foundation/sdk
```

5. Create a new file named main.ts:

```bash
touch main.ts
```

## Construct and publish your message

1. Open main.ts and update the code there as follows:

```ts title="main.ts"
--8<-- "code/products/messaging/get-started/main.ts"
```

This script initialize the sdk, defines values for the source chain, creates an EVM signer, constructs the message, uses the core protocol to generate, sign, and send the transaction, and returns the VAA identifiers upon successful publication of the message.

2. Run the script using the following command:

```bash
npx tsx main.ts
```

You will see terminal output similar to the following:

--8<-- "code/products/messaging/get-started/terminal01.html"

3. Make a note of the transaction id and VAA identifier values. You can use the transaction id to view the transaction on wormholescan. The emitter chain, emitter adress, and sequence values are used to retrieve and decode signed messages.

Congradulations! You've published your first multichain message using wormhole's typescript sdk and core protocol functionality. Consider the following options to build upon what you've accomplished.

## Next steps

- Get started with token bridge: Follow this guide to start working with multichain token transfers using Wormhole Token Bridge's lock and mint mechanism to send tokens across chains.
- Get started with the solidity sdk: Smart contract developers can follow this on-chain integration guide to use Wormhole Solidity SDK-based sender and receiver contracts to send testnet USDC across chains. 