# ERC-800Claw

ERC-8004 SDK for OpenClaw agents. Register, query, and rate agent identities on Ethereum.

From [Primer Systems](https://primer.systems) · [@primer_systems](https://x.com/primer_systems)

```bash
pip install erc-800claw
```

## Quick Start

### CLI

```bash
# Get agent details
erc-800claw agent 1

# Check if agent exists
erc-800claw exists 1

# Get agent count for an address
erc-800claw owner 0x9ce7082814bDA389F3ba548BDf2626006279569c

# Register a new agent (requires private key)
PRIVATE_KEY=0x... erc-800claw register --name "My Agent" --network sepolia

# List networks and contracts
erc-800claw networks

# Show contract addresses
erc-800claw contracts mainnet

# Use testnet
erc-800claw agent 1 --network sepolia

# JSON output
erc-800claw agent 1 --json
```

### Python

```python
from erc800claw import create_client

client = create_client(network='mainnet')

# Get agent by ID
agent = client.get_agent(1)
print(agent)
# {
#     'agent_id': 1,
#     'token_uri': 'ipfs://...',
#     'owner': '0x...',
#     'metadata': {'name': 'My Agent', ...},
#     'explorer_url': 'https://etherscan.io/...'
# }

# Check if agent exists
exists = client.agent_exists(1)

# Get agent count for an address
count = client.get_agent_count('0x...')
print(f"Address owns {count} agents")

# Register a new agent (no IPFS needed - uses data URI!)
import os
result = client.register_agent(
    private_key=os.environ['PRIVATE_KEY'],
    name='My Autonomous Agent',
    description='Handles customer support',
    services=[{'name': 'support', 'endpoint': 'https://myagent.com/api'}]
)
print(f"Registered agent #{result['agent_id']}")

# Give feedback to an agent
client.give_feedback(
    private_key=os.environ['PRIVATE_KEY'],
    agent_id=agent_id,
    value=4.5,        # Score out of 5
    decimals=1,
    tag1='support',
    tag2='fast'
)
```

## API

### `create_client(network='mainnet', rpc_url=None)`

Create a client instance.

```python
client = create_client(
    network='mainnet',  # or 'sepolia'
    rpc_url='https://...'  # optional custom RPC
)
```

### Read Methods

#### `client.get_agent(agent_id)`

Get agent details by ID. Returns `None` if agent doesn't exist.

```python
{
    'agent_id': 1,
    'token_uri': 'ipfs://...' or None,
    'owner': '0x...',
    'metadata': {...} or None,  # Fetched from token_uri if available
    'explorer_url': 'https://...'
}
```

#### `client.agent_exists(agent_id)`

Check if an agent exists. Returns `True` or `False`.

#### `client.get_agent_count(owner_address)`

Get number of agents owned by an address.

#### `client.get_reputation(agent_id, client_addresses=None, tag1='', tag2='')`

Get reputation summary for an agent.

```python
rep = client.get_reputation(
    1,
    client_addresses=['0x...'],  # Required: specific reviewers to query
    tag1='support',              # Optional: filter by tag
    tag2=''
)
```

#### `client.get_network_info()`

Get current network configuration.

### Write Methods

All write methods require a private key for signing transactions.

#### `client.register(private_key, agent_uri_or_metadata=None)`

Register a new agent. Pass a URI string or metadata dict (auto-converted to data URI).

```python
# With metadata dict (recommended - no IPFS needed)
result = client.register(private_key, {
    'name': 'My Agent',
    'description': 'Does cool stuff'
})

# With custom URI
result = client.register(private_key, 'ipfs://...')

# Without URI (can set later)
result = client.register(private_key)
```

#### `client.register_agent(private_key, name, description='', image='', services=None, supported_trust=None)`

Convenience method with structured arguments.

```python
result = client.register_agent(
    private_key,
    name='My Agent',           # Required
    description='Agent desc',  # Optional
    image='https://...',       # Optional
    services=[{                # Optional
        'name': 'api',
        'endpoint': 'https://...'
    }],
    supported_trust=['reputation']  # Optional, default: ['reputation']
)
# Returns: {'agent_id': ..., 'tx_hash': ..., 'owner': ..., 'explorer_url': ...}
```

#### `client.set_agent_uri(private_key, agent_id, new_uri_or_metadata)`

Update an agent's metadata URI.

```python
client.set_agent_uri(private_key, agent_id, {
    'name': 'Updated Name',
    'description': 'New description'
})
```

#### `client.give_feedback(private_key, agent_id, value, decimals=2, tag1='', tag2='', endpoint='', feedback_uri='', feedback_hash=None)`

Submit reputation feedback for an agent.

```python
client.give_feedback(
    private_key,
    agent_id,
    value=4.5,              # Score value
    decimals=1,             # Decimal places (default: 2)
    tag1='quality',         # Primary category
    tag2='fast',            # Secondary tag
    endpoint='/api/chat',   # Which endpoint was used
    feedback_uri='',        # Optional: link to detailed feedback
    feedback_hash='0x...'   # Optional: hash of feedback data
)
```

### Helper Functions

#### `create_data_uri(metadata)`

Create a data URI from a metadata dict (no IPFS upload needed).

```python
from erc800claw import create_data_uri
uri = create_data_uri({'name': 'My Agent', 'description': '...'})
# Returns: data:application/json;base64,...
```

#### `parse_data_uri(data_uri)`

Parse a data URI back to a metadata dict.

#### `create_registration_metadata(name, description='', image='', services=None, supported_trust=None)`

Create standard ERC-8004 registration metadata.

## Networks

| Network | Chain ID | Status |
|---------|----------|--------|
| Ethereum Mainnet | 1 | Live |
| Sepolia Testnet | 11155111 | Live |

## Contract Addresses

### Mainnet

- Identity Registry: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- Reputation Registry: `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`

### Sepolia

- Identity Registry: `0x8004A818BFB912233c491871b3d84c89A494BD9e`
- Reputation Registry: `0x8004B663056A597Dffe9eCcC1965A193B7388713`

## What is ERC-8004?

ERC-8004 provides on-chain identity, reputation, and validation for autonomous agents:

- **Identity Registry** - ERC-721 agent identities with registration metadata
- **Reputation Registry** - Signed feedback scores between agents/clients
- **Validation Registry** - Independent verification (zkML, TEE, stakers)

Learn more: [8004.org](https://8004.org) | [EIP-8004](https://eips.ethereum.org/EIPS/eip-8004)

## Related

- [xclaw02](https://github.com/primer-systems/xClaw02) - x402 payments SDK for OpenClaw
- [erc-8004-js](https://github.com/tetratorus/erc-8004-js) - Alternative TypeScript SDK
- [agent0-sdk](https://www.npmjs.com/package/agent0-sdk) - Full-featured SDK with IPFS

## License

MIT - [Primer Systems](https://primer.systems)
