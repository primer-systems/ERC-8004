#!/usr/bin/env python3
"""
erc-800claw CLI - ERC-8004 for OpenClaw agents
https://8004.org
"""

import argparse
import json
import os
import sys
from typing import Optional

from .client import create_client
from .contracts import NETWORKS, get_contracts


def main():
    # Parse args manually to allow --json and --network in any position
    args_list = sys.argv[1:]

    # Extract global options
    network = "mainnet"
    json_output = False

    filtered_args = []
    i = 0
    while i < len(args_list):
        arg = args_list[i]
        if arg in ("--network", "-n") and i + 1 < len(args_list):
            network = args_list[i + 1]
            i += 2
        elif arg in ("--json", "-j"):
            json_output = True
            i += 1
        else:
            filtered_args.append(arg)
            i += 1

    parser = argparse.ArgumentParser(
        prog="erc-800claw",
        description="ERC-8004 SDK for OpenClaw agents - https://8004.org"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # agent command
    agent_parser = subparsers.add_parser("agent", help="Get agent details by ID")
    agent_parser.add_argument("id", type=int, help="Agent ID")

    # exists command
    exists_parser = subparsers.add_parser("exists", help="Check if an agent exists")
    exists_parser.add_argument("id", type=int, help="Agent ID")

    # owner command
    owner_parser = subparsers.add_parser("owner", help="Get agent count for an address")
    owner_parser.add_argument("address", help="Ethereum address")

    # register command
    register_parser = subparsers.add_parser("register", help="Register a new agent")
    register_parser.add_argument("--name", required=False,
                                  help="Agent name")
    register_parser.add_argument("--description", default="",
                                  help="Agent description")
    register_parser.add_argument("--uri",
                                  help="Custom URI (optional, overrides name/description)")

    # networks command
    subparsers.add_parser("networks", help="List supported networks")

    # contracts command
    contracts_parser = subparsers.add_parser("contracts", help="Show contract addresses")
    contracts_parser.add_argument("target_network", nargs="?",
                                   help="Network to show (default: current)")

    args = parser.parse_args(filtered_args)
    args.network = network
    args.json = json_output

    if not args.command:
        print("""erc-800claw - ERC-8004 SDK for OpenClaw agents

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
  --network, -n <name>    Network to use (mainnet, sepolia). Default: mainnet
  --json, -j              Output as JSON
  --help, -h              Show this help

Examples:
  erc-800claw agent 1
  erc-800claw agent 1 --network sepolia --json
  erc-800claw exists 100
  erc-800claw owner 0x1234...
  erc-800claw contracts mainnet

  # Register an agent (set PRIVATE_KEY env var first)
  PRIVATE_KEY=0x... erc-800claw register --name "My Agent" --network sepolia

Learn more: https://8004.org""")
        sys.exit(0)

    try:
        run_command(args)
    except Exception as e:
        if json_output:
            print(json.dumps({"error": str(e)}))
        else:
            print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


def run_command(args):
    if args.command == "agent":
        client = create_client(network=args.network)
        agent = client.get_agent(args.id)

        if not agent:
            if args.json:
                print(json.dumps({
                    "error": "Agent not found",
                    "agent_id": args.id,
                    "network": args.network
                }))
            else:
                print(f"Agent {args.id} not found on {args.network}")
            sys.exit(1)

        if args.json:
            print(json.dumps(agent, indent=2))
        else:
            print(f"\nAgent #{agent['agent_id']} ({args.network})")
            print("-" * 40)
            print(f"Owner:    {agent['owner']}")
            print(f"URI:      {agent['token_uri'] or '(not set)'}")
            if agent['metadata']:
                name = agent['metadata'].get('name', '(unknown)')
                print(f"Name:     {name}")
                desc = agent['metadata'].get('description', '')
                if desc:
                    if len(desc) > 60:
                        desc = desc[:60] + "..."
                    print(f"About:    {desc}")
            print(f"Explorer: {agent['explorer_url']}")

    elif args.command == "exists":
        client = create_client(network=args.network)
        exists = client.agent_exists(args.id)

        if args.json:
            print(json.dumps({
                "agent_id": args.id,
                "exists": exists,
                "network": args.network
            }))
        else:
            status = "exists" if exists else "does not exist"
            print(f"Agent {args.id} {status} on {args.network}")

    elif args.command == "owner":
        client = create_client(network=args.network)
        count = client.get_agent_count(args.address)

        if args.json:
            print(json.dumps({
                "address": args.address,
                "agent_count": count,
                "network": args.network
            }))
        else:
            print(f"Address {args.address} owns {count} agent(s) on {args.network}")

    elif args.command == "register":
        private_key = os.environ.get("PRIVATE_KEY")
        if not private_key:
            print("Error: PRIVATE_KEY environment variable required", file=sys.stderr)
            print("Usage: PRIVATE_KEY=0x... erc-800claw register --name 'My Agent'", file=sys.stderr)
            sys.exit(1)

        if not args.name and not args.uri:
            print("Error: --name or --uri required for registration", file=sys.stderr)
            sys.exit(1)

        client = create_client(network=args.network)

        if args.uri:
            result = client.register(private_key, args.uri)
        else:
            result = client.register_agent(
                private_key,
                name=args.name,
                description=args.description
            )

        if args.json:
            print(json.dumps(result, indent=2))
        else:
            print(f"\nAgent Registered on {args.network}!")
            print("-" * 40)
            print(f"Agent ID: {result['agent_id']}")
            print(f"Owner:    {result['owner']}")
            print(f"Tx:       {result['tx_hash']}")
            print(f"Explorer: {result['explorer_url']}")

    elif args.command == "networks":
        if args.json:
            print(json.dumps(NETWORKS, indent=2))
        else:
            print("\nSupported Networks")
            print("-" * 40)
            for name, config in NETWORKS.items():
                print(f"\n{name.upper()} (Chain ID: {config['chain_id']})")
                print(f"  Identity:   {config['contracts']['identity_registry']}")
                print(f"  Reputation: {config['contracts']['reputation_registry']}")
                print(f"  Explorer:   {config['explorer']}")

    elif args.command == "contracts":
        target = args.target_network or args.network
        contracts = get_contracts(target)

        if args.json:
            print(json.dumps({"network": target, **contracts}, indent=2))
        else:
            print(f"\nERC-8004 Contracts on {target}")
            print("-" * 40)
            print(f"Identity Registry:   {contracts['identity_registry']}")
            print(f"Reputation Registry: {contracts['reputation_registry']}")
            vr = contracts.get('validation_registry')
            if vr and vr != "0x0000000000000000000000000000000000000000":
                print(f"Validation Registry: {vr}")
            else:
                print("Validation Registry: (not deployed)")


if __name__ == "__main__":
    main()
