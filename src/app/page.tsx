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
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    email: '',
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

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setShowRegistrationForm(true);
    setErrors({});
  };

  const handleBackToRoleSelection = () => {
    setShowRegistrationForm(false);
    setSelectedRole(null);
    setErrors({});
    setProfile({
      name: '',
      phone: '',
      email: '',
      organisation: '',
      contactName: '',
      vehicleReg: '',
    });
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Email validation for all user types
    if (!profile.email || !profile.email.trim()) {
      newErrors.email = 'Email address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profile.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Role-specific validation
    if (selectedRole === 'BUYER') {
      if (!profile.organisation || !profile.organisation.trim()) {
        newErrors.organisation = 'Organisation name is required';
      }
      if (!profile.contactName || !profile.contactName.trim()) {
        newErrors.contactName = 'Contact name is required';
      }
    } else if (selectedRole === 'FARMER') {
      if (!profile.name || !profile.name.trim()) {
        newErrors.name = 'Name is required';
      }
    } else if (selectedRole === 'TRANSPORTER') {
      if (!profile.name || !profile.name.trim()) {
        newErrors.name = 'Name is required';
      }
      if (!profile.vehicleReg || !profile.vehicleReg.trim()) {
        newErrors.vehicleReg = 'Vehicle registration is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!address || !selectedRole) return;
    
    // Clear previous errors
    setErrors({});
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/user/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, role: selectedRole, profile }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle API errors
        if (data.error) {
          setErrors({ general: data.error });
        } else {
          setErrors({ general: 'Registration failed. Please try again.' });
        }
        return;
      }

      // Success - redirect to dashboard
      router.push(`/${selectedRole.toLowerCase()}`);
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ general: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsSubmitting(false);
    }
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
                        <div className="space-y-6">
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
                          
                          {!showRegistrationForm && !role && (
                            <div className="space-y-8">
                              <div className="text-center">
                                <h2 className="text-2xl font-semibold text-ocean-navy mb-4">
                                  Choose Your Role
                                </h2>
                                <p className="text-dusk-gray mb-8">
                                  Select the role that best describes your participation in the grain trading platform
                                </p>
                              </div>
                              
                              <div className="flex flex-col md:flex-row justify-center gap-4 max-w-2xl mx-auto px-4 mb-8">
                                {(['FARMER', 'BUYER', 'TRANSPORTER'] as const).map((roleOption) => (
                                  <Button
                                    key={roleOption}
                                    variant="outline"
                                    size="lg"
                                    onClick={() => handleRoleSelect(roleOption)}
                                    className="flex-1 py-6 text-lg font-semibold flex items-center justify-center"
                                  >
                                    {roleOption.charAt(0) + roleOption.slice(1).toLowerCase()}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
            
            {showRegistrationForm && selectedRole && (
              <div className="mt-8 space-y-6 max-w-md mx-auto px-4">
                <div className="bg-gradient-to-r from-ocean-navy to-lime-lush text-white rounded-xl p-6 text-center">
                  <div className="flex items-center justify-center mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBackToRoleSelection}
                      className="mr-4 bg-white/20 text-white border-white/30 hover:bg-white/30"
                    >
                      ← Back to Role Selection
                    </Button>
                  </div>
                  <div className="text-2xl mb-3">
                    {selectedRole === 'FARMER' ? '🌾' : selectedRole === 'BUYER' ? '🏢' : '🚛'}
                  </div>
                  <h3 className="text-lg font-semibold">
                    Register as {selectedRole.charAt(0) + selectedRole.slice(1).toLowerCase()}
                  </h3>
                </div>
                
                <div className="bg-warm-white rounded-xl p-8 shadow-sm border border-dusk-gray/10 space-y-6">
                  {/* General error message */}
                  {errors.general && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-600 text-sm">{errors.general}</p>
                    </div>
                  )}

                  {selectedRole === 'FARMER' && (
                    <>
                      <Input
                        label="Name"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        placeholder="Enter your full name"
                        required
                        error={errors.name}
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        required
                        placeholder="Enter your email address"
                        error={errors.email}
                      />
                      <Input
                        label="Phone"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="Enter your phone number"
                      />
                    </>
                  )}
                  {selectedRole === 'BUYER' && (
                    <>
                      <Input
                        label="Organisation"
                        value={profile.organisation}
                        onChange={(e) => setProfile({ ...profile, organisation: e.target.value })}
                        placeholder="Enter your organisation name"
                        required
                        error={errors.organisation}
                      />
                      <Input
                        label="Contact Name"
                        value={profile.contactName}
                        onChange={(e) => setProfile({ ...profile, contactName: e.target.value })}
                        placeholder="Enter contact person name"
                        required
                        error={errors.contactName}
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        required
                        placeholder="Enter your email address"
                        error={errors.email}
                      />
                      <Input
                        label="Phone"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="Enter your phone number"
                      />
                    </>
                  )}
                  {selectedRole === 'TRANSPORTER' && (
                    <>
                      <Input
                        label="Name"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        placeholder="Enter your full name"
                        required
                        error={errors.name}
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        required
                        placeholder="Enter your email address"
                        error={errors.email}
                      />
                      <Input
                        label="Vehicle Reg"
                        value={profile.vehicleReg}
                        onChange={(e) => setProfile({ ...profile, vehicleReg: e.target.value })}
                        placeholder="Enter vehicle registration number"
                        required
                        error={errors.vehicleReg}
                      />
                      <Input
                        label="Phone"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="Enter your phone number"
                      />
                    </>
                  )}
                  <div className="pt-4">
                    <Button 
                      onClick={handleRegister} 
                      size="lg" 
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Registering...' : 'Complete Registration'}
                    </Button>
                    <p className="text-xs text-dusk-gray text-center mt-3">
                      * Email address is required for account verification and notifications
                    </p>
                  </div>
                </div>
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