"""
800claw - ERC-8004 Client
https://8004.org
"""

from typing import Dict, List, Optional, Any, Union
import requests
from web3 import Web3
from web3.exceptions import ContractLogicError
from eth_account import Account

from .contracts import (
    NETWORKS,
    IDENTITY_REGISTRY_ABI,
    REPUTATION_REGISTRY_ABI,
    get_network,
    get_contracts,
    create_data_uri,
    parse_data_uri,
    create_registration_metadata
)


class ERC8004Client:
    """
    Client for interacting with ERC-8004 contracts.

    Supports both read operations (query agents, check existence, get reputation)
    and write operations (register agents, update metadata, give feedback).
    """

    def __init__(self, network: str = "mainnet", rpc_url: Optional[str] = None):
        """
        Create a new ERC-8004 client.

        Args:
            network: Network name ('mainnet' or 'sepolia')
            rpc_url: Optional custom RPC URL
        """
        self.network = network.lower()
        network_config = get_network(self.network)

        self.contracts = get_contracts(self.network)
        self.explorer = network_config["explorer"]

        rpc = rpc_url or network_config["rpc"]
        self.w3 = Web3(Web3.HTTPProvider(rpc))

        # Create contract instances
        self.identity_registry = self.w3.eth.contract(
            address=Web3.to_checksum_address(self.contracts["identity_registry"]),
            abi=IDENTITY_REGISTRY_ABI
        )
        self.reputation_registry = self.w3.eth.contract(
            address=Web3.to_checksum_address(self.contracts["reputation_registry"]),
            abi=REPUTATION_REGISTRY_ABI
        )

    # ==================== READ METHODS ====================

    def agent_exists(self, agent_id: Union[int, str]) -> bool:
        """
        Check if an agent exists.

        Args:
            agent_id: Agent ID to check

        Returns:
            True if agent exists, False otherwise
        """
        try:
            self.identity_registry.functions.ownerOf(int(agent_id)).call()
            return True
        except (ContractLogicError, Exception):
            return False

    def get_agent(self, agent_id: Union[int, str]) -> Optional[Dict[str, Any]]:
        """
        Get agent details by ID.

        Args:
            agent_id: Agent ID to look up

        Returns:
            Agent details dict or None if not found
        """
        aid = int(agent_id)

        # Get owner - if this fails, agent doesn't exist
        try:
            owner = self.identity_registry.functions.ownerOf(aid).call()
        except (ContractLogicError, Exception):
            return None

        # Get tokenURI
        token_uri = None
        try:
            uri = self.identity_registry.functions.tokenURI(aid).call()
            if uri and uri != "":
                token_uri = uri
        except (ContractLogicError, Exception):
            pass

        # Fetch registration metadata if URI exists
        metadata = None
        if token_uri:
            if token_uri.startswith("data:application/json;base64,"):
                try:
                    metadata = parse_data_uri(token_uri)
                except Exception:
                    pass
            elif token_uri.startswith("http") or token_uri.startswith("ipfs://"):
                try:
                    url = token_uri
                    if token_uri.startswith("ipfs://"):
                        url = f"https://ipfs.io/ipfs/{token_uri[7:]}"
                    response = requests.get(url, timeout=5)
                    if response.ok:
                        metadata = response.json()
                except Exception:
                    pass

        return {
            "agent_id": aid,
            "token_uri": token_uri,
            "owner": owner,
            "metadata": metadata,
            "explorer_url": f"{self.explorer}/nft/{self.contracts['identity_registry']}/{aid}"
        }

    def get_agent_count(self, owner_address: str) -> int:
        """
        Get number of agents owned by an address.

        Args:
            owner_address: Ethereum address to check

        Returns:
            Number of agents owned
        """
        address = Web3.to_checksum_address(owner_address)
        count = self.identity_registry.functions.balanceOf(address).call()
        return int(count)

    def get_reputation(
        self,
        agent_id: Union[int, str],
        client_addresses: Optional[List[str]] = None,
        tag1: str = "",
        tag2: str = ""
    ) -> Dict[str, Any]:
        """
        Get reputation summary for an agent.

        Args:
            agent_id: Agent ID to look up
            client_addresses: List of reviewer addresses (required for actual data)
            tag1: Primary tag filter
            tag2: Secondary tag filter

        Returns:
            Reputation summary dict
        """
        aid = int(agent_id)
        addresses = client_addresses or []

        if not addresses:
            return {
                "agent_id": aid,
                "feedback_count": 0,
                "average_score": None,
                "decimals": 0,
                "raw_value": 0,
                "note": "Provide client_addresses to query reputation from specific reviewers",
                "filters": {"client_addresses": addresses, "tag1": tag1, "tag2": tag2}
            }

        try:
            checksum_addresses = [Web3.to_checksum_address(a) for a in addresses]
            count, summary_value, decimals = self.reputation_registry.functions.getSummary(
                aid, checksum_addresses, tag1, tag2
            ).call()

            value = float(summary_value) / (10 ** int(decimals))

            return {
                "agent_id": aid,
                "feedback_count": int(count),
                "average_score": value,
                "decimals": int(decimals),
                "raw_value": int(summary_value),
                "filters": {"client_addresses": addresses, "tag1": tag1, "tag2": tag2}
            }
        except Exception as e:
            return {
                "agent_id": aid,
                "feedback_count": 0,
                "average_score": None,
                "decimals": 0,
                "raw_value": 0,
                "error": str(e),
                "filters": {"client_addresses": addresses, "tag1": tag1, "tag2": tag2}
            }

    def get_network_info(self) -> Dict[str, Any]:
        """Get current network configuration."""
        return {
            "network": self.network,
            "contracts": self.contracts,
            "explorer": self.explorer
        }

    # ==================== WRITE METHODS ====================

    def _get_account(self, private_key: str) -> Account:
        """Create account from private key."""
        key = private_key if private_key.startswith("0x") else f"0x{private_key}"
        return Account.from_key(key)

    def _build_and_send_tx(
        self,
        contract_func,
        private_key: str,
        gas_limit: int = 300000
    ) -> str:
        """Build, sign, and send a transaction."""
        account = self._get_account(private_key)

        # Build transaction
        tx = contract_func.build_transaction({
            "from": account.address,
            "nonce": self.w3.eth.get_transaction_count(account.address),
            "gas": gas_limit,
            "gasPrice": self.w3.eth.gas_price
        })

        # Sign and send
        signed = account.sign_transaction(tx)
        tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)

        # Wait for receipt
        self.w3.eth.wait_for_transaction_receipt(tx_hash)

        return tx_hash.hex()

    def register(
        self,
        private_key: str,
        agent_uri_or_metadata: Optional[Union[str, Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Register a new agent.

        Args:
            private_key: Private key for signing (with or without 0x prefix)
            agent_uri_or_metadata: Either a URI string or metadata dict (auto-converted to data URI)

        Returns:
            Registration result with agent_id, tx_hash, owner, explorer_url
        """
        account = self._get_account(private_key)

        # Convert metadata dict to data URI if needed
        agent_uri = ""
        if agent_uri_or_metadata:
            if isinstance(agent_uri_or_metadata, dict):
                agent_uri = create_data_uri(agent_uri_or_metadata)
            else:
                agent_uri = agent_uri_or_metadata

        # Call register function
        if agent_uri:
            func = self.identity_registry.functions.register(agent_uri)
        else:
            # Use the no-args version
            func = self.identity_registry.functions.register()

        tx_hash = self._build_and_send_tx(func, private_key, gas_limit=500000)

        # Get receipt to parse agent ID from Transfer event
        receipt = self.w3.eth.get_transaction_receipt(tx_hash)
        agent_id = None

        # Transfer event topic
        transfer_topic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
        for log in receipt.logs:
            if log.topics and log.topics[0].hex() == transfer_topic:
                if len(log.topics) >= 4:
                    agent_id = int(log.topics[3].hex(), 16)

        return {
            "agent_id": agent_id,
            "tx_hash": tx_hash,
            "owner": account.address,
            "explorer_url": f"{self.explorer}/tx/{tx_hash}"
        }

    def register_agent(
        self,
        private_key: str,
        name: str,
        description: str = "",
        image: str = "",
        services: Optional[List[Dict[str, str]]] = None,
        supported_trust: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Register a new agent with structured metadata (convenience method).

        Args:
            private_key: Private key for signing
            name: Agent name (required)
            description: Agent description
            image: Agent image URL
            services: List of service endpoint dicts
            supported_trust: Trust mechanisms (default: ['reputation'])

        Returns:
            Registration result
        """
        metadata = create_registration_metadata(
            name=name,
            description=description,
            image=image,
            services=services,
            supported_trust=supported_trust
        )
        return self.register(private_key, metadata)

    def set_agent_uri(
        self,
        private_key: str,
        agent_id: Union[int, str],
        new_uri_or_metadata: Union[str, Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Update an agent's URI.

        Args:
            private_key: Private key of the agent owner
            agent_id: Agent ID to update
            new_uri_or_metadata: New URI string or metadata dict

        Returns:
            Update result with agent_id, new_uri, tx_hash, explorer_url
        """
        aid = int(agent_id)

        if isinstance(new_uri_or_metadata, dict):
            new_uri = create_data_uri(new_uri_or_metadata)
        else:
            new_uri = new_uri_or_metadata

        func = self.identity_registry.functions.setAgentURI(aid, new_uri)
        tx_hash = self._build_and_send_tx(func, private_key)

        return {
            "agent_id": aid,
            "new_uri": new_uri,
            "tx_hash": tx_hash,
            "explorer_url": f"{self.explorer}/tx/{tx_hash}"
        }

    def give_feedback(
        self,
        private_key: str,
        agent_id: Union[int, str],
        value: float,
        decimals: int = 2,
        tag1: str = "",
        tag2: str = "",
        endpoint: str = "",
        feedback_uri: str = "",
        feedback_hash: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Give feedback/reputation to an agent.

        Args:
            private_key: Private key for signing
            agent_id: Agent ID to rate
            value: Score value (will be multiplied by 10^decimals)
            decimals: Decimal places for value (default: 2)
            tag1: Primary tag/category
            tag2: Secondary tag
            endpoint: Service endpoint being rated
            feedback_uri: URI with detailed feedback
            feedback_hash: Hash of feedback data (32 bytes hex)

        Returns:
            Feedback result
        """
        aid = int(agent_id)
        int_value = int(round(value * (10 ** decimals)))

        if feedback_hash is None:
            fb_hash = b'\x00' * 32
        else:
            fb_hash = bytes.fromhex(feedback_hash.replace("0x", ""))

        func = self.reputation_registry.functions.giveFeedback(
            aid, int_value, decimals, tag1, tag2, endpoint, feedback_uri, fb_hash
        )
        tx_hash = self._build_and_send_tx(func, private_key)

        return {
            "agent_id": aid,
            "value": value,
            "decimals": decimals,
            "tag1": tag1,
            "tag2": tag2,
            "tx_hash": tx_hash,
            "explorer_url": f"{self.explorer}/tx/{tx_hash}"
        }


def create_client(network: str = "mainnet", rpc_url: Optional[str] = None) -> ERC8004Client:
    """
    Create a client for the specified network.

    Args:
        network: Network name ('mainnet' or 'sepolia')
        rpc_url: Optional custom RPC URL

    Returns:
        ERC8004Client instance
    """
    return ERC8004Client(network=network, rpc_url=rpc_url)
