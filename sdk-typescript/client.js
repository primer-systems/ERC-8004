/**
 * 800claw - ERC-8004 Client
 * https://8004.org
 */

const { createPublicClient, createWalletClient, http, parseEther } = require('viem');
const { mainnet, sepolia } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');
const { NETWORKS, IDENTITY_REGISTRY_ABI, REPUTATION_REGISTRY_ABI, getNetwork, getContracts, createDataURI, parseDataURI, createRegistrationMetadata } = require('./contracts');

const CHAINS = {
  mainnet: mainnet,
  sepolia: sepolia
};

class ERC8004Client {
  constructor(options = {}) {
    const networkName = options.network || 'mainnet';
    const networkConfig = getNetwork(networkName);

    this.network = networkName;
    this.contracts = getContracts(networkName);
    this.explorer = networkConfig.explorer;

    const chain = CHAINS[networkName];
    if (!chain) {
      throw new Error(`Chain not configured for network: ${networkName}`);
    }

    this.client = createPublicClient({
      chain,
      transport: http(options.rpcUrl || networkConfig.rpc)
    });
  }

  /**
   * Check if an agent exists (by trying to get owner)
   */
  async agentExists(agentId) {
    try {
      await this.client.readContract({
        address: this.contracts.identityRegistry,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'ownerOf',
        args: [BigInt(agentId)]
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get agent details by ID
   */
  async getAgent(agentId) {
    const id = BigInt(agentId);

    // Get owner - if this fails, agent doesn't exist
    let owner;
    try {
      owner = await this.client.readContract({
        address: this.contracts.identityRegistry,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'ownerOf',
        args: [id]
      });
    } catch (e) {
      return null;
    }

    // Get tokenURI
    let tokenURI = null;
    try {
      const uri = await this.client.readContract({
        address: this.contracts.identityRegistry,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'tokenURI',
        args: [id]
      });
      if (uri && uri !== '') {
        tokenURI = uri;
      }
    } catch (e) {
      // tokenURI may not be set
    }

    // Fetch registration metadata if URI exists
    let metadata = null;
    if (tokenURI && (tokenURI.startsWith('http') || tokenURI.startsWith('ipfs://'))) {
      try {
        const url = tokenURI.startsWith('ipfs://')
          ? `https://ipfs.io/ipfs/${tokenURI.slice(7)}`
          : tokenURI;
        const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (response.ok) {
          metadata = await response.json();
        }
      } catch (e) {
        // Metadata fetch failed, continue without it
      }
    }

    return {
      agentId: Number(agentId),
      tokenURI,
      owner,
      metadata,
      explorerUrl: `${this.explorer}/nft/${this.contracts.identityRegistry}/${agentId}`
    };
  }

  /**
   * Get number of agents owned by an address
   */
  async getAgentCount(ownerAddress) {
    const count = await this.client.readContract({
      address: this.contracts.identityRegistry,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: 'balanceOf',
      args: [ownerAddress]
    });
    return Number(count);
  }

  /**
   * Get reputation summary for an agent
   * Note: clientAddresses must be provided - the contract requires specific reviewers
   */
  async getReputation(agentId, options = {}) {
    const id = BigInt(agentId);
    const clientAddresses = options.clientAddresses || [];
    const tag1 = options.tag1 || '';
    const tag2 = options.tag2 || '';

    // Contract requires clientAddresses
    if (clientAddresses.length === 0) {
      return {
        agentId: Number(agentId),
        feedbackCount: 0,
        averageScore: null,
        decimals: 0,
        rawValue: 0,
        note: 'Provide clientAddresses to query reputation from specific reviewers',
        filters: { clientAddresses, tag1, tag2 }
      };
    }

    try {
      const [count, summaryValue, summaryValueDecimals] = await this.client.readContract({
        address: this.contracts.reputationRegistry,
        abi: REPUTATION_REGISTRY_ABI,
        functionName: 'getSummary',
        args: [id, clientAddresses, tag1, tag2]
      });

      const value = Number(summaryValue) / Math.pow(10, Number(summaryValueDecimals));

      return {
        agentId: Number(agentId),
        feedbackCount: Number(count),
        averageScore: value,
        decimals: Number(summaryValueDecimals),
        rawValue: Number(summaryValue),
        filters: { clientAddresses, tag1, tag2 }
      };
    } catch (e) {
      return {
        agentId: Number(agentId),
        feedbackCount: 0,
        averageScore: null,
        decimals: 0,
        rawValue: 0,
        error: e.message,
        filters: { clientAddresses, tag1, tag2 }
      };
    }
  }

  /**
   * Get network info
   */
  getNetworkInfo() {
    return {
      network: this.network,
      contracts: this.contracts,
      explorer: this.explorer
    };
  }

  // ==================== WRITE METHODS ====================

  /**
   * Create a wallet client for signing transactions
   * @private
   */
  _createWalletClient(privateKey) {
    const account = privateKeyToAccount(privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`);
    const chain = CHAINS[this.network];

    return {
      walletClient: createWalletClient({
        account,
        chain,
        transport: http(this.client.transport.url)
      }),
      account
    };
  }

  /**
   * Register a new agent
   * @param {string} privateKey - Private key for signing (with or without 0x prefix)
   * @param {string|object} agentURIOrMetadata - Either a URI string or metadata object (will be converted to data URI)
   * @returns {Promise<{agentId: number, txHash: string, explorerUrl: string}>}
   */
  async register(privateKey, agentURIOrMetadata) {
    const { walletClient, account } = this._createWalletClient(privateKey);

    // Convert metadata object to data URI if needed
    let agentURI;
    if (typeof agentURIOrMetadata === 'object') {
      agentURI = createDataURI(agentURIOrMetadata);
    } else {
      agentURI = agentURIOrMetadata || '';
    }

    // Determine which register function to call
    const hasURI = agentURI && agentURI.length > 0;

    const txHash = await walletClient.writeContract({
      address: this.contracts.identityRegistry,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: 'register',
      args: hasURI ? [agentURI] : []
    });

    // Wait for transaction receipt to get the agent ID
    const receipt = await this.client.waitForTransactionReceipt({ hash: txHash });

    // Parse the Transfer event to get the minted token ID
    // Transfer(address from, address to, uint256 tokenId) - from is zero address for mint
    let agentId = null;
    for (const log of receipt.logs) {
      // Transfer event topic
      if (log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') {
        // tokenId is the 4th topic (index 3) for ERC-721 Transfer
        if (log.topics[3]) {
          agentId = Number(BigInt(log.topics[3]));
        }
      }
    }

    return {
      agentId,
      txHash,
      owner: account.address,
      explorerUrl: `${this.explorer}/tx/${txHash}`
    };
  }

  /**
   * Register a new agent with structured metadata (convenience method)
   * @param {string} privateKey - Private key for signing
   * @param {object} options - Registration options
   * @param {string} options.name - Agent name (required)
   * @param {string} options.description - Agent description
   * @param {string} options.image - Agent image URL
   * @param {Array} options.services - Service endpoints
   * @param {Array} options.supportedTrust - Trust mechanisms (default: ['reputation'])
   */
  async registerAgent(privateKey, options) {
    const metadata = createRegistrationMetadata(options);
    return this.register(privateKey, metadata);
  }

  /**
   * Update an agent's URI
   * @param {string} privateKey - Private key of the agent owner
   * @param {number|string} agentId - Agent ID to update
   * @param {string|object} newURIOrMetadata - New URI string or metadata object
   */
  async setAgentURI(privateKey, agentId, newURIOrMetadata) {
    const { walletClient } = this._createWalletClient(privateKey);

    let newURI;
    if (typeof newURIOrMetadata === 'object') {
      newURI = createDataURI(newURIOrMetadata);
    } else {
      newURI = newURIOrMetadata;
    }

    const txHash = await walletClient.writeContract({
      address: this.contracts.identityRegistry,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: 'setAgentURI',
      args: [BigInt(agentId), newURI]
    });

    await this.client.waitForTransactionReceipt({ hash: txHash });

    return {
      agentId: Number(agentId),
      newURI,
      txHash,
      explorerUrl: `${this.explorer}/tx/${txHash}`
    };
  }

  /**
   * Give feedback/reputation to an agent
   * @param {string} privateKey - Private key for signing
   * @param {number|string} agentId - Agent ID to rate
   * @param {object} feedback - Feedback details
   * @param {number} feedback.value - Score value (will be multiplied by 10^decimals)
   * @param {number} feedback.decimals - Decimal places for value (default: 2)
   * @param {string} feedback.tag1 - Primary tag/category (default: '')
   * @param {string} feedback.tag2 - Secondary tag (default: '')
   * @param {string} feedback.endpoint - Service endpoint being rated (default: '')
   * @param {string} feedback.feedbackURI - URI with detailed feedback (default: '')
   * @param {string} feedback.feedbackHash - Hash of feedback data (default: 0x0...0)
   */
  async giveFeedback(privateKey, agentId, feedback = {}) {
    const { walletClient } = this._createWalletClient(privateKey);

    const decimals = feedback.decimals ?? 2;
    const value = BigInt(Math.round(feedback.value * Math.pow(10, decimals)));
    const tag1 = feedback.tag1 || '';
    const tag2 = feedback.tag2 || '';
    const endpoint = feedback.endpoint || '';
    const feedbackURI = feedback.feedbackURI || '';
    const feedbackHash = feedback.feedbackHash || '0x0000000000000000000000000000000000000000000000000000000000000000';

    const txHash = await walletClient.writeContract({
      address: this.contracts.reputationRegistry,
      abi: REPUTATION_REGISTRY_ABI,
      functionName: 'giveFeedback',
      args: [BigInt(agentId), value, decimals, tag1, tag2, endpoint, feedbackURI, feedbackHash]
    });

    await this.client.waitForTransactionReceipt({ hash: txHash });

    return {
      agentId: Number(agentId),
      value: feedback.value,
      decimals,
      tag1,
      tag2,
      txHash,
      explorerUrl: `${this.explorer}/tx/${txHash}`
    };
  }
}

/**
 * Create a client for the specified network
 */
function createClient(options = {}) {
  return new ERC8004Client(options);
}

module.exports = {
  ERC8004Client,
  createClient,
  // Re-export helpers for convenience
  createDataURI,
  parseDataURI,
  createRegistrationMetadata
};
