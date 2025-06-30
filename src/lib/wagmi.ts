import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { avalancheFuji } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Kasoli-ku-Mukutu',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'b9ac13d5708cce4b97180633aafa348b',
  chains: [avalancheFuji],
  ssr: false,
});