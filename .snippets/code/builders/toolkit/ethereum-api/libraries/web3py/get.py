# 1. Import the ABI
from compile import abi
from web3 import Web3

# 2. Create web3.py provider
provider_rpc = {
    # Insert your RPC URL here
    "evm_network": "https://services.tanssi-testnet.network/dancelight-2001",
}
web3 = Web3(Web3.HTTPProvider(provider_rpc["evm_network"]))

# 3. Create address variable
contract_address = "INSERT_CONTRACT_ADDRESS"

print(f"Making a call to contract at address: { contract_address }")

# 4. Create contract instance
Incrementer = web3.eth.contract(address=contract_address, abi=abi)

# 5. Call Contract
number = Incrementer.functions.number().call()
print(f"The current number stored is: { number } ")
