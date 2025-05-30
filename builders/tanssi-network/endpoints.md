---
title: Network Endpoints
description: Tanssi networks have two endpoints available for users to connect to, one for HTTPS and one for WSS. This page has the RPC endpoints you need to get started.
icon: octicons-share-android-24
---

## Network Endpoints

Tanssi networks have two endpoints available for users to connect to: one for HTTPS and one for WSS.

## Dancebox

The Dancebox TestNet HTTPS and WSS endpoints are as follows:

=== "HTTPS"

    ```text
    https://{{ networks.dancebox.dns_name }}/
    ```

=== "WSS"

    ```text
    wss://{{ networks.dancebox.dns_name }}
    ```

### Demo EVM Network

The demo EVM network HTTPS and WSS endpoints are as follows:

=== "HTTPS"

    ```text
    {{ networks.dancelight.demo_evm_rpc_url }}
    ```

=== "WSS"

    ```text
    {{ networks.dancelight.demo_evm_rpc_wss_url }}
    ```