#!/usr/bin/env node

/**
 * erc-800claw CLI - ERC-8004 for OpenClaw agents
 * https://8004.org
 */

const { createClient } = require('./client');
const { NETWORKS, getContracts } = require('./contracts');

const HELP = `
erc-800claw - ERC-8004 SDK for OpenClaw agents

Usage:
  erc-800claw <command> [options]

Commands:
  agent <id>              Get agent details by ID
  exists <id>             Check if an agent exists
  owner <address>         Get agent count for an address
  register                Register a new agent (requires PRIVATE_KEY env var)
  networks                List supported networks
  contracts [network]     Show contract addresses

Options:
  --network <name>        Network to use (mainnet, sepolia). Default: mainnet
  --name <name>           Agent name (for register)
  --description <desc>    Agent description (for register)
  --uri <uri>             Custom URI (for register, optional)
  --json                  Output as JSON
  --help, -h              Show this help

Examples:
  erc-800claw agent 1
  erc-800claw agent 1 --network sepolia
  erc-800claw exists 100
  erc-800claw owner 0x1234...
  erc-800claw contracts mainnet
  erc-800claw agent 1 --json

  # Register an agent (set PRIVATE_KEY env var first)
  PRIVATE_KEY=0x... erc-800claw register --name "My Agent" --network sepolia

Learn more: https://8004.org
`;

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(HELP);
    process.exit(0);
  }

  // Parse options
  const networkIndex = args.indexOf('--network');
  const network = networkIndex !== -1 ? args[networkIndex + 1] : 'mainnet';
  const jsonOutput = args.includes('--json');

  const nameIndex = args.indexOf('--name');
  const agentName = nameIndex !== -1 ? args[nameIndex + 1] : null;

  const descIndex = args.indexOf('--description');
  const description = descIndex !== -1 ? args[descIndex + 1] : '';

  const uriIndex = args.indexOf('--uri');
  const customUri = uriIndex !== -1 ? args[uriIndex + 1] : null;

  // Remove options from args
  const cleanArgs = args.filter((arg, i) => {
    if (arg === '--network') return false;
    if (i > 0 && args[i - 1] === '--network') return false;
    if (arg === '--json') return false;
    if (arg === '--name') return false;
    if (i > 0 && args[i - 1] === '--name') return false;
    if (arg === '--description') return false;
    if (i > 0 && args[i - 1] === '--description') return false;
    if (arg === '--uri') return false;
    if (i > 0 && args[i - 1] === '--uri') return false;
    return true;
  });

  const command = cleanArgs[0];
  const param = cleanArgs[1];

  try {
    switch (command) {
      case 'agent': {
        if (!param) {
          console.error('Error: Agent ID required. Usage: erc-800claw agent <id>');
          process.exit(1);
        }
        const client = createClient({ network });
        const agent = await client.getAgent(param);

        if (!agent) {
          if (jsonOutput) {
            console.log(JSON.stringify({ error: 'Agent not found', agentId: Number(param), network }));
          } else {
            console.error(`Agent ${param} not found on ${network}`);
          }
          process.exit(1);
        }

        if (jsonOutput) {
          console.log(JSON.stringify(agent, null, 2));
        } else {
          console.log(`\nAgent #${agent.agentId} (${network})`);
          console.log('─'.repeat(40));
          console.log(`Owner:    ${agent.owner}`);
          console.log(`URI:      ${agent.tokenURI || '(not set)'}`);
          if (agent.metadata) {
            console.log(`Name:     ${agent.metadata.name || '(unknown)'}`);
            if (agent.metadata.description) {
              const desc = agent.metadata.description.length > 60
                ? agent.metadata.description.slice(0, 60) + '...'
                : agent.metadata.description;
              console.log(`About:    ${desc}`);
            }
          }
          console.log(`Explorer: ${agent.explorerUrl}`);
        }
        break;
      }

      case 'exists': {
        if (!param) {
          console.error('Error: Agent ID required. Usage: erc-800claw exists <id>');
          process.exit(1);
        }
        const client = createClient({ network });
        const exists = await client.agentExists(param);

        if (jsonOutput) {
          console.log(JSON.stringify({ agentId: Number(param), exists, network }));
        } else {
          console.log(`Agent ${param} ${exists ? 'exists' : 'does not exist'} on ${network}`);
        }
        break;
      }

      case 'owner': {
        if (!param) {
          console.error('Error: Address required. Usage: erc-800claw owner <address>');
          process.exit(1);
        }
        const client = createClient({ network });
        const count = await client.getAgentCount(param);

        if (jsonOutput) {
          console.log(JSON.stringify({ address: param, agentCount: count, network }));
        } else {
          console.log(`Address ${param} owns ${count} agent(s) on ${network}`);
        }
        break;
      }

      case 'register': {
        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
          console.error('Error: PRIVATE_KEY environment variable required');
          console.error('Usage: PRIVATE_KEY=0x... erc-800claw register --name "My Agent"');
          process.exit(1);
        }

        if (!agentName && !customUri) {
          console.error('Error: --name or --uri required for registration');
          console.error('Usage: erc-800claw register --name "My Agent" [--description "..."]');
          process.exit(1);
        }

        const client = createClient({ network });

        let result;
        if (customUri) {
          result = await client.register(privateKey, customUri);
        } else {
          result = await client.registerAgent(privateKey, {
            name: agentName,
            description: description
          });
        }

        if (jsonOutput) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(`\nAgent Registered on ${network}!`);
          console.log('─'.repeat(40));
          console.log(`Agent ID: ${result.agentId}`);
          console.log(`Owner:    ${result.owner}`);
          console.log(`Tx:       ${result.txHash}`);
          console.log(`Explorer: ${result.explorerUrl}`);
        }
        break;
      }

      case 'networks': {
        if (jsonOutput) {
          console.log(JSON.stringify(NETWORKS, null, 2));
        } else {
          console.log('\nSupported Networks');
          console.log('─'.repeat(40));
          for (const [name, config] of Object.entries(NETWORKS)) {
            console.log(`\n${name.toUpperCase()} (Chain ID: ${config.chainId})`);
            console.log(`  Identity:   ${config.contracts.identityRegistry}`);
            console.log(`  Reputation: ${config.contracts.reputationRegistry}`);
            console.log(`  Explorer:   ${config.explorer}`);
          }
        }
        break;
      }

      case 'contracts': {
        const targetNetwork = param || network;
        const contracts = getContracts(targetNetwork);

        if (jsonOutput) {
          console.log(JSON.stringify({ network: targetNetwork, ...contracts }, null, 2));
        } else {
          console.log(`\nERC-8004 Contracts on ${targetNetwork}`);
          console.log('─'.repeat(40));
          console.log(`Identity Registry:   ${contracts.identityRegistry}`);
          console.log(`Reputation Registry: ${contracts.reputationRegistry}`);
          console.log(`Validation Registry: ${contracts.validationRegistry || '(not deployed)'}`);
        }
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        console.log(HELP);
        process.exit(1);
    }
  } catch (error) {
    if (jsonOutput) {
      console.log(JSON.stringify({ error: error.message }));
    } else {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}

main();
