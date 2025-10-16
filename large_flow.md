Introduction¶
Polkadot offers developers multiple approaches to building and deploying smart contracts within its ecosystem. As a multi-chain network designed for interoperability, Polkadot provides various environments optimized for different developer preferences and application requirements. From native smart contract support on Polkadot Hub to specialized parachain environments, developers can choose the platform that best suits their technical needs while benefiting from Polkadot's shared security model and cross-chain messaging capabilities.

Whether you're looking for Ethereum compatibility through EVM-based parachains like Moonbeam, Astar, and Acala or prefer PolkaVM-based development with ink!, the Polkadot ecosystem accommodates a range of diverse developers.

These guides explore the diverse smart contract options available in the Polkadot ecosystem, helping developers understand the unique advantages of each approach and make informed decisions about where to deploy their decentralized applications.

Native Smart Contracts¶
Introduction¶
Polkadot Hub enables smart contract deployment and execution through PolkaVM, a cutting-edge virtual machine designed specifically for the Polkadot ecosystem. This native integration allows developers to deploy smart contracts directly on Polkadot's system chain while maintaining compatibility with Ethereum development tools and workflows.

Smart Contract Development¶
The smart contract platform on Polkadot Hub combines Polkadot's robust security and scalability with the extensive Ethereum development ecosystem. Developers can utilize familiar Ethereum libraries for contract interactions and leverage industry-standard development environments for writing and testing smart contracts.

Polkadot Hub provides full Ethereum JSON-RPC API compatibility, ensuring seamless integration with existing development tools and services. This compatibility enables developers to maintain their preferred workflows while building on Polkadot's native infrastructure.

Technical Architecture¶
PolkaVM, the underlying virtual machine, utilizes a RISC-V-based register architecture optimized for the Polkadot ecosystem. This design choice offers several advantages:

Enhanced performance for smart contract execution.
Improved gas efficiency for complex operations.
Native compatibility with Polkadot's runtime environment.
Optimized storage and state management.
Development Tools and Resources¶
Polkadot Hub supports a comprehensive suite of development tools familiar to Ethereum developers. The platform integrates with popular development frameworks, testing environments, and deployment tools. Key features include:

Contract development in Solidity or Rust.
Support for standard Ethereum development libraries.
Integration with widely used development environments.
Access to blockchain explorers and indexing solutions.
Compatibility with contract monitoring and management tools.
Cross-Chain Capabilities¶
Smart contracts deployed on Polkadot Hub can leverage Polkadot's cross-consensus messaging (XCM) protocol protocol to seamlessly transfer tokens and call functions on other blockchain networks within the Polkadot ecosystem, all without complex bridging infrastructure or third-party solutions. For further references, check the Interoperability section.

Use Cases¶
Polkadot Hub's smart contract platform is suitable for a wide range of applications:

DeFi protocols leveraging cross-chain capabilities.
NFT platforms utilizing Polkadot's native token standards.
Governance systems integrated with Polkadot's democracy mechanisms.
Cross-chain bridges and asset management solutions.
Other Smart Contract Environments¶
Beyond Polkadot Hub's native PolkaVM support, the ecosystem offers two main alternatives for smart contract development:

EVM-compatible parachains: Provide access to Ethereum's extensive developer ecosystem, smart contract portability, and established tooling like Hardhat, Remix, Foundry, and OpenZeppelin. The main options include Moonbeam (the first full Ethereum-compatible parachain serving as an interoperability hub), Astar (featuring dual VM support for both EVM and WebAssembly contracts), and Acala (DeFi-focused with enhanced Acala EVM+ offering advanced DeFi primitives).

Rust (ink!): ink! is a Rust-based framework that can compile to PolkaVM. It uses #[ink(...)] attribute macros to create Polkadot SDK-compatible PolkaVM bytecode, offering strong memory safety from Rust, an advanced type system, high-performance PolkaVM execution, and platform independence with sandboxed security.

Each environment provides unique advantages based on developer preferences and application requirements.

Where to Go Next¶
Developers can use their existing Ethereum development tools and connect to Polkadot Hub's RPC endpoints. The platform's Ethereum compatibility layer ensures a smooth transition for teams already building on Ethereum-compatible chains.

Subsequent sections of this guide provide detailed information about specific development tools, advanced features, and best practices for building on Polkadot Hub.

Introduction¶
Polkadot SDK offers a versatile and extensible blockchain development framework, enabling you to create custom blockchains tailored to your specific application or business requirements.

This tutorial guides you through compiling and running a parachain node using the Polkadot SDK Parachain Template.

The parachain template provides a pre-configured, functional runtime you can use in your local development environment. It includes several key components, such as user accounts and account balances.

These predefined elements allow you to experiment with common blockchain operations without requiring initial template modifications. In this tutorial, you will:

Build and start a local parachain node using the node template.
Explore how to use a front-end interface to:
View information about blockchain activity.
Submit a transaction.
By the end of this tutorial, you'll have a working local parachain and understand how to interact with it, setting the foundation for further customization and development.

Prerequisites¶
Before getting started, ensure you have done the following:

Completed the Install Polkadot SDK Dependencies guide and successfully installed Rust and the required packages to set up your development environment.
For this tutorial series, you need to use Rust 1.86. Newer versions of the compiler may not work with this parachain template version.


macOS
Ubuntu

rustup install 1.86
rustup default 1.86
rustup target add wasm32-unknown-unknown --toolchain 1.86-aarch64-apple-darwin
rustup component add rust-src --toolchain 1.86-aarch64-apple-darwin

Utility Tools¶
This tutorial requires two essential tools:

Chain spec builder: A Polkadot SDK utility for generating chain specifications. Refer to the Generate Chain Specs documentation for detailed usage.

Install it by executing the following command:


cargo install --locked staging-chain-spec-builder@10.0.0
This installs the chain-spec-builder binary.

Polkadot Omni Node: A white-labeled binary, released as a part of Polkadot SDK that can act as the collator of a parachain in production, with all the related auxiliary functionalities that a normal collator node has: RPC server, archiving state, etc. Moreover, it can also run the wasm blob of the parachain locally for testing and development.

To install it, run the following command:


cargo install --locked polkadot-omni-node@0.5.0
This installs the polkadot-omni-node binary.

Compile the Runtime¶
The Polkadot SDK Parachain Template provides a ready-to-use development environment for building using the Polkadot SDK. Follow these steps to compile the runtime:

Clone the template repository:


git clone -b v0.0.4 https://github.com/paritytech/polkadot-sdk-parachain-template.git parachain-template
Navigate into the project directory:


cd parachain-template
Compile the runtime:


cargo build --release --locked
Tip

Initial compilation may take several minutes, depending on your machine specifications. Use the --release flag for improved runtime performance compared to the default --debug build. If you need to troubleshoot issues, the --debug build provides better diagnostics.

For production deployments, consider using a dedicated --profile production flag - this can provide an additional 15-30% performance improvement over the standard --release profile.

Upon successful compilation, you should see output similar to:

cargo build --release --locked
...
Finished release profile [optimized] target(s) in 1.79s
Start the Local Chain¶
After successfully compiling your runtime, you can spin up a local chain and produce blocks. This process will start your local parachain and allow you to interact with it. You'll first need to generate a chain specification that defines your network's identity, initial connections, and genesis state, providing the foundational configuration for how your nodes connect and what initial state they agree upon, and then run the chain.

Follow these steps to launch your node in development mode:

Generate the chain specification file of your parachain:


chain-spec-builder create -t development \
--relay-chain paseo \
--para-id 1000 \
--runtime ./target/release/wbuild/parachain-template-runtime/parachain_template_runtime.compact.compressed.wasm \
named-preset development
Start the omni node with the generated chain spec. You'll start it in development mode (without a relay chain config), producing and finalizing blocks:


polkadot-omni-node --chain ./chain_spec.json --dev
The --dev option does the following:

Deletes all active data (keys, blockchain database, networking information) when stopped.
Ensures a clean working state each time you restart the node.
Verify that your node is running by reviewing the terminal output. You should see something similar to:

polkadot-omni-node --chain ./chain_spec.json --dev

2024-12-12 12:44:02 polkadot-omni-node
2024-12-12 12:44:02 ✌️ version 0.1.0-da2dd9b7737
2024-12-12 12:44:02 ❤️ by Parity Technologies admin@parity.io, 2017-2024
2024-12-12 12:44:02 📋 Chain specification: Custom
2024-12-12 12:44:02 🏷 Node name: grieving-drum-1926
2024-12-12 12:44:02 👤 Role: AUTHORITY
2024-12-12 12:44:02 💾 Database: RocksDb at /var/folders/x0/xl_kjddj3ql3bx7752yr09hc0000gn/T/substrateoUrZMQ/chains/custom/db/full
2024-12-12 12:44:03 [Parachain] assembling new collators for new session 0 at #0
2024-12-12 12:44:03 [Parachain] assembling new collators for new session 1 at #0
2024-12-12 12:44:03 [Parachain] 🔨 Initializing Genesis block/state (state: 0xa6f8…5b46, header-hash: 0x0579…2153)
2024-12-12 12:44:03 [Parachain] creating SingleState txpool Limit { count: 8192, total_bytes: 20971520 }/Limit { count: 819, total_bytes: 2097152 }.
2024-12-12 12:44:03 [Parachain] Using default protocol ID "sup" because none is configured in the chain specs
2024-12-12 12:44:03 [Parachain] 🏷 Local node identity is: 12D3KooWCSXy6rBuJVsn5mx8uyNqkdfNfFzEbToi4hR31v3PwdgX
2024-12-12 12:44:03 [Parachain] Running libp2p network backend
2024-12-12 12:44:03 [Parachain] 💻 Operating system: macos
2024-12-12 12:44:03 [Parachain] 💻 CPU architecture: aarch64
2024-12-12 12:44:03 [Parachain] 📦 Highest known block at #0
2024-12-12 12:44:03 [Parachain] 〽️ Prometheus exporter started at 127.0.0.1:9615
2024-12-12 12:44:03 [Parachain] Running JSON-RPC server: addr=127.0.0.1:9944,[::1]:9944
2024-12-12 12:44:06 [Parachain] 🙌 Starting consensus session on top of parent 0x05794f9adcdaa23a5edd335e8310637d3a7e6e9393f2b0794af7d3e219f62153 (#0)
2024-12-12 12:44:06 [Parachain] 🎁 Prepared block for proposing at 1 (2 ms) hash: 0x6fbea46711e9b38bab8e7877071423cd03feab03d3f4a0d578a03ab42dcee34b; parent_hash: 0x0579…2153; end: NoMoreTransactions; extrinsics_count: 2
2024-12-12 12:44:06 [Parachain] 🏆 Imported #1 (0x0579…2153 → 0x6fbe…e34b)
...
Confirm that your blockchain is producing new blocks by checking if the number after finalized is increasing.

...
2024-12-12 12:49:20 [Parachain] 💤 Idle (0 peers), best: #1 (0x6fbe…e34b), finalized #1 (0x6fbe…e34b), ⬇ 0 ⬆ 0
...
2024-12-12 12:49:25 [Parachain] 💤 Idle (0 peers), best: #3 (0x7543…bcfc), finalized #3 (0x7543…bcfc), ⬇ 0 ⬆ 0
...
2024-12-12 12:49:30 [Parachain] 💤 Idle (0 peers), best: #4 (0x0478…8d63), finalized #4 (0x0478…8d63), ⬇ 0 ⬆ 0
...
The details of the log output will be explored in a later tutorial. For now, knowing that your node is running and producing blocks is sufficient.

Interact with the Node¶
When running the template node, it's accessible by default at ws://localhost:9944. To interact with your node using the Polkadot.js Apps interface, follow these steps:

Open Polkadot.js Apps in your web browser and click the network icon (which should be the Polkadot logo) in the top left corner as shown in the image below:



Connect to your local node:

Scroll to the bottom and select Development.
Choose Custom.
**Enter ws**: //localhost:9944 in the input field.
Click the Switch button.


Verify connection:

Once connected, you should see parachain-template-runtime in the top left corner.
The interface will display information about your local blockchain.


You are now connected to your local node and can now interact with it through the Polkadot.js Apps interface. This tool enables you to explore blocks, execute transactions, and interact with your blockchain's features. For in-depth guidance on using the interface effectively, refer to the Polkadot.js Guides available on the Polkadot Wiki.

Stop the Node¶
When you're done exploring your local node, you can stop it to remove any state changes you've made. Since you started the node with the --dev option, stopping the node will purge all persistent block data, allowing you to start fresh the next time.

To stop the local node:

Return to the terminal window where the node output is displayed.
Press Control-C to stop the running process.
Verify that your terminal returns to the prompt in the parachain-template directory.
