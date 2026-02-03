"""
Tests for ERC-8004 contract helpers
"""

import pytest
import json
import base64

from erc800claw.contracts import (
    NETWORKS,
    IDENTITY_REGISTRY_ABI,
    REPUTATION_REGISTRY_ABI,
    get_network,
    get_contracts,
    create_data_uri,
    parse_data_uri,
    create_registration_metadata
)


class TestNetworks:
    def test_has_mainnet_and_sepolia(self):
        assert "mainnet" in NETWORKS
        assert "sepolia" in NETWORKS

    def test_mainnet_chain_id(self):
        assert NETWORKS["mainnet"]["chain_id"] == 1

    def test_sepolia_chain_id(self):
        assert NETWORKS["sepolia"]["chain_id"] == 11155111

    def test_networks_have_contract_addresses(self):
        for network in NETWORKS.values():
            assert "identity_registry" in network["contracts"]
            assert "reputation_registry" in network["contracts"]
            # Addresses should be valid Ethereum format
            assert network["contracts"]["identity_registry"].startswith("0x")
            assert len(network["contracts"]["identity_registry"]) == 42

    def test_mainnet_identity_starts_with_8004(self):
        assert NETWORKS["mainnet"]["contracts"]["identity_registry"].lower().startswith("0x8004")


class TestGetNetwork:
    def test_returns_mainnet_by_default(self):
        network = get_network()
        assert network["chain_id"] == 1
        assert network["name"] == "Ethereum Mainnet"

    def test_returns_mainnet_for_mainnet(self):
        network = get_network("mainnet")
        assert network["chain_id"] == 1

    def test_returns_sepolia_for_sepolia(self):
        network = get_network("sepolia")
        assert network["chain_id"] == 11155111

    def test_case_insensitive(self):
        assert get_network("MAINNET")["chain_id"] == 1
        assert get_network("Sepolia")["chain_id"] == 11155111

    def test_raises_for_unknown_network(self):
        with pytest.raises(ValueError, match="Unknown network"):
            get_network("unknown")


class TestGetContracts:
    def test_returns_mainnet_contracts_by_default(self):
        contracts = get_contracts()
        assert contracts["identity_registry"] == NETWORKS["mainnet"]["contracts"]["identity_registry"]

    def test_returns_sepolia_contracts(self):
        contracts = get_contracts("sepolia")
        assert contracts["identity_registry"] == NETWORKS["sepolia"]["contracts"]["identity_registry"]
        assert contracts["reputation_registry"] == NETWORKS["sepolia"]["contracts"]["reputation_registry"]


class TestCreateDataURI:
    def test_creates_valid_data_uri(self):
        metadata = {"name": "Test Agent", "description": "A test"}
        uri = create_data_uri(metadata)
        assert uri.startswith("data:application/json;base64,")

    def test_encodes_json_correctly(self):
        metadata = {"name": "Test", "value": 123}
        uri = create_data_uri(metadata)

        base64_part = uri.replace("data:application/json;base64,", "")
        decoded = base64.b64decode(base64_part).decode("utf-8")
        assert json.loads(decoded) == metadata

    def test_handles_complex_nested_objects(self):
        metadata = {
            "name": "Complex Agent",
            "services": [{"name": "api", "endpoint": "https://example.com"}],
            "nested": {"deep": {"value": True}}
        }
        uri = create_data_uri(metadata)
        parsed = parse_data_uri(uri)
        assert parsed == metadata

    def test_handles_unicode_characters(self):
        metadata = {"name": "🤖 Agent émoji"}
        uri = create_data_uri(metadata)
        parsed = parse_data_uri(uri)
        assert parsed["name"] == "🤖 Agent émoji"


class TestParseDataURI:
    def test_parses_valid_data_uri(self):
        original = {"name": "Test", "id": 42}
        uri = create_data_uri(original)
        parsed = parse_data_uri(uri)
        assert parsed == original

    def test_raises_for_invalid_format(self):
        with pytest.raises(ValueError, match="Invalid data URI format"):
            parse_data_uri("invalid")

        with pytest.raises(ValueError, match="Invalid data URI format"):
            parse_data_uri("data:text/plain;base64,abc")

    def test_raises_for_invalid_json(self):
        invalid_uri = "data:application/json;base64," + base64.b64encode(b"not json").decode()
        with pytest.raises(json.JSONDecodeError):
            parse_data_uri(invalid_uri)


class TestCreateRegistrationMetadata:
    def test_creates_metadata_with_required_name(self):
        metadata = create_registration_metadata(name="My Agent")
        assert metadata["name"] == "My Agent"
        assert metadata["type"] == "https://eips.ethereum.org/EIPS/eip-8004#registration-v1"
        assert metadata["supportedTrust"] == ["reputation"]

    def test_includes_optional_fields(self):
        metadata = create_registration_metadata(
            name="Full Agent",
            description="A complete agent",
            image="https://example.com/image.png",
            services=[{"name": "api", "endpoint": "https://api.example.com"}],
            supported_trust=["reputation", "validation"]
        )
        assert metadata["name"] == "Full Agent"
        assert metadata["description"] == "A complete agent"
        assert metadata["image"] == "https://example.com/image.png"
        assert len(metadata["services"]) == 1
        assert "validation" in metadata["supportedTrust"]

    def test_sets_empty_defaults(self):
        metadata = create_registration_metadata(name="Minimal")
        assert metadata["description"] == ""
        assert metadata["image"] == ""
        assert metadata["services"] == []


class TestABIs:
    def test_identity_registry_has_register(self):
        register_fns = [f for f in IDENTITY_REGISTRY_ABI if f["name"] == "register"]
        assert len(register_fns) >= 1

    def test_identity_registry_has_owner_of(self):
        owner_of = next((f for f in IDENTITY_REGISTRY_ABI if f["name"] == "ownerOf"), None)
        assert owner_of is not None
        assert owner_of["type"] == "function"
        assert owner_of["stateMutability"] == "view"

    def test_reputation_registry_has_give_feedback(self):
        give_feedback = next((f for f in REPUTATION_REGISTRY_ABI if f["name"] == "giveFeedback"), None)
        assert give_feedback is not None
        assert give_feedback["type"] == "function"

    def test_reputation_registry_has_get_summary(self):
        get_summary = next((f for f in REPUTATION_REGISTRY_ABI if f["name"] == "getSummary"), None)
        assert get_summary is not None
        assert get_summary["stateMutability"] == "view"
