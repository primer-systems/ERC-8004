/**
 * Tests for ERC-8004 contract helpers
 */

const {
  NETWORKS,
  IDENTITY_REGISTRY_ABI,
  REPUTATION_REGISTRY_ABI,
  getNetwork,
  getContracts,
  createDataURI,
  parseDataURI,
  createRegistrationMetadata
} = require('../contracts');

describe('NETWORKS', () => {
  test('should have mainnet and sepolia configurations', () => {
    expect(NETWORKS.mainnet).toBeDefined();
    expect(NETWORKS.sepolia).toBeDefined();
  });

  test('mainnet should have correct chain ID', () => {
    expect(NETWORKS.mainnet.chainId).toBe(1);
  });

  test('sepolia should have correct chain ID', () => {
    expect(NETWORKS.sepolia.chainId).toBe(11155111);
  });

  test('networks should have required contract addresses', () => {
    for (const network of Object.values(NETWORKS)) {
      expect(network.contracts.identityRegistry).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(network.contracts.reputationRegistry).toMatch(/^0x[a-fA-F0-9]{40}$/);
    }
  });

  test('mainnet identity registry should start with 0x8004', () => {
    expect(NETWORKS.mainnet.contracts.identityRegistry).toMatch(/^0x8004/i);
  });
});

describe('getNetwork', () => {
  test('should return mainnet config by default', () => {
    const network = getNetwork();
    expect(network.chainId).toBe(1);
    expect(network.name).toBe('Ethereum Mainnet');
  });

  test('should return mainnet config for "mainnet"', () => {
    const network = getNetwork('mainnet');
    expect(network.chainId).toBe(1);
  });

  test('should return sepolia config for "sepolia"', () => {
    const network = getNetwork('sepolia');
    expect(network.chainId).toBe(11155111);
  });

  test('should be case-insensitive', () => {
    expect(getNetwork('MAINNET').chainId).toBe(1);
    expect(getNetwork('Sepolia').chainId).toBe(11155111);
  });

  test('should throw for unknown network', () => {
    expect(() => getNetwork('unknown')).toThrow('Unknown network');
  });
});

describe('getContracts', () => {
  test('should return mainnet contracts by default', () => {
    const contracts = getContracts();
    expect(contracts.identityRegistry).toBe(NETWORKS.mainnet.contracts.identityRegistry);
  });

  test('should return correct contracts for sepolia', () => {
    const contracts = getContracts('sepolia');
    expect(contracts.identityRegistry).toBe(NETWORKS.sepolia.contracts.identityRegistry);
    expect(contracts.reputationRegistry).toBe(NETWORKS.sepolia.contracts.reputationRegistry);
  });
});

describe('createDataURI', () => {
  test('should create valid data URI from object', () => {
    const metadata = { name: 'Test Agent', description: 'A test' };
    const uri = createDataURI(metadata);

    expect(uri).toMatch(/^data:application\/json;base64,/);
  });

  test('should encode JSON correctly', () => {
    const metadata = { name: 'Test', value: 123 };
    const uri = createDataURI(metadata);

    const base64Part = uri.replace('data:application/json;base64,', '');
    const decoded = Buffer.from(base64Part, 'base64').toString('utf-8');
    expect(JSON.parse(decoded)).toEqual(metadata);
  });

  test('should handle complex nested objects', () => {
    const metadata = {
      name: 'Complex Agent',
      services: [
        { name: 'api', endpoint: 'https://example.com' }
      ],
      nested: { deep: { value: true } }
    };
    const uri = createDataURI(metadata);
    const parsed = parseDataURI(uri);

    expect(parsed).toEqual(metadata);
  });

  test('should handle unicode characters', () => {
    const metadata = { name: '🤖 Agent émoji' };
    const uri = createDataURI(metadata);
    const parsed = parseDataURI(uri);

    expect(parsed.name).toBe('🤖 Agent émoji');
  });
});

describe('parseDataURI', () => {
  test('should parse valid data URI', () => {
    const original = { name: 'Test', id: 42 };
    const uri = createDataURI(original);
    const parsed = parseDataURI(uri);

    expect(parsed).toEqual(original);
  });

  test('should throw for invalid data URI format', () => {
    expect(() => parseDataURI('invalid')).toThrow('Invalid data URI format');
    expect(() => parseDataURI('data:text/plain;base64,abc')).toThrow('Invalid data URI format');
  });

  test('should throw for invalid JSON', () => {
    const invalidUri = 'data:application/json;base64,' + Buffer.from('not json').toString('base64');
    expect(() => parseDataURI(invalidUri)).toThrow();
  });
});

describe('createRegistrationMetadata', () => {
  test('should create valid metadata with required name', () => {
    const metadata = createRegistrationMetadata({ name: 'My Agent' });

    expect(metadata.name).toBe('My Agent');
    expect(metadata.type).toBe('https://eips.ethereum.org/EIPS/eip-8004#registration-v1');
    expect(metadata.supportedTrust).toEqual(['reputation']);
  });

  test('should include optional fields when provided', () => {
    const metadata = createRegistrationMetadata({
      name: 'Full Agent',
      description: 'A complete agent',
      image: 'https://example.com/image.png',
      services: [{ name: 'api', endpoint: 'https://api.example.com' }],
      supportedTrust: ['reputation', 'validation']
    });

    expect(metadata.name).toBe('Full Agent');
    expect(metadata.description).toBe('A complete agent');
    expect(metadata.image).toBe('https://example.com/image.png');
    expect(metadata.services).toHaveLength(1);
    expect(metadata.supportedTrust).toContain('validation');
  });

  test('should set empty defaults for optional fields', () => {
    const metadata = createRegistrationMetadata({ name: 'Minimal' });

    expect(metadata.description).toBe('');
    expect(metadata.image).toBe('');
    expect(metadata.services).toEqual([]);
  });
});

describe('ABIs', () => {
  test('IDENTITY_REGISTRY_ABI should have register function', () => {
    const registerFns = IDENTITY_REGISTRY_ABI.filter(f => f.name === 'register');
    expect(registerFns.length).toBeGreaterThanOrEqual(1);
  });

  test('IDENTITY_REGISTRY_ABI should have ownerOf function', () => {
    const ownerOf = IDENTITY_REGISTRY_ABI.find(f => f.name === 'ownerOf');
    expect(ownerOf).toBeDefined();
    expect(ownerOf.type).toBe('function');
    expect(ownerOf.stateMutability).toBe('view');
  });

  test('REPUTATION_REGISTRY_ABI should have giveFeedback function', () => {
    const giveFeedback = REPUTATION_REGISTRY_ABI.find(f => f.name === 'giveFeedback');
    expect(giveFeedback).toBeDefined();
    expect(giveFeedback.type).toBe('function');
  });

  test('REPUTATION_REGISTRY_ABI should have getSummary function', () => {
    const getSummary = REPUTATION_REGISTRY_ABI.find(f => f.name === 'getSummary');
    expect(getSummary).toBeDefined();
    expect(getSummary.stateMutability).toBe('view');
  });
});
