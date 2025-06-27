'use client';

import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useRole, Role } from '@/lib/hooks/useRole';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Wheat, Shield, Truck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { role, loading } = useRole();
  const [selectedRole, setSelectedRole] = useState<Role>('FARMER');
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    organisation: '',
    contactName: '',
    vehicleReg: '',
  });
  const router = useRouter();

  useEffect(() => {
    if (isConnected && role && !loading) {
      router.push(`/${role.toLowerCase()}`);
    }
  }, [isConnected, role, loading, router]);

  const handleRegister = async () => {
    if (!address) return;
    await fetch('/api/user/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, role: selectedRole, profile }),
    });
    router.push(`/${selectedRole.toLowerCase()}`);
  };

  const features = [
    {
      icon: Wheat,
      title: 'Digital Receipts',
      description: 'Blockchain-verified grain certificates with IPFS metadata',
    },
    {
      icon: Shield,
      title: 'Secure Escrow',
      description: 'Multi-signature smart contracts protect all parties',
    },
    {
      icon: Truck,
      title: 'Live Tracking',
      description: 'Real-time delivery updates with QR code verification',
    },
    {
      icon: Users,
      title: 'Multi-Party',
      description: 'Farmers, buyers, transporters, and platform coordination',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-warm-white to-lime-lush/10 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-teal-deep border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-white to-lime-lush/10">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            ease: [0.22, 0.61, 0.36, 1], 
            duration: 0.4 
          }}
          className="text-center mb-12"
        >
          <motion.h1 
            className="text-4xl md:text-6xl font-bold text-ocean-navy mb-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            Kasoli‑ku‑Mukutu
          </motion.h1>
          <motion.p 
            className="text-xl text-dusk-gray mb-8 max-w-2xl mx-auto"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            Secure grain trading platform with blockchain escrow, digital receipts, and real-time tracking
          </motion.p>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mb-12"
          >
            <div className="flex justify-center gap-3 mb-6">
              {(['FARMER', 'BUYER', 'TRANSPORTER'] as const).map((r) => (
                <Button
                  key={r}
                  variant={selectedRole === r ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedRole(r)}
                >
                  {r.charAt(0) + r.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
              }) => {
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                  ready &&
                  account &&
                  chain &&
                  (!authenticationStatus ||
                    authenticationStatus === 'authenticated');

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      'style': {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <Button
                            onClick={openConnectModal}
                            size="lg"
                            className="max-w-sm mx-auto"
                          >
                            Connect Wallet
                          </Button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <Button
                            onClick={openChainModal}
                            variant="secondary"
                            size="lg"
                            className="max-w-sm mx-auto"
                          >
                            Wrong network
                          </Button>
                        );
                      }

                      return (
                        <div className="flex gap-3 justify-center">
                          <Button
                            onClick={openChainModal}
                            variant="outline"
                            size="md"
                          >
                            {chain.hasIcon && (
                              <div
                                style={{
                                  background: chain.iconBackground,
                                  width: 12,
                                  height: 12,
                                  borderRadius: 999,
                                  overflow: 'hidden',
                                  marginRight: 4,
                                }}
                              >
                                {chain.iconUrl && (
                                  <img
                                    alt={chain.name ?? 'Chain icon'}
                                    src={chain.iconUrl}
                                    style={{ width: 12, height: 12 }}
                                  />
                                )}
                              </div>
                            )}
                            {chain.name}
                          </Button>

                          <Button
                            onClick={openAccountModal}
                            variant="primary"
                            size="md"
                          >
                            {account.displayName}
                            {account.displayBalance
                              ? ` (${account.displayBalance})`
                              : ''}
                          </Button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
            {isConnected && !role && (
              <div className="mt-6 space-y-3 max-w-sm mx-auto text-left">
                {selectedRole === 'FARMER' && (
                  <>
                    <Input
                      label="Name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                    <Input
                      label="Phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </>
                )}
                {selectedRole === 'BUYER' && (
                  <>
                    <Input
                      label="Organisation"
                      value={profile.organisation}
                      onChange={(e) => setProfile({ ...profile, organisation: e.target.value })}
                    />
                    <Input
                      label="Contact Name"
                      value={profile.contactName}
                      onChange={(e) => setProfile({ ...profile, contactName: e.target.value })}
                    />
                    <Input
                      label="Phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </>
                )}
                {selectedRole === 'TRANSPORTER' && (
                  <>
                    <Input
                      label="Name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                    <Input
                      label="Vehicle Reg"
                      value={profile.vehicleReg}
                      onChange={(e) => setProfile({ ...profile, vehicleReg: e.target.value })}
                    />
                    <Input
                      label="Phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </>
                )}
                <Button onClick={handleRegister} size="lg" className="w-full">
                  Complete Sign Up
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
              className="bg-warm-white rounded-2xl p-6 shadow-sm border border-dusk-gray/10 hover:shadow-lg transition-shadow duration-300"
            >
              <feature.icon className="w-12 h-12 text-teal-deep mb-4" />
              <h3 className="text-lg font-semibold text-ocean-navy mb-2">
                {feature.title}
              </h3>
              <p className="text-dusk-gray text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {!isConnected && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className="text-center"
          >
            <p className="text-dusk-gray mb-4">
              Connect your wallet to get started as a farmer, buyer, transporter, or platform operator
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-dusk-gray">
              <span className="bg-lime-lush/20 px-3 py-1 rounded-full">MetaMask</span>
              <span className="bg-lime-lush/20 px-3 py-1 rounded-full">Coinbase Wallet</span>
              <span className="bg-lime-lush/20 px-3 py-1 rounded-full">WalletConnect</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}