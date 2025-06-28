'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Button } from './button';
import { Card } from './card';
import { Input } from './input';
import { PlatformDashboardLink } from './platform-dashboard-link';

interface UserData {
  id: string;
  walletAddress: string;
  name?: string;
  organisation?: string;
  contactName?: string;
  vehicleReg?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProfileCardProps {
  userType: 'FARMER' | 'BUYER' | 'TRANSPORTER';
  onLogout: () => void;
}

export function ProfileCard({ userType, onLogout }: ProfileCardProps) {
  const { address } = useAccount();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    organisation: '',
    contactName: '',
    vehicleReg: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    if (address) {
      fetchUserData();
    }
  }, [address]);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`/api/user/profile?address=${address}&role=${userType}`);
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        setFormData({
          name: data.name || '',
          organisation: data.organisation || '',
          contactName: data.contactName || '',
          vehicleReg: data.vehicleReg || '',
          phone: data.phone || '',
          email: data.email || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          role: userType,
          ...formData,
        }),
      });

      if (response.ok) {
        await fetchUserData();
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const getRoleIcon = () => {
    switch (userType) {
      case 'FARMER':
        return '🌾';
      case 'BUYER':
        return '🏢';
      case 'TRANSPORTER':
        return '🚛';
      default:
        return '👤';
    }
  };

  const getRoleColor = () => {
    switch (userType) {
      case 'FARMER':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'BUYER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'TRANSPORTER':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-navy"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-ocean-navy to-lime-lush rounded-full flex items-center justify-center text-2xl">
            {getRoleIcon()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-ocean-navy">
              {userData?.name || userData?.organisation || userData?.contactName || 'Profile'}
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor()}`}>
                {userType.charAt(0) + userType.slice(1).toLowerCase()}
              </span>
              <span className="text-sm text-dusk-gray">
                Member since {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Profile Details */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-ocean-navy">Profile Details</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        </div>

        <div className="space-y-4">
          {/* Wallet Address */}
          <div>
            <label className="block text-sm font-medium text-dusk-gray mb-1">
              Wallet Address
            </label>
            <div className="bg-gray-50 p-3 rounded-lg">
              <code className="text-sm break-all text-ocean-navy">
                {address}
              </code>
            </div>
          </div>

          {/* Name/Organisation */}
          {userType === 'BUYER' ? (
            <div>
              <label className="block text-sm font-medium text-dusk-gray mb-1">
                Organisation Name
              </label>
              {isEditing ? (
                <Input
                  value={formData.organisation}
                  onChange={(e) => setFormData({ ...formData, organisation: e.target.value })}
                  placeholder="Enter organisation name"
                />
              ) : (
                <p className="text-ocean-navy">{userData?.organisation || 'Not provided'}</p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-dusk-gray mb-1">
                {userType === 'FARMER' ? 'Name' : 'Contact Name'}
              </label>
              {isEditing ? (
                <Input
                  value={formData.name || formData.contactName}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    name: e.target.value,
                    contactName: e.target.value 
                  })}
                  placeholder={`Enter ${userType === 'FARMER' ? 'name' : 'contact name'}`}
                />
              ) : (
                <p className="text-ocean-navy">
                  {userData?.name || userData?.contactName || 'Not provided'}
                </p>
              )}
            </div>
          )}

          {/* Vehicle Registration (Transporter only) */}
          {userType === 'TRANSPORTER' && (
            <div>
              <label className="block text-sm font-medium text-dusk-gray mb-1">
                Vehicle Registration
              </label>
              {isEditing ? (
                <Input
                  value={formData.vehicleReg}
                  onChange={(e) => setFormData({ ...formData, vehicleReg: e.target.value })}
                  placeholder="Enter vehicle registration"
                />
              ) : (
                <p className="text-ocean-navy">{userData?.vehicleReg || 'Not provided'}</p>
              )}
            </div>
          )}

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-dusk-gray mb-1">
              Phone Number
            </label>
            {isEditing ? (
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
                type="tel"
              />
            ) : (
              <p className="text-ocean-navy">{userData?.phone || 'Not provided'}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-dusk-gray mb-1">
              Email Address
            </label>
            {isEditing ? (
              <Input
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
                type="email"
              />
            ) : (
              <p className="text-ocean-navy">{userData?.email || 'Not provided'}</p>
            )}
          </div>

          {/* Save Button */}
          {isEditing && (
            <div className="pt-4">
              <Button onClick={handleSave} className="w-full">
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Platform Dashboard Link */}
      <PlatformDashboardLink />

      {/* Logout Button */}
      <Button variant="outline" onClick={onLogout} className="w-full">
        Logout
      </Button>
    </div>
  );
} 