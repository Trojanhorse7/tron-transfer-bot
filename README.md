# Tron Blockchain Multisig Transfer Bot

## Overview
Tron Transfer Bot To Transfer Out Tron from the given wallet and seedphrase.

## Prerequisites
- Node.js
- Mainnet Node: https://api.trongrid.io
- Testnet Node: https://api.shasta.trongrid.io

## Installation
1. Clone the repository
2. Install dependencies:
   ```
      npm install
   ```
3. Set up environment variables in a `.env` file:
   ```
      PRIVATE_KEY=your_Owner/Signatory_private_key
      OWNER_ADDRESS=your_address_with_funds
      API_KEY=your_tron_api_key
   ```

## Usage
1. Start the bot:
   ```
      npm start
   ```