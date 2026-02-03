"""
800claw - ERC-8004 Contract Addresses and ABIs
https://8004.org
"""

import json
import base64
from typing import Dict, List, Optional, Any

NETWORKS = {
    "mainnet": {
        "chain_id": 1,
        "name": "Ethereum Mainnet",
        "rpc": "https://eth.drpc.org",
        "explorer": "https://etherscan.io",
        "contracts": {
            "identity_registry": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
            "reputation_registry": "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
            "validation_registry": "0x0000000000000000000000000000000000000000"
        }
    },
    "sepolia": {
        "chain_id": 11155111,
        "name": "Sepolia Testnet",
        "rpc": "https://ethereum-sepolia-rpc.publicnode.com",
        "explorer": "https://sepolia.etherscan.io",
        "contracts": {
            "identity_registry": "0x8004A818BFB912233c491871b3d84c89A494BD9e",
            "reputation_registry": "0x8004B663056A597Dffe9eCcC1965A193B7388713",
            "validation_registry": "0x0000000000000000000000000000000000000000"
        }
    }
}

# ABI fragments for Identity Registry
IDENTITY_REGISTRY_ABI = [
    # Write functions
    {
        "name": "register",
        "type": "function",
        "stateMutability": "nonpayable",
        "inputs": [
            {"name": "agentURI", "type": "string"},
            {"name": "metadata", "type": "tuple[]", "components": [
                {"name": "metadataKey", "type": "string"},
                {"name": "metadataValue", "type": "bytes"}
            ]}
        ],
        "outputs": [{"name": "agentId", "type": "uint256"}]
    },
    {
        "name": "register",
        "type": "function",
        "stateMutability": "nonpayable",
        "inputs": [{"name": "agentURI", "type": "string"}],
        "outputs": [{"name": "agentId", "type": "uint256"}]
    },
    {
        "name": "register",
        "type": "function",
        "stateMutability": "nonpayable",
        "inputs": [],
        "outputs": [{"name": "agentId", "type": "uint256"}]
    },
    {
        "name": "setAgentURI",
        "type": "function",
        "stateMutability": "nonpayable",
        "inputs": [
            {"name": "agentId", "type": "uint256"},
            {"name": "newURI", "type": "string"}
        ],
        "outputs": []
    },
    {
        "name": "setMetadata",
        "type": "function",
        "stateMutability": "nonpayable",
        "inputs": [
            {"name": "agentId", "type": "uint256"},
            {"name": "metadataKey", "type": "string"},
            {"name": "metadataValue", "type": "bytes"}
        ],
        "outputs": []
    },
    {
        "name": "setAgentWallet",
        "type": "function",
        "stateMutability": "nonpayable",
        "inputs": [
            {"name": "agentId", "type": "uint256"},
            {"name": "newWallet", "type": "address"},
            {"name": "deadline", "type": "uint256"},
            {"name": "signature", "type": "bytes"}
        ],
        "outputs": []
    },
    {
        "name": "unsetAgentWallet",
        "type": "function",
        "stateMutability": "nonpayable",
        "inputs": [{"name": "agentId", "type": "uint256"}],
        "outputs": []
    },
    # Read functions
    {
        "name": "tokenURI",
        "type": "function",
        "stateMutability": "view",
        "inputs": [{"name": "agentId", "type": "uint256"}],
        "outputs": [{"name": "", "type": "string"}]
    },
    {
        "name": "ownerOf",
        "type": "function",
        "stateMutability": "view",
        "inputs": [{"name": "agentId", "type": "uint256"}],
        "outputs": [{"name": "", "type": "address"}]
    },
    {
        "name": "balanceOf",
        "type": "function",
        "stateMutability": "view",
        "inputs": [{"name": "owner", "type": "address"}],
        "outputs": [{"name": "", "type": "uint256"}]
    },
    {
        "name": "getAgentWallet",
        "type": "function",
        "stateMutability": "view",
        "inputs": [{"name": "agentId", "type": "uint256"}],
        "outputs": [{"name": "", "type": "address"}]
    },
    {
        "name": "getMetadata",
        "type": "function",
        "stateMutability": "view",
        "inputs": [
            {"name": "agentId", "type": "uint256"},
            {"name": "metadataKey", "type": "string"}
        ],
        "outputs": [{"name": "", "type": "bytes"}]
    }
]

REPUTATION_REGISTRY_ABI = [
    # Write functions
    {
        "name": "giveFeedback",
        "type": "function",
        "stateMutability": "nonpayable",
        "inputs": [
            {"name": "agentId", "type": "uint256"},
            {"name": "value", "type": "int128"},
            {"name": "valueDecimals", "type": "uint8"},
            {"name": "tag1", "type": "string"},
            {"name": "tag2", "type": "string"},
            {"name": "endpoint", "type": "string"},
            {"name": "feedbackURI", "type": "string"},
            {"name": "feedbackHash", "type": "bytes32"}
        ],
        "outputs": []
    },
    {
        "name": "revokeFeedback",
        "type": "function",
        "stateMutability": "nonpayable",
        "inputs": [
            {"name": "agentId", "type": "uint256"},
            {"name": "feedbackIndex", "type": "uint64"}
        ],
        "outputs": []
    },
    {
        "name": "appendResponse",
        "type": "function",
        "stateMutability": "nonpayable",
        "inputs": [
            {"name": "agentId", "type": "uint256"},
            {"name": "clientAddress", "type": "address"},
            {"name": "feedbackIndex", "type": "uint64"},
            {"name": "responseURI", "type": "string"},
            {"name": "responseHash", "type": "bytes32"}
        ],
        "outputs": []
    },
    # Read functions
    {
        "name": "getSummary",
        "type": "function",
        "stateMutability": "view",
        "inputs": [
            {"name": "agentId", "type": "uint256"},
            {"name": "clientAddresses", "type": "address[]"},
            {"name": "tag1", "type": "string"},
            {"name": "tag2", "type": "string"}
        ],
        "outputs": [
            {"name": "count", "type": "uint64"},
            {"name": "summaryValue", "type": "int128"},
            {"name": "summaryValueDecimals", "type": "uint8"}
        ]
    },
    {
        "name": "readFeedback",
        "type": "function",
        "stateMutability": "view",
        "inputs": [
            {"name": "agentId", "type": "uint256"},
            {"name": "clientAddress", "type": "address"},
            {"name": "index", "type": "uint64"}
        ],
        "outputs": [
            {"name": "value", "type": "int128"},
            {"name": "valueDecimals", "type": "uint8"},
            {"name": "tag1", "type": "string"},
            {"name": "tag2", "type": "string"},
            {"name": "isRevoked", "type": "bool"}
        ]
    },
    {
        "name": "readAllFeedback",
        "type": "function",
        "stateMutability": "view",
        "inputs": [
            {"name": "agentId", "type": "uint256"},
            {"name": "clientAddresses", "type": "address[]"},
            {"name": "tag1", "type": "string"},
            {"name": "tag2", "type": "string"},
            {"name": "includeRevoked", "type": "bool"}
        ],
        "outputs": [
            {"name": "clients", "type": "address[]"},
            {"name": "feedbackIndexes", "type": "uint64[]"},
            {"name": "values", "type": "int128[]"},
            {"name": "valueDecimals", "type": "uint8[]"},
            {"name": "tag1s", "type": "string[]"},
            {"name": "tag2s", "type": "string[]"},
            {"name": "revokedStatuses", "type": "bool[]"}
        ]
    },
    {
        "name": "getResponseCount",
        "type": "function",
        "stateMutability": "view",
        "inputs": [
            {"name": "agentId", "type": "uint256"},
            {"name": "clientAddress", "type": "address"},
            {"name": "feedbackIndex", "type": "uint64"},
            {"name": "responders", "type": "address[]"}
        ],
        "outputs": [{"name": "count", "type": "uint64"}]
    },
    {
        "name": "getClients",
        "type": "function",
        "stateMutability": "view",
        "inputs": [{"name": "agentId", "type": "uint256"}],
        "outputs": [{"name": "", "type": "address[]"}]
    },
    {
        "name": "getLastIndex",
        "type": "function",
        "stateMutability": "view",
        "inputs": [
            {"name": "agentId", "type": "uint256"},
            {"name": "clientAddress", "type": "address"}
        ],
        "outputs": [{"name": "", "type": "uint64"}]
    },
    {
        "name": "getIdentityRegistry",
        "type": "function",
        "stateMutability": "view",
        "inputs": [],
        "outputs": [{"name": "", "type": "address"}]
    }
]


def get_network(network_name: str = "mainnet") -> Dict[str, Any]:
    """Get network configuration by name."""
    network = NETWORKS.get(network_name.lower())
    if not network:
        available = ", ".join(NETWORKS.keys())
        raise ValueError(f"Unknown network: {network_name}. Available: {available}")
    return network


def get_contracts(network_name: str = "mainnet") -> Dict[str, str]:
    """Get contract addresses for a network."""
    return get_network(network_name)["contracts"]


def create_data_uri(metadata: Dict[str, Any]) -> str:
    """
    Create a data URI from agent metadata (no IPFS needed).

    Args:
        metadata: Agent metadata object

    Returns:
        data URI that can be used as agentURI
    """
    json_str = json.dumps(metadata)
    b64 = base64.b64encode(json_str.encode('utf-8')).decode('ascii')
    return f"data:application/json;base64,{b64}"


def parse_data_uri(data_uri: str) -> Dict[str, Any]:
    """
    Parse a data URI back to metadata object.

    Args:
        data_uri: data URI string

    Returns:
        Parsed metadata dictionary
    """
    prefix = "data:application/json;base64,"
    if not data_uri.startswith(prefix):
        raise ValueError("Invalid data URI format")
    b64 = data_uri[len(prefix):]
    json_str = base64.b64decode(b64).decode('utf-8')
    return json.loads(json_str)


def create_registration_metadata(
    name: str,
    description: str = "",
    image: str = "",
    services: Optional[List[Dict[str, str]]] = None,
    supported_trust: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Create a standard ERC-8004 registration metadata object.

    Args:
        name: Agent name (required)
        description: Agent description
        image: Agent image URL
        services: List of service endpoint dicts
        supported_trust: Trust mechanisms (default: ['reputation'])

    Returns:
        Standard ERC-8004 metadata dict
    """
    return {
        "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
        "name": name,
        "description": description,
        "image": image,
        "services": services or [],
        "supportedTrust": supported_trust or ["reputation"]
    }
