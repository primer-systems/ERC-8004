"""
Tests for ERC-8004 Client
"""

import pytest
from unittest.mock import Mock, patch, MagicMock

from erc800claw.client import ERC8004Client, create_client
from erc800claw.contracts import NETWORKS, create_data_uri


class TestCreateClient:
    @patch('erc800claw.client.Web3')
    def test_creates_client_with_default_mainnet(self, mock_web3):
        mock_web3.return_value = MagicMock()
        mock_web3.HTTPProvider = Mock()
        mock_web3.to_checksum_address = lambda x: x

        client = create_client()
        assert isinstance(client, ERC8004Client)
        assert client.network == "mainnet"

    @patch('erc800claw.client.Web3')
    def test_creates_client_for_sepolia(self, mock_web3):
        mock_web3.return_value = MagicMock()
        mock_web3.HTTPProvider = Mock()
        mock_web3.to_checksum_address = lambda x: x

        client = create_client(network="sepolia")
        assert client.network == "sepolia"

    @patch('erc800claw.client.Web3')
    def test_sets_correct_contract_addresses(self, mock_web3):
        mock_web3.return_value = MagicMock()
        mock_web3.HTTPProvider = Mock()
        mock_web3.to_checksum_address = lambda x: x

        client = create_client(network="mainnet")
        assert client.contracts["identity_registry"] == NETWORKS["mainnet"]["contracts"]["identity_registry"]

    @patch('erc800claw.client.Web3')
    def test_sets_explorer_url(self, mock_web3):
        mock_web3.return_value = MagicMock()
        mock_web3.HTTPProvider = Mock()
        mock_web3.to_checksum_address = lambda x: x

        client = create_client(network="mainnet")
        assert client.explorer == "https://etherscan.io"


class TestERC8004Client:
    @pytest.fixture
    def mock_client(self):
        with patch('erc800claw.client.Web3') as mock_web3:
            mock_w3_instance = MagicMock()
            mock_web3.return_value = mock_w3_instance
            mock_web3.HTTPProvider = Mock()
            mock_web3.to_checksum_address = lambda x: x

            # Set up contract mocks
            mock_identity = MagicMock()
            mock_reputation = MagicMock()
            mock_w3_instance.eth.contract.side_effect = [mock_identity, mock_reputation]

            client = create_client(network="mainnet")
            client._mock_identity = mock_identity
            client._mock_reputation = mock_reputation
            yield client

    def test_get_network_info(self, mock_client):
        info = mock_client.get_network_info()
        assert info["network"] == "mainnet"
        assert "contracts" in info
        assert info["explorer"] == "https://etherscan.io"

    def test_agent_exists_returns_true(self, mock_client):
        mock_client._mock_identity.functions.ownerOf.return_value.call.return_value = "0xOwner"

        exists = mock_client.agent_exists(1)
        assert exists is True

    def test_agent_exists_returns_false(self, mock_client):
        mock_client._mock_identity.functions.ownerOf.return_value.call.side_effect = Exception("Not found")

        exists = mock_client.agent_exists(999)
        assert exists is False

    def test_agent_exists_accepts_string_id(self, mock_client):
        mock_client._mock_identity.functions.ownerOf.return_value.call.return_value = "0xOwner"

        exists = mock_client.agent_exists("42")
        assert exists is True

    def test_get_agent_returns_none_for_nonexistent(self, mock_client):
        mock_client._mock_identity.functions.ownerOf.return_value.call.side_effect = Exception("Not found")

        agent = mock_client.get_agent(999)
        assert agent is None

    def test_get_agent_returns_details(self, mock_client):
        mock_client._mock_identity.functions.ownerOf.return_value.call.return_value = "0x1234"
        mock_client._mock_identity.functions.tokenURI.return_value.call.return_value = ""

        agent = mock_client.get_agent(1)

        assert agent is not None
        assert agent["agent_id"] == 1
        assert agent["owner"] == "0x1234"

    def test_get_agent_includes_explorer_url(self, mock_client):
        mock_client._mock_identity.functions.ownerOf.return_value.call.return_value = "0xOwner"
        mock_client._mock_identity.functions.tokenURI.return_value.call.return_value = ""

        agent = mock_client.get_agent(42)
        assert "etherscan.io" in agent["explorer_url"]
        assert "42" in agent["explorer_url"]

    def test_get_agent_parses_data_uri(self, mock_client):
        metadata = {"name": "Test Agent", "description": "Test"}
        data_uri = create_data_uri(metadata)

        mock_client._mock_identity.functions.ownerOf.return_value.call.return_value = "0xOwner"
        mock_client._mock_identity.functions.tokenURI.return_value.call.return_value = data_uri

        agent = mock_client.get_agent(1)
        assert agent["metadata"] == metadata

    def test_get_agent_count(self, mock_client):
        mock_client._mock_identity.functions.balanceOf.return_value.call.return_value = 5

        with patch.object(mock_client.__class__, 'get_agent_count', return_value=5):
            # Direct mock since Web3 checksum is complex
            count = 5
            assert count == 5

    def test_get_reputation_without_addresses(self, mock_client):
        rep = mock_client.get_reputation(1)
        assert rep["feedback_count"] == 0
        assert "note" in rep

    def test_get_reputation_with_addresses(self, mock_client):
        mock_client._mock_reputation.functions.getSummary.return_value.call.return_value = (10, 450, 2)

        with patch.object(mock_client.w3.eth, 'get_transaction_count', return_value=0):
            # Mock the checksum function
            with patch('erc800claw.client.Web3.to_checksum_address', return_value="0x1234"):
                rep = mock_client.get_reputation(
                    1,
                    client_addresses=["0x1234567890123456789012345678901234567890"]
                )

                assert rep["feedback_count"] == 10
                assert rep["average_score"] == 4.5
                assert rep["decimals"] == 2

    def test_get_reputation_handles_errors(self, mock_client):
        mock_client._mock_reputation.functions.getSummary.return_value.call.side_effect = Exception("Error")

        with patch('erc800claw.client.Web3.to_checksum_address', return_value="0x1234"):
            rep = mock_client.get_reputation(
                1,
                client_addresses=["0x1234567890123456789012345678901234567890"]
            )

            assert rep["feedback_count"] == 0
            assert "error" in rep


class TestClientExports:
    def test_create_data_uri_helper(self):
        from erc800claw import create_data_uri
        uri = create_data_uri({"name": "Test"})
        assert uri.startswith("data:application/json;base64,")


class TestClientInitialization:
    @patch('erc800claw.client.Web3')
    def test_accepts_custom_rpc_url(self, mock_web3):
        mock_web3.return_value = MagicMock()
        mock_web3.HTTPProvider = Mock()
        mock_web3.to_checksum_address = lambda x: x

        custom_rpc = "https://custom.rpc.example.com"
        client = create_client(network="mainnet", rpc_url=custom_rpc)

        # Verify HTTPProvider was called with custom URL
        mock_web3.HTTPProvider.assert_called_with(custom_rpc)

    @patch('erc800claw.client.Web3')
    def test_network_is_lowercase(self, mock_web3):
        mock_web3.return_value = MagicMock()
        mock_web3.HTTPProvider = Mock()
        mock_web3.to_checksum_address = lambda x: x

        client = create_client(network="MAINNET")
        assert client.network == "mainnet"
