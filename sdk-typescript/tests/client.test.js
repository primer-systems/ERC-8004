/**
 * Tests for ERC-8004 Client
 */

const { createClient, ERC8004Client, createDataURI } = require('../client');
const { NETWORKS, getContracts } = require('../contracts');

// Mock viem modules
jest.mock('viem', () => ({
  createPublicClient: jest.fn(() => ({
    readContract: jest.fn(),
    waitForTransactionReceipt: jest.fn()
  })),
  createWalletClient: jest.fn(() => ({
    writeContract: jest.fn()
  })),
  http: jest.fn((url) => ({ url })),
  parseEther: jest.fn()
}));

jest.mock('viem/chains', () => ({
  mainnet: { id: 1, name: 'Ethereum' },
  sepolia: { id: 11155111, name: 'Sepolia' }
}));

jest.mock('viem/accounts', () => ({
  privateKeyToAccount: jest.fn((key) => ({
    address: '0x1234567890123456789012345678901234567890'
  }))
}));

describe('createClient', () => {
  test('should create client with default mainnet', () => {
    const client = createClient();
    expect(client).toBeInstanceOf(ERC8004Client);
    expect(client.network).toBe('mainnet');
  });

  test('should create client for sepolia', () => {
    const client = createClient({ network: 'sepolia' });
    expect(client.network).toBe('sepolia');
  });

  test('should set correct contract addresses', () => {
    const client = createClient({ network: 'mainnet' });
    expect(client.contracts.identityRegistry).toBe(NETWORKS.mainnet.contracts.identityRegistry);
  });

  test('should set explorer URL', () => {
    const client = createClient({ network: 'mainnet' });
    expect(client.explorer).toBe('https://etherscan.io');
  });

  test('should throw for unknown network', () => {
    expect(() => createClient({ network: 'unknown' })).toThrow();
  });
});

describe('ERC8004Client', () => {
  let client;
  let mockReadContract;

  beforeEach(() => {
    client = createClient({ network: 'mainnet' });
    mockReadContract = client.client.readContract;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getNetworkInfo', () => {
    test('should return current network info', () => {
      const info = client.getNetworkInfo();
      expect(info.network).toBe('mainnet');
      expect(info.contracts).toBeDefined();
      expect(info.explorer).toBe('https://etherscan.io');
    });
  });

  describe('agentExists', () => {
    test('should return true when agent exists', async () => {
      mockReadContract.mockResolvedValueOnce('0xOwnerAddress');
      const exists = await client.agentExists(1);
      expect(exists).toBe(true);
    });

    test('should return false when agent does not exist', async () => {
      mockReadContract.mockRejectedValueOnce(new Error('Token does not exist'));
      const exists = await client.agentExists(999);
      expect(exists).toBe(false);
    });

    test('should accept string agent ID', async () => {
      mockReadContract.mockResolvedValueOnce('0xOwnerAddress');
      const exists = await client.agentExists('42');
      expect(exists).toBe(true);
    });
  });

  describe('getAgent', () => {
    test('should return null for non-existent agent', async () => {
      mockReadContract.mockRejectedValueOnce(new Error('Token does not exist'));
      const agent = await client.getAgent(999);
      expect(agent).toBeNull();
    });

    test('should return agent details for existing agent', async () => {
      mockReadContract
        .mockResolvedValueOnce('0x1234567890123456789012345678901234567890') // ownerOf
        .mockResolvedValueOnce('data:application/json;base64,eyJuYW1lIjoiVGVzdCJ9'); // tokenURI

      const agent = await client.getAgent(1);

      expect(agent).not.toBeNull();
      expect(agent.agentId).toBe(1);
      expect(agent.owner).toBe('0x1234567890123456789012345678901234567890');
      expect(agent.tokenURI).toContain('data:application/json;base64');
    });

    test('should include explorer URL', async () => {
      mockReadContract
        .mockResolvedValueOnce('0xOwner')
        .mockResolvedValueOnce('');

      const agent = await client.getAgent(42);
      expect(agent.explorerUrl).toContain('etherscan.io');
      expect(agent.explorerUrl).toContain('42');
    });

    test('should handle missing tokenURI gracefully', async () => {
      mockReadContract
        .mockResolvedValueOnce('0xOwner')
        .mockRejectedValueOnce(new Error('No URI'));

      const agent = await client.getAgent(1);
      expect(agent.tokenURI).toBeNull();
      expect(agent.metadata).toBeNull();
    });
  });

  describe('getAgentCount', () => {
    test('should return agent count for address', async () => {
      mockReadContract.mockResolvedValueOnce(BigInt(5));
      const count = await client.getAgentCount('0x1234567890123456789012345678901234567890');
      expect(count).toBe(5);
    });

    test('should return 0 for address with no agents', async () => {
      mockReadContract.mockResolvedValueOnce(BigInt(0));
      const count = await client.getAgentCount('0x0000000000000000000000000000000000000000');
      expect(count).toBe(0);
    });
  });

  describe('getReputation', () => {
    test('should return note when no clientAddresses provided', async () => {
      const rep = await client.getReputation(1);
      expect(rep.feedbackCount).toBe(0);
      expect(rep.note).toContain('clientAddresses');
    });

    test('should return reputation data with clientAddresses', async () => {
      mockReadContract.mockResolvedValueOnce([
        BigInt(10),  // count
        BigInt(450), // summaryValue
        2            // decimals
      ]);

      const rep = await client.getReputation(1, {
        clientAddresses: ['0x1234567890123456789012345678901234567890']
      });

      expect(rep.feedbackCount).toBe(10);
      expect(rep.averageScore).toBe(4.5);
      expect(rep.decimals).toBe(2);
    });

    test('should handle reputation errors gracefully', async () => {
      mockReadContract.mockRejectedValueOnce(new Error('Contract error'));

      const rep = await client.getReputation(1, {
        clientAddresses: ['0x1234567890123456789012345678901234567890']
      });

      expect(rep.feedbackCount).toBe(0);
      expect(rep.error).toBeDefined();
    });

    test('should pass tag filters', async () => {
      mockReadContract.mockResolvedValueOnce([BigInt(5), BigInt(400), 2]);

      const rep = await client.getReputation(1, {
        clientAddresses: ['0x1234567890123456789012345678901234567890'],
        tag1: 'support',
        tag2: 'fast'
      });

      expect(rep.filters.tag1).toBe('support');
      expect(rep.filters.tag2).toBe('fast');
    });
  });
});

describe('Client exports', () => {
  test('should export createDataURI helper', () => {
    const uri = createDataURI({ name: 'Test' });
    expect(uri).toMatch(/^data:application\/json;base64,/);
  });
});
