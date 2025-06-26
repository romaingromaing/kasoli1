export const CONTRACTS = {
  RECEIPT: process.env.NEXT_PUBLIC_RECEIPT || '0x7e4181d10eA5DD15b3f53824B7E6d88e3b29e371',
  ORACLE: process.env.NEXT_PUBLIC_ORACLE || '0x1Fef2be8F3E9552EE4AF24dB2F31B64cdE4E4846',
  ESCROW: process.env.NEXT_PUBLIC_ESCROW || '0xeCbCE8a130e3Ad844Ba7BedC1b23566226ECFBd7',
  USDC: process.env.NEXT_PUBLIC_USDC || '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia USDC
} as const;

export const RECEIPT_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "weightKg", "type": "uint256"},
      {"internalType": "uint8", "name": "grade", "type": "uint8"},
      {"internalType": "string", "name": "metaCID", "type": "string"},
      {"internalType": "string", "name": "photoCID", "type": "string"}
    ],
    "name": "mint",
    "outputs": [{"internalType": "uint256", "name": "id", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "id", "type": "uint256"},
      {"indexed": false, "internalType": "uint8", "name": "grade", "type": "uint8"},
      {"indexed": false, "internalType": "string", "name": "metaCID", "type": "string"},
      {"indexed": false, "internalType": "string", "name": "photoCID", "type": "string"}
    ],
    "name": "Meta",
    "type": "event"
  }
] as const;

export const ORACLE_ABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "kg", "type": "uint256"},
      {"internalType": "uint256", "name": "km", "type": "uint256"}
    ],
    "name": "quote",
    "outputs": [{"internalType": "uint256", "name": "ugx", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "dieselUgxPerLitre",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const ESCROW_ABI = [
  {
    "inputs": [
      {"internalType": "bytes32", "name": "id", "type": "bytes32"},
      {"internalType": "address", "name": "farmer", "type": "address"},
      {"internalType": "address", "name": "transporter", "type": "address"},
      {"internalType": "address", "name": "platform", "type": "address"},
      {"internalType": "uint256", "name": "farmerAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "freightAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "platformFee", "type": "uint256"},
      {"internalType": "uint256", "name": "total", "type": "uint256"}
    ],
    "name": "lock",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "id", "type": "bytes32"}],
    "name": "farmerSign",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "id", "type": "bytes32"}],
    "name": "transporterSign",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "id", "type": "bytes32"}],
    "name": "buyerSign",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "id", "type": "bytes32"}],
    "name": "forceFinalize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export const ERC20_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;