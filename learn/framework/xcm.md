---
title: Native Cross-Chain Communication
description: Tanssi networks benefit from XCM, a native cross-chain communication language, which allows fast and secure bridging guaranteed by Polkadot's relay chain.
categories: Basics
---

# Native Cross-Chain Communication

## Introduction {: #introduction }

All Tanssi-powered networks have an inherent capability to communicate and interoperate with any other network in the ecosystem. This native cross-chain communication feature is possible thanks to the unique infrastructure the networks are built on top of, leveraging the Cross-Consensus Message format (XCM for short), which facilitates communication between different consensus systems.

XCM is a messaging language designed to be generic. It doesn't make any assumptions about the destination chain and can communicate different intentions between sovereign consensus systems.

An XCM message is a program holding one or more instructions that will be relayed for execution to the destination chain. By itself, each XCM instruction is meaningless, but the combination of a specific set of instructions can result in a desired action when the XCM message is executed in the destination chain.

In this article, we cover the basic concepts of the native cross-chain communication mechanism that allows fast and secure bridging within the ecosystem.

## Design Principles {: #design-principles }

Conceived with an abstract mindset, XCM is not designed to comply with a specific use case or specific destination network setup, thus minimizing the coupling effect. Its core design principles are:

- **Asynchronous** - similar to sending a postcard -but way faster- the sender will keep performing its duties as usual, without blocking itself or awaiting a response from the destination
- **Absolute** -  messages are guaranteed to be delivered to the intended destination, in order and in a timely fashion
- **Asymmetric** -  messages sent have no response counterpart. Any return values, if required, must be sent back from the destination to the sender with another message
- **Agnostic** -  there are no assumptions whatsoever about the configuration or properties of two communicating networks. Networks might differ in every aspect, except the ability to understand XCM. E.g., one chain could be EVM-compatible and not the other, one chain could be a DeFi network and the other a gaming network, and so on

## Fees {: #fees }

A user executing a transaction on a network must pay the fees derived from computational effort associated with the task, and cross-chain execution is no exception to this rule. In cross-chain communication, a message requires execution on at least two different chains, and the user needs to pay for the fees associated with the computational effort made by every chain involved. Besides the execution-related costs, Tanssi networks include a default [delivery fee](https://paritytech.github.io/polkadot-sdk/master/polkadot_runtime_common/xcm_sender/struct.ExponentialPrice.html){target=\_blank} to prevent XCM spamming.

For example, if a user on network A wants to call a smart contract on network B, the user must have enough funds to pay for the message delivery and include instructions in the XCM message to provide an asset that network B accepts as payment for its services to cover the associated fees. Once such an asset is provided, the execution can now be bought on the destination chain.

!!! note
    Since networks are sovereign, they get to decide which tokens are valid for paying their XCM execution fees.
    E.g., if network B accepts network A tokens for fee payments, any user on network A can pay for an XCM message destined for network B using only network A tokens.

## Common Use Cases {: #common-use-cases }

Many use cases can be addressed by benefiting from the common ground and versatility XCM provides. Two of the most recurrent ones are asset transfers and remote execution.

### Asset Transfers {: #asset-transfer }

Moving digital assets from one network to another is essential for creating a more dynamic, efficient, and interconnected blockchain ecosystem. The native cross-chain capability allows two main strategies to transfer assets from one chain to another:

- **Teleport** - teleporting an asset is a simple and efficient mechanism, but it has a major caveat: it requires trust between the parties. In essence, when network A wants to send X amount of assets to network B, it burns X amount of assets and sends a message to network B instructing them to mint exactly X amount of assets, preserving the overall asset balance and concluding the teleport action. In this process, network A trusts network B not to mint more tokens than what was transferred, and network B trusts network A to burn the tokens that were transferred
- **Reserve transfer** - A reserve transfer involves the **reserve chain** of an asset, which is the chain where the asset is native (e.g., [Moonbeam](https://moonbeam.network/){target=\_blank} is the reserve chain for the GLMR token). Also, non-reserve networks hold a *sovereign account* on the reserve chain, a keyless account managed by the respective network governor. Thus, when reserve network A wants to send X amount of an asset to non-reserve network B, it locally transfers the assets to network's B sovereign account and, in the same atomic action, it sends an XCM message to network B with instructions to mint X amount of a derivative form of the transferred asset. On the other way around, if non-reserve network B wants to send X amount of an asset to reserve network A, then the steps are: network B burns the derived form of the asset locally and sends an XCM message to network A, with instructions to transfer the assets from network B's sovereign account to network's A destination account. Even if the non-reserve network mints derived tokens in excess (or doesn't burn tokens when transferring), these tokens will have no real value because they are not backed one-to-one in the reserve chain

The associated fees for executing transfers are typically deducted from the transferred amount, so the recipient receives the intended amount minus the fees.

### Remote Execution {: #remote-execution }

The native interoperability XCM provides allows a network to send a message to another triggering some action. For example, If the destination chain is EVM-compatible, network A can call a smart contract deployed on network B.

As mentioned in the [fees section](#fees), to get any on-chain request executed it is necessary to cover its associated fees. On XCM, remote execution can be bought with two steps:

1. Reserve some assets using the `WithdrawAsset` XCM instruction, which takes funds from the call origin and puts them in a holding register
2. Pay for the on-chain execution, using the `BuyExecution` XCM instruction, which uses the previously withdrawn assets

!!! note
    When a network sends an XCM message, its default source on the receiving end is the origin network's Sovereign account. The sender network can add an XCM instruction called `DescendOrigin` to the message, changing the origin account to match the signing user's account, ensuring execution occurs on behalf of the same entity initiating the XCM message on the source chain, and avoiding a potentially unsafe scenario.

Finally, the execution takes place on the destination chain, calling a smart contract or any other transaction using the XCM instruction called `Transact`.

The general flow for remote execution is represented in the following diagram:

![Remote Execution Flow](/images/learn/framework/xcm/xcm-1.webp)

## Establishing Cross-Chain Communication {: #channel-registration }

Before two chains can communicate, a messaging channel must be established. Channels are unidirectional, which means that separate channels are needed to send messages from chain A to chain B and B to A.

For chain A to communicate with chain B, chain A must send an open channel transaction to the relay chain requesting a channel be opened with chain B. Chain B must then accept the request by sending a corresponding XCM message to the relay chain. Only when both chains agree is the channel opened in the next epoch. The same process is required to establish a channel from chain B to chain A.

It is important to note that a channel between a network and the relay chain is automatically opened upon network registration and onboarding.

![XCM Channel Registration Overview](/images/learn/framework/xcm/xcm-2.webp)

Once the channel is established, cross-chain messages can be sent between networks. For asset transfers, assets will also need to be registered before being transferred.

!!! note
    XCM is a versioned, ever-evolving language. When two communicating networks use different XCM versions, they must use the latest version supported by the less upgraded side. To find out the latest XCM version a network can work with, other networks can query it and subscribe for updates whenever this changes.

## Message Destinations {: #message-destinations }

To compose meaningful messages in a multichain environment it is necessary to have a precise yet abstract way of referencing resources located in different consensus systems. A concept called *multilocation* is used to serve this purpose and target a specific chain or any of its inner elements, such as an account, an asset, or a smart contract.

XCM's destination elements are organized in a hierarchical architecture, where elements are contained within other components. For example, a smart contract is an element contained within a network, and the same can be said for an account or an ERC20 asset. Networks are contained by the relay chain, which plays a crucial role in the cross-chain messaging process, relaying messages from one network to another.

Multilocations are not a universal resource locator. They refer to elements from the sender's perspective and are composed of two components: `parents` and `interior`. Parents is a property that indicates if the route must "move up" in the hierarchy, i.e., from a network to the relay chain. Interior is a list of junctions that define how to locate the destination. Here are some examples of multilocations:

- **Network A references a smart contract in network B** - from the point of view of network A, to reach a smart contract in network B it is necessary to move up in the hierarchy (to the relay chain) and then descend to network B to, once there, reference the smart contract's address. The multilocation is therefore defined with a `parents` value set to `1`, which moves up, and two junctions, one defining which network should receive the message, and the other defining the H160 address of the smart contract that will be called

![Smart Contract Multilocation Example](/images/learn/framework/xcm/xcm-3.webp)

- **Network A references an account in the relay chain** - from the point of view of network A, to reference an account in the relay chain, it is necessary to move up and then reference the account. The multilocation is defined with a `parents` value set to `1`, which moves up to the relay chain, and one junction that references the substrate type destination address

![Account Multilocation Example](/images/learn/framework/xcm/xcm-4.webp)
