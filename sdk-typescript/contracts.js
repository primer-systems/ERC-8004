/**
 * 800claw - ERC-8004 Contract Addresses and ABIs
 * https://8004.org
 */

const NETWORKS = {
  mainnet: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpc: 'https://eth.drpc.org',
    explorer: 'https://etherscan.io',
    contracts: {
      identityRegistry: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
      reputationRegistry: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63',
      validationRegistry: '0x0000000000000000000000000000000000000000'
    }
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpc: 'https://ethereum-sepolia-rpc.publicnode.com',
    explorer: 'https://sepolia.etherscan.io',
    contracts: {
      identityRegistry: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
      reputationRegistry: '0x8004B663056A597Dffe9eCcC1965A193B7388713',
      validationRegistry: '0x0000000000000000000000000000000000000000'
    }
  }
};

// ABI fragments for Identity Registry
const IDENTITY_REGISTRY_ABI = [
  // Write functions
  {
    name: 'register',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentURI', type: 'string' },
      { name: 'metadata', type: 'tuple[]', components: [
        { name: 'metadataKey', type: 'string' },
        { name: 'metadataValue', type: 'bytes' }
      ]}
    ],
    outputs: [{ name: 'agentId', type: 'uint256' }]
  },
  {
    name: 'register',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'agentURI', type: 'string' }],
    outputs: [{ name: 'agentId', type: 'uint256' }]
  },
  {
    name: 'register',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [{ name: 'agentId', type: 'uint256' }]
  },
  {
    name: 'setAgentURI',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'newURI', type: 'string' }
    ],
    outputs: []
  },
  {
    name: 'setMetadata',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'metadataKey', type: 'string' },
      { name: 'metadataValue', type: 'bytes' }
    ],
    outputs: []
  },
  {
    name: 'setAgentWallet',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'newWallet', type: 'address' },
      { name: 'deadline', type: 'uint256' },
      { name: 'signature', type: 'bytes' }
    ],
    outputs: []
  },
  {
    name: 'unsetAgentWallet',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: []
  },
  // Read functions
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }]
  },
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'agentExists',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'getAgentWallet',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }]
  },
  {
    name: 'getMetadata',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'metadataKey', type: 'string' }
    ],
    outputs: [{ name: '', type: 'bytes' }]
  }
];

const REPUTATION_REGISTRY_ABI = [
  // Write functions
  {
    name: 'giveFeedback',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'value', type: 'int128' },
      { name: 'valueDecimals', type: 'uint8' },
      { name: 'tag1', type: 'string' },
      { name: 'tag2', type: 'string' },
      { name: 'endpoint', type: 'string' },
      { name: 'feedbackURI', type: 'string' },
      { name: 'feedbackHash', type: 'bytes32' }
    ],
    outputs: []
  },
  {
    name: 'revokeFeedback',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'feedbackIndex', type: 'uint64' }
    ],
    outputs: []
  },
  {
    name: 'appendResponse',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'clientAddress', type: 'address' },
      { name: 'feedbackIndex', type: 'uint64' },
      { name: 'responseURI', type: 'string' },
      { name: 'responseHash', type: 'bytes32' }
    ],
    outputs: []
  },
  // Read functions
  {
    name: 'getSummary',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'clientAddresses', type: 'address[]' },
      { name: 'tag1', type: 'string' },
      { name: 'tag2', type: 'string' }
    ],
    outputs: [
      { name: 'count', type: 'uint64' },
      { name: 'summaryValue', type: 'int128' },
      { name: 'summaryValueDecimals', type: 'uint8' }
    ]
  },
  {
    name: 'readFeedback',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'clientAddress', type: 'address' },
      { name: 'index', type: 'uint64' }
    ],
    outputs: [
      { name: 'value', type: 'int128' },
      { name: 'valueDecimals', type: 'uint8' },
      { name: 'tag1', type: 'string' },
      { name: 'tag2', type: 'string' },
      { name: 'isRevoked', type: 'bool' }
    ]
  },
  {
    name: 'readAllFeedback',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'clientAddresses', type: 'address[]' },
      { name: 'tag1', type: 'string' },
      { name: 'tag2', type: 'string' },
      { name: 'includeRevoked', type: 'bool' }
    ],
    outputs: [
      { name: 'clients', type: 'address[]' },
      { name: 'feedbackIndexes', type: 'uint64[]' },
      { name: 'values', type: 'int128[]' },
      { name: 'valueDecimals', type: 'uint8[]' },
      { name: 'tag1s', type: 'string[]' },
      { name: 'tag2s', type: 'string[]' },
      { name: 'revokedStatuses', type: 'bool[]' }
    ]
  },
  {
    name: 'getResponseCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'clientAddress', type: 'address' },
      { name: 'feedbackIndex', type: 'uint64' },
      { name: 'responders', type: 'address[]' }
    ],
    outputs: [{ name: 'count', type: 'uint64' }]
  },
  {
    name: 'getClients',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address[]' }]
  },
  {
    name: 'getLastIndex',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'clientAddress', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint64' }]
  },
  {
    name: 'getIdentityRegistry',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }]
  }
];

function getNetwork(networkName = 'mainnet') {
  const network = NETWORKS[networkName.toLowerCase()];
  if (!network) {
    throw new Error(`Unknown network: ${networkName}. Available: ${Object.keys(NETWORKS).join(', ')}`);
  }
  return network;
}

function getContracts(networkName = 'mainnet') {
  return getNetwork(networkName).contracts;
}

/**
 * Create a data URI from agent metadata (no IPFS needed)
 * @param {object} metadata - Agent metadata object
 * @returns {string} data URI that can be used as agentURI
 */
function createDataURI(metadata) {
  const json = JSON.stringify(metadata);
  const base64 = Buffer.from(json).toString('base64');
  return `data:application/json;base64,${base64}`;
}

/**
 * Parse a data URI back to metadata object
 * @param {string} dataUri - data URI string
 * @returns {object} parsed metadata
 */
function parseDataURI(dataUri) {
  if (!dataUri.startsWith('data:application/json;base64,')) {
    throw new Error('Invalid data URI format');
  }
  const base64 = dataUri.slice('data:application/json;base64,'.length);
  const json = Buffer.from(base64, 'base64').toString('utf-8');
  return JSON.parse(json);
}

/**
 * Create a standard ERC-8004 registration metadata object
 */
function createRegistrationMetadata(options) {
  return {
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name: options.name,
    description: options.description || '',
    image: options.image || '',
    services: options.services || [],
    supportedTrust: options.supportedTrust || ['reputation']
  };
}

module.exports = {
  NETWORKS,
  IDENTITY_REGISTRY_ABI,
  REPUTATION_REGISTRY_ABI,
  getNetwork,
  getContracts,
  createDataURI,
  parseDataURI,
  createRegistrationMetadata
};
