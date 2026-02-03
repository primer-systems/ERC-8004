# ERC-800Claw

ERC-8004 SDK for OpenClaw agents. Register, query, and rate agent identities on Ethereum.

From [Primer Systems](https://primer.systems) · [@primer_systems](https://x.com/primer_systems)

```bash
npm install erc-800claw
```

## Quick Start

### CLI

```bash
# Get agent details
npx erc-800claw agent 1

# Check if agent exists
npx erc-800claw exists 1

# Get agent count for an address
npx erc-800claw owner 0x9ce7082814bDA389F3ba548BDf2626006279569c

# Register a new agent (requires private key)
PRIVATE_KEY=0x... npx erc-800claw register --name "My Agent" --network sepolia

# List networks and contracts
npx erc-800claw networks

# Show contract addresses
npx erc-800claw contracts mainnet

# Use testnet
npx erc-800claw agent 1 --network sepolia

# JSON output
npx erc-800claw agent 1 --json
```

### JavaScript/TypeScript

```javascript
const { createClient } = require('erc-800claw');

const client = createClient({ network: 'mainnet' });

// Get agent by ID
const agent = await client.getAgent(1);
console.log(agent);
// {
//   agentId: 1,
//   tokenURI: 'ipfs://...',
//   owner: '0x...',
//   metadata: { name: 'My Agent', ... },
//   explorerUrl: 'https://etherscan.io/...'
// }

// Check if agent exists
const exists = await client.agentExists(1);

// Get agent count for an address
const count = await client.getAgentCount('0x...');
console.log(`Address owns ${count} agents`);

// Register a new agent (no IPFS needed - uses data URI!)
const result = await client.registerAgent(process.env.PRIVATE_KEY, {
  name: 'My Autonomous Agent',
  description: 'Handles customer support',
  services: [{ name: 'support', endpoint: 'https://myagent.com/api' }]
});
console.log(`Registered agent #${result.agentId}`);

// Give feedback to an agent
await client.giveFeedback(process.env.PRIVATE_KEY, agentId, {
  value: 4.5,     // Score out of 5
  decimals: 1,
  tag1: 'support',
  tag2: 'fast'
});
```

## API

### `createClient(options?)`

Create a client instance.

```javascript
const client = createClient({
  network: 'mainnet',  // or 'sepolia'
  rpcUrl: 'https://...'  // optional custom RPC
});
```

### Read Methods

#### `client.getAgent(agentId)`

Get agent details by ID. Returns `null` if agent doesn't exist.

```javascript
{
  agentId: 1,
  tokenURI: 'ipfs://...' | null,
  owner: '0x...',
  metadata: { ... } | null,  // Fetched from tokenURI if available
  explorerUrl: 'https://...'
}
```

#### `client.agentExists(agentId)`

Check if an agent exists. Returns `true` or `false`.

#### `client.getAgentCount(ownerAddress)`

Get number of agents owned by an address.

#### `client.getReputation(agentId, options?)`

Get reputation summary for an agent.

```javascript
const rep = await client.getReputation(1, {
  clientAddresses: ['0x...'],  // Required: specific reviewers to query
  tag1: 'support',             // Optional: filter by tag
  tag2: ''
});
```

#### `client.getNetworkInfo()`

Get current network configuration.

### Write Methods

All write methods require a private key for signing transactions.

#### `client.register(privateKey, agentURIOrMetadata?)`

Register a new agent. Pass a URI string or metadata object (auto-converted to data URI).

```javascript
// With metadata object (recommended - no IPFS needed)
const result = await client.register(privateKey, {
  name: 'My Agent',
  description: 'Does cool stuff'
});

// With custom URI
const result = await client.register(privateKey, 'ipfs://...');

// Without URI (can set later)
const result = await client.register(privateKey);
```

#### `client.registerAgent(privateKey, options)`

Convenience method with structured options.

```javascript
const result = await client.registerAgent(privateKey, {
  name: 'My Agent',           // Required
  description: 'Agent desc',  // Optional
  image: 'https://...',       // Optional
  services: [{                // Optional
    name: 'api',
    endpoint: 'https://...'
  }],
  supportedTrust: ['reputation']  // Optional, default: ['reputation']
});
// Returns: { agentId, txHash, owner, explorerUrl }
```

#### `client.setAgentURI(privateKey, agentId, newURIOrMetadata)`

Update an agent's metadata URI.

```javascript
await client.setAgentURI(privateKey, agentId, {
  name: 'Updated Name',
  description: 'New description'
});
```

#### `client.giveFeedback(privateKey, agentId, feedback)`

Submit reputation feedback for an agent.

```javascript
await client.giveFeedback(privateKey, agentId, {
  value: 4.5,              // Score value
  decimals: 1,             // Decimal places (default: 2)
  tag1: 'quality',         // Primary category
  tag2: 'fast',            // Secondary tag
  endpoint: '/api/chat',   // Which endpoint was used
  feedbackURI: '',         // Optional: link to detailed feedback
  feedbackHash: '0x...'    // Optional: hash of feedback data
});
```

### Helper Functions

#### `createDataURI(metadata)`

Create a data URI from a metadata object (no IPFS upload needed).

```javascript
const { createDataURI } = require('erc-800claw');
const uri = createDataURI({ name: 'My Agent', description: '...' });
// Returns: data:application/json;base64,...
```

#### `parseDataURI(dataUri)`

Parse a data URI back to a metadata object.

#### `createRegistrationMetadata(options)`

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
- [erc-8004-js](https://github.com/tetratorus/erc-8004-js) - Alternative SDK
- [agent0-sdk](https://www.npmjs.com/package/agent0-sdk) - Full-featured SDK with IPFS

## License

MIT - [Primer Systems](https://primer.systems)
