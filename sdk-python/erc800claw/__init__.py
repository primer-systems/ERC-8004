"""
erc-800claw - ERC-8004 SDK for OpenClaw agents

Register, query, and rate agent identities on Ethereum.
https://8004.org

Example usage:

    from erc800claw import create_client, create_registration_metadata

    # Query agents
    client = create_client(network='mainnet')
    agent = client.get_agent(1)
    print(agent)

    # Register a new agent (no IPFS needed - uses data URI!)
    result = client.register_agent(
        private_key=PRIVATE_KEY,
        name='My Autonomous Agent',
        description='Handles customer support'
    )
    print(f"Registered agent #{result['agent_id']}")
"""

from .client import (
    ERC8004Client,
    create_client,
)

from .contracts import (
    NETWORKS,
    IDENTITY_REGISTRY_ABI,
    REPUTATION_REGISTRY_ABI,
    get_network,
    get_contracts,
    create_data_uri,
    parse_data_uri,
    create_registration_metadata,
)

__version__ = "0.1.0"

__all__ = [
    # Main client
    "ERC8004Client",
    "create_client",

    # Contract data
    "NETWORKS",
    "IDENTITY_REGISTRY_ABI",
    "REPUTATION_REGISTRY_ABI",
    "get_network",
    "get_contracts",

    # Helpers
    "create_data_uri",
    "parse_data_uri",
    "create_registration_metadata",
]
