Owner and Pauser Roles＃
Pausing the Native Token Transfers (NTT) Manager contract will disallow initiating new token transfers. While the contract is paused, in-flight transfers can still be redeemed (subject to rate limits if configured).

NTT can be paused on a particular chain by updating the paused parameter on the deployment to true via the NTT CLI, then performing ntt push to sync the local configuration with the on-chain deployment.

Owner: Full control over NTT contracts, can perform administrative functions. Has the ability to un-pause contracts if they have been paused.
Pauser: Can pause NTT contracts to halt token transfers temporarily. This role is crucial for responding quickly to adverse events without a prolonged governance process. Cannot un-pause contracts.
You may verify the current owner, pauser, and paused status of the NTT Manager contract on the deployment.json file in your NTT project directory.


Egg plant dog wolf