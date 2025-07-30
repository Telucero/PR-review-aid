// 1. Import the Ethers plugin required to interact with the contract
require('@nomicfoundation/hardhat-ethers');

// 2. Add your private key that is funded with tokens of your Tanssi-powered network
// This is for example purposes only - **never store your private keys in a JavaScript file**
const privateKey = 'INSERT_PRIVATE_KEY';

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // 3. Specify the Solidity version
  solidity: '0.8.20',
  networks: {
    // 4. Add the network specification for your Tanssi EVM network
    demo: {
      url: 'https://services.tanssi-testnet.network/dancelight-2001/',
      chainId: 5678, // Fill in the EVM ChainID for your Tanssi-powered network
      accounts: [privateKey],
    },
  },
};
