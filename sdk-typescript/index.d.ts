/**
 * 800claw - ERC-8004 SDK for OpenClaw agents
 * Register, query, and rate agent identities on Ethereum.
 */

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpc: string;
  explorer: string;
  contracts: {
    identityRegistry: string;
    reputationRegistry: string;
    validationRegistry: string;
  };
}

export interface AgentMetadata {
  type?: string;
  name?: string;
  description?: string;
  image?: string;
  services?: Array<{
    name: string;
    endpoint: string;
    version?: string;
  }>;
  registrations?: Array<{
    agentRegistry: string;
    agentId: string;
  }>;
  supportedTrust?: string[];
}

export interface Agent {
  agentId: number;
  tokenURI: string | null;
  owner: string;
  metadata: AgentMetadata | null;
  explorerUrl: string;
}

export interface ReputationSummary {
  agentId: number;
  feedbackCount: number;
  averageScore: number | null;
  decimals: number;
  rawValue: number;
  filters: {
    clientAddresses: string[];
    tag1: string;
    tag2: string;
  };
}

export interface ReputationOptions {
  clientAddresses?: string[];
  tag1?: string;
  tag2?: string;
}

export interface ClientOptions {
  network?: 'mainnet' | 'sepolia';
  rpcUrl?: string;
}

export interface NetworkInfo {
  network: string;
  contracts: {
    identityRegistry: string;
    reputationRegistry: string;
    validationRegistry: string;
  };
  explorer: string;
}

export interface RegistrationOptions {
  name: string;
  description?: string;
  image?: string;
  services?: Array<{
    name: string;
    endpoint: string;
    version?: string;
  }>;
  supportedTrust?: string[];
}

export interface RegistrationResult {
  agentId: number | null;
  txHash: string;
  owner: string;
  explorerUrl: string;
}

export interface UpdateURIResult {
  agentId: number;
  newURI: string;
  txHash: string;
  explorerUrl: string;
}

export interface FeedbackOptions {
  value: number;
  decimals?: number;
  tag1?: string;
  tag2?: string;
  endpoint?: string;
  feedbackURI?: string;
  feedbackHash?: string;
}

export interface FeedbackResult {
  agentId: number;
  value: number;
  decimals: number;
  tag1: string;
  tag2: string;
  txHash: string;
  explorerUrl: string;
}

export class ERC8004Client {
  constructor(options?: ClientOptions);

  // Read methods

  /** Check if an agent exists */
  agentExists(agentId: number | string): Promise<boolean>;

  /** Get agent details by ID */
  getAgent(agentId: number | string): Promise<Agent | null>;

  /** Get reputation summary for an agent */
  getReputation(agentId: number | string, options?: ReputationOptions): Promise<ReputationSummary>;

  /** Get number of agents owned by an address */
  getAgentCount(ownerAddress: string): Promise<number>;

  /** Get network info */
  getNetworkInfo(): NetworkInfo;

  // Write methods

  /** Register a new agent with a URI or metadata object */
  register(privateKey: string, agentURIOrMetadata?: string | AgentMetadata): Promise<RegistrationResult>;

  /** Register a new agent with structured metadata (convenience method) */
  registerAgent(privateKey: string, options: RegistrationOptions): Promise<RegistrationResult>;

  /** Update an agent's URI */
  setAgentURI(privateKey: string, agentId: number | string, newURIOrMetadata: string | AgentMetadata): Promise<UpdateURIResult>;

  /** Give feedback/reputation to an agent */
  giveFeedback(privateKey: string, agentId: number | string, feedback: FeedbackOptions): Promise<FeedbackResult>;
}

/** Create a client for the specified network */
export function createClient(options?: ClientOptions): ERC8004Client;

/** Network configurations */
export const NETWORKS: Record<string, NetworkConfig>;

/** Identity Registry ABI */
export const IDENTITY_REGISTRY_ABI: any[];

/** Reputation Registry ABI */
export const REPUTATION_REGISTRY_ABI: any[];

/** Get network configuration by name */
export function getNetwork(networkName?: string): NetworkConfig;

/** Get contract addresses for a network */
export function getContracts(networkName?: string): {
  identityRegistry: string;
  reputationRegistry: string;
  validationRegistry: string;
};

/** Create a data URI from a metadata object (no IPFS needed) */
export function createDataURI(metadata: object): string;

/** Parse a data URI back to a metadata object */
export function parseDataURI(dataUri: string): object;

/** Create standard ERC-8004 registration metadata */
export function createRegistrationMetadata(options: RegistrationOptions): AgentMetadata;
