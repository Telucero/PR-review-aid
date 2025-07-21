---
title: gasless transactions with 0xgasless

description: Learn how to implement gasless transactions on Moonbeam using 0xGasless, enabling users to interact with smart contracts without holding native tokens!
---

# enabling gasless transactions with 0xgasless

## why gasless transactions?

One of the main problems in blockchain development is users gotta have native tokens (like ETH or GLMR) to pay transaction fees! This old EOA-based model makes things harder, especially for new users who want a Web2-like experience.

Gasless transactions helps solve this with Account Abstraction ([ERC-4337](https://eips.ethereum.org/EIPS/eip-4337){target=_blank}), using meta-transactions that split user actions from fee payment. This lets dApps or third-party paymasters pay gas for users, while smart contract wallets do the transaction. [0xGasless](https://0xgasless.com/index.html){target=_blank} uses these ideas in its sdk, letting Moonbeam devs add cool stuff like social logins, batching, and custom wallet controls - all while hiding the gas stuff from users.

In this tutorial, we'll go through the steps of setting up a paymaster on 0xGasless and sending a gasless transaction to change a smart contract on Moonbeam.

## create and fund a paymaster

First, you gotta [register for an account on 0xGasless](https://dashboard.0xgasless.com/auth/sign-in){target=_blank}. Then, [create a Paymaster](https://dashboard.0xgasless.com/paymaster){target=_blank} for the Moonbeam Network by pressing **Create Paymaster** and then doing this:

1. Enter a name for your paymaster.
2. Select **Moonbeam** as the chain.
3. Press **Create**.

![Create Paymaster](/images/tutorials/integrations/0xgasless/0xgasless-1.webp)

Your paymaster needs funds to cover gas fees for sponsored transactions. To deposit GLMR into your paymaster, do this:

1. Enter the amount you wanna deposit.
2. Press **Deposit** and confirm the transaction in your wallet!

![Fund Paymaster](/images/tutorials/integrations/0xgasless/0xgasless-2.webp)

Your deposited funds are flexible - use them to sponsor gasless transactions or withdraw them whenever you want.

## dispatching a gasless transaction

In the next section, we'll make a script showing how to send a gasless transaction. 

### prerequisites

Create a .env file in your project's root directory with the following:

```bash
PRIVATE_KEY=INSERT_PRIVATE_KEY
RPC_URL=https://rpc.api.moonbeam.network
```

Why are we putting a private key in the .env? Even though this transaction is gasless, you still need a private key to sign it. The account for this key:

- Doesn't need any GLMR tokens.
- Won't pay for gas fees.
- Is just for signing.

!!! note

    Never commit your .env file or share your private key! Add .env to your .gitignore file.

Also, make sure you installed the 0xGasless sdk and the `ethers` and `dotenv` packages:

```bash
npm install ethers dotenv @0xgasless/smart-account
```

First, import the packages like this:

```js
require('dotenv').config();
const ethers = require('ethers');
const {
  PaymasterMode,
  createSmartAccountClient,
} = require('@0xgasless/smart-account');
```

Next, set the important constants. You gotta define the CHAIN_ID, BUNDLER_URL, and PAYMASTER_URL. Get your paymaster URL from your [0xGasless Dashboard](https://dashboard.0xgasless.com/paymaster){target=_blank}.

The contract address here is for an [Incrementer contract](https://moonscan.io/address/0x3ae26f2c909eb4f1edf97bf60b36529744b09213) on Moonbeam, where we'll call the increment function. This simple contract lets us see if the gasless transaction worked.

```js
const CHAIN_ID = 1284; // Moonbeam mainnet
const BUNDLER_URL = `https://bundler.0xgasless.com/${CHAIN_ID}`;
const PAYMASTER_URL =
  'https://paymaster.0xgasless.com/v1/1284/rpc/INSERT_API_KEY';
const CONTRACT_ADDRESS = '0x3aE26f2c909EB4F1EdF97bf60B36529744b09213';
const FUNCTION_SELECTOR = '0xd09de08a';
```

!!! warning

    The Paymaster URL format has recently changed! Use:

    ```
    https://paymaster.0xgasless.com/v1/1284/rpc/INSERT_API_KEY
    ```

    Don't use the old format:

    ```
    https://paymaster.0xgasless.com/api/v1/1284/rpc/INSERT_API_KEY
    ```

    The difference is that /api is gone. Make sure your code uses the new format.

### sending the transaction

To send a gasless transaction with the 0xGasless smart account, call smartWallet.sendTransaction() with two things:

   - The transaction object with the contract details
   - A config object with paymasterServiceData and SPONSORED mode. This means the 0xGasless paymaster will use the gas tank to pay for gas. 

The function gives you a UserOperation response with a hash. Wait for the receipt using waitForUserOpReceipt(), which checks for completion with a timeout (default 60 seconds).

```javascript
const userOpResponse = await smartWallet.sendTransaction(transaction, {
  paymasterServiceData: { mode: PaymasterMode.SPONSORED },
});

const receipt = await waitForUserOpReceipt(userOpResponse, 60000);
```

Putting it all together and adding lots of logging and error handling for easy debugging, the full script is here:

??? code "Dispatch a gasless transaction"
    ```javascript
    --8<-- 'code/tutorials/integrations/0xgasless/dispatch.js'
    ```

### verifying completion

When you run the script, you'll see output like this: 

--8<-- 'code/tutorials/integrations/0xgasless/output.md'

Since the gasless transaction we did interacts with an [Incrementer](https://moonscan.io/address/0x3ae26f2c909eb4f1edf97bf60b36529744b09213#readContract){target=_blank} contract on Moonbeam, it's easy to check if it worked. Go to the Read Contract section of the Incrementer contract on Moonscan and check the number. Or, go to the Internal Transactions tab and turn advanced mode ON to see the contract call.

For more info about adding gasless transactions to your dApp, check out the [0xGasless docs](https://gitbook.0xgasless.com/){target=_blank}.

--8<-- 'text/_disclaimers/educational-tutorial.md'

--8<-- 'text/_disclaimers/third-party-content.md'