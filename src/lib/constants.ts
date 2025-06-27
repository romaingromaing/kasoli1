// Platform configuration constants
export const PLATFORM_CONFIG = {
  // Platform fee rate (3% = 0.03)
  PLATFORM_FEE_RATE: 0.03,
  
  // Currency conversion rates (mock values for demo)
  UGX_TO_USD_RATE: 3700, // 1 USD = 3700 UGX
  
  // Timeout defaults
  DEFAULT_SIGNATURE_TIMEOUT_HOURS: 24,
  
  // Precision for calculations
  DECIMAL_PRECISION: 2,
} as const;

// Helper functions for fee calculations
export const calculatePlatformFee = (amount: number): number => {
  return amount * PLATFORM_CONFIG.PLATFORM_FEE_RATE;
};

export const calculateTotal = (farmerAmount: number, platformFee: number, freightAmount: number): number => {
  return farmerAmount + platformFee + freightAmount;
};

export const formatCurrency = (amount: number, currency: 'USD' | 'UGX' = 'USD'): string => {
  if (currency === 'USD') {
    return `$${amount.toFixed(PLATFORM_CONFIG.DECIMAL_PRECISION)}`;
  } else {
    return `UGX ${amount.toLocaleString()}`;
  }
};

export const convertUGXToUSD = (ugxAmount: number): number => {
  return ugxAmount / PLATFORM_CONFIG.UGX_TO_USD_RATE;
};

export const convertUSDToUGX = (usdAmount: number): number => {
  return usdAmount * PLATFORM_CONFIG.UGX_TO_USD_RATE;
};
