# Setting Up Cross-Chain Token Transfers

This guide walks you through everything you need to know about configuring cross-chain token transfers using the NTT framework on Polkadot. Currently, this is the recommended approach for most teams.

## Prerequisites

Before we begin, make sure our environment is correctly configured:

- You have the NTT CLI installed
- Our deployment wallet has sufficient funds
- You have access to the deployment.json file in your project directory

## Configure the Transfer Manager

The Transfer Manager is the core component that handles our cross-chain messaging. We currently support transfers between EVM-compatible chains and Substrate-based chains.

To initialize the manager, run:

```
ntt init --config deployment.json --chain polkadot
```

If the command succeeds, you will see output similar to the following:

```
Initializing NTT Manager...
Chain: polkadot
Status: ready
```

## Set Transfer Limits

You can configure rate limits to control how many tokens can be transferred within a given time window. This is a powerful feature that gives you complete control over your token's cross-chain flow.

Update the `rateLimit` parameter in your deployment configuration:

```
ntt config set rateLimit 1000 --window 3600
```

## Verify the Deployment

At the time of writing, the deployment verification step is required for all new configurations. Run the following command to verify:

```
ntt verify --deployment deployment.json
```

You may check the current status of your deployment at any time by inspecting the deployment.json file in your project directory.
