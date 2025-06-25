---
title: Upgrade Your Sequencer Systemd Node
description: Follow these instructions to update your Tanssi sequencer node running via Systemd to the latest version of the Tanssi client software.
icon: simple-linux
categories: Sequencers
---

# Upgrade Your Node Running via Systemd

## Introduction {: #introduction }

Keeping your node up-to-date is an important part of being a Tanssi sequencer. Not only does it help to ensure that your sequencer node stays healthy, it also contributes to keeping the entire Tanssi Network running smoothly.

This tutorial covers upgrading your Tanssi sequencer node that was configured using Systemd. It assumes you have already set up your account and launched a [sequencer node using Systemd](/node-operators/sequencers/onboarding/run-a-sequencer/sequencers-systemd/){target=\_blank}.

--8<-- 'text/node-operators/github-release-notifications.md'

## Upgrading Your Systemd Node {: #upgrading-your-systemd-node }

If you're running your sequencer via the Systemd service, you'll need to take a few steps to properly upgrade your node. In short, you'll need to stop the service, replace the Tanssi binary with the updated version, and then start the service.

You can stop your Tanssi Systemd service with the following command:

```bash
systemctl stop tanssi.service
```

Then, navigate to the directory where your Tanssi binary is stored and remove it.

```bash
cd /var/lib/tanssi-data
```

Your Tanssi binary file will most likely be named `tanssi-node`. If not, you can replace `tanssi-node` below with the correct name of your Tanssi binary file.

```bash
rm tanssi-node
```

To download the latest release and change permissions on it so the Tanssi service can use it, run the following command that corresponds to your environment:

=== "Generic"

    ```bash
    wget https://github.com/moondance-labs/tanssi/releases/download/{{ networks.dancebox.para_client_version }}/tanssi-node && \
    chmod +x ./tanssi-node
    ```

=== "Intel Skylake"

    ```bash
    wget https://github.com/moondance-labs/tanssi/releases/download/{{ networks.dancebox.para_client_version }}/tanssi-node-skylake -O tanssi-node && \
    chmod +x ./tanssi-node
    ```

=== "AMD Zen3"

    ```bash
    wget https://github.com/moondance-labs/tanssi/releases/download/{{ networks.dancebox.para_client_version }}/tanssi-node-znver3 -O tanssi-node && \
    chmod +x ./tanssi-node
    ```

You can restart your Tanssi Systemd service with the following command:

```bash
systemctl start tanssi.service
```

The node will resume syncing blocks from where it left off when the Systemd service was stopped. To verify that it is running correctly, you can use the following command to check the logs:

```bash
systemctl status tanssi.service
```

And that's it! You've successfully upgraded your Tanssi node.