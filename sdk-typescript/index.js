/**
 * 800claw - ERC-8004 SDK for OpenClaw agents
 *
 * Register, query, and rate agent identities on Ethereum.
 * https://8004.org
 *
 * @example
 * const { createClient, createRegistrationMetadata } = require('800claw');
 *
 * // Query agents
 * const client = createClient({ network: 'mainnet' });
 * const agent = await client.getAgent(1);
 *
 * // Register a new agent
 * const result = await client.registerAgent(PRIVATE_KEY, {
 *   name: 'My Agent',
 *   description: 'An autonomous agent'
 * });
 */

const { ERC8004Client, createClient, createDataURI, parseDataURI, createRegistrationMetadata } = require('./client');
const {
  NETWORKS,
  IDENTITY_REGISTRY_ABI,
  REPUTATION_REGISTRY_ABI,
  getNetwork,
  getContracts
} = require('./contracts');

module.exports = {
  // Main client
  ERC8004Client,
  createClient,

  // Contract data
  NETWORKS,
  IDENTITY_REGISTRY_ABI,
  REPUTATION_REGISTRY_ABI,
  getNetwork,
  getContracts,

  // Helpers
  createDataURI,
  parseDataURI,
  createRegistrationMetadata
};
