import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, CheckCircle, Truck, User, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useAccount, useWriteContract } from 'wagmi';
import { formatCurrency } from '@/lib/constants';
import toast from 'react-hot-toast';
import { keccak256, toBytes } from 'viem';
import { CONTRACTS, ESCROW_ABI, ERC20_ABI } from '@/lib/contracts';

interface FundEscrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: any;
}

export function FundEscrowModal({ isOpen, onClose, deal }: FundEscrowModalProps) {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [step, setStep] = useState<'confirm' | 'processing'>('confirm');

  const handleFundEscrow = async () => {
    if (!deal || !address) return;

    setStep('processing');

    try {
      // Validate all required addresses are present
      const farmerAddress = deal.farmer?.walletAddress || deal.batch?.farmer?.walletAddress;
      const transporterAddress = deal.transporter?.walletAddress;
      const platformAddress = CONTRACTS.PLATFORM;

      if (!farmerAddress) {
        throw new Error('Farmer address is missing');
      }
      if (!transporterAddress) {
        throw new Error('Transporter address is missing');
      }
      if (!platformAddress) {
        throw new Error('Platform address is missing');
      }

      // Validate addresses are not zero addresses
      if (farmerAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('Invalid farmer address');
      }
      if (transporterAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('Invalid transporter address');
      }
      if (platformAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('Invalid platform address');
      }

      // Convert USD amounts to USDC (6 decimals)
      const farmerAmountUSDC = BigInt(Math.floor(parseFloat(deal.farmerAmount) * 1000000));
      const freightAmountUSDC = BigInt(Math.floor(parseFloat(deal.freightAmount || '0') * 1000000));
      const platformFeeUSDC = BigInt(Math.floor(parseFloat(deal.platformFee || '0') * 1000000));
      const totalAmountUSDC = farmerAmountUSDC + freightAmountUSDC + platformFeeUSDC;

      // Generate batch ID for the escrow
      const batchIdBytes32 = keccak256(toBytes(deal.batch?.id));

      console.log('Funding escrow with:', {
        batchId: deal.batch?.id,
        batchIdBytes32,
        farmerAmountUSDC: farmerAmountUSDC.toString(),
        freightAmountUSDC: freightAmountUSDC.toString(),
        platformFeeUSDC: platformFeeUSDC.toString(),
        totalAmountUSDC: totalAmountUSDC.toString(),
        farmerAddress,
        transporterAddress,
        platformAddress,
      });

      // Step 1: Approve USDC spending for escrow contract
      toast.loading('Approving USDC spending...', { id: 'approval' });
      
      const approvalTxHash = await writeContractAsync({
        address: CONTRACTS.USDC as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.ESCROW as `0x${string}`, totalAmountUSDC],
      });

      console.log('USDC approval transaction:', approvalTxHash);
      toast.dismiss('approval');
      toast.loading('Waiting for approval confirmation...', { id: 'approval-confirm' });

      // Wait a bit for approval to be confirmed
      await new Promise(resolve => setTimeout(resolve, 5000));
      toast.dismiss('approval-confirm');

      // Step 2: Lock funds in escrow contract
      toast.loading('Locking funds in escrow...', { id: 'lock' });

      const lockTxHash = await writeContractAsync({
        address: CONTRACTS.ESCROW as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: 'lock',
        args: [
          batchIdBytes32,
          farmerAddress as `0x${string}`,
          transporterAddress as `0x${string}`,
          platformAddress as `0x${string}`,
          farmerAmountUSDC,
          freightAmountUSDC,
          platformFeeUSDC,
          totalAmountUSDC,
        ],
      });

      console.log('Escrow lock transaction:', lockTxHash);
      toast.dismiss('lock');
      toast.loading('Waiting for escrow confirmation...', { id: 'lock-confirm' });

      // Wait a bit for lock to be confirmed
      await new Promise(resolve => setTimeout(resolve, 5000));
      toast.dismiss('lock-confirm');

      // Step 3: Update deal with escrow transaction hash
      const escrowResponse = await fetch(`/api/deal/${deal.id}/escrow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escrowTxHash: lockTxHash,
        }),
      });

      if (!escrowResponse.ok) {
        throw new Error('Failed to update deal with escrow hash');
      }

      toast.success('Escrow funded successfully! Deal is now ready for signatures.');
      onClose();
    } catch (error: any) {
      console.error('Error funding escrow:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to fund escrow';
      if (error.message?.includes('User rejected')) {
        errorMessage = 'Transaction was cancelled';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient USDC balance';
      } else if (error.message?.includes('execution reverted')) {
        errorMessage = 'Contract execution failed - check your balance and allowances';
      } else if (error.message?.includes('Failed to update deal')) {
        errorMessage = 'Failed to update deal with transaction hash';
      } else if (error.message?.includes('address is missing')) {
        errorMessage = error.message;
      } else if (error.message?.includes('Invalid')) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      setStep('confirm');
    }
  };

  if (!deal) return null;

  // Debug logging to help identify address issues
  console.log('FundEscrowModal deal data:', {
    dealId: deal.id,
    farmer: deal.farmer,
    batchFarmer: deal.batch?.farmer,
    transporter: deal.transporter,
    platform: CONTRACTS.PLATFORM,
    farmerAddress: deal.farmer?.walletAddress || deal.batch?.farmer?.walletAddress,
    transporterAddress: deal.transporter?.walletAddress,
  });

  const totalAmount = parseFloat(deal.farmerAmount || '0') + 
                     parseFloat(deal.freightAmount || '0') + 
                     parseFloat(deal.platformFee || '0');

  // Check if we have all required data
  const hasRequiredData = deal.farmer?.walletAddress || deal.batch?.farmer?.walletAddress;
  const hasTransporter = deal.transporter?.walletAddress;
  const hasPlatform = CONTRACTS.PLATFORM;

  if (!hasRequiredData || !hasTransporter || !hasPlatform) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Fund Escrow">
        <div className="space-y-6">
          <div className="bg-red-50 rounded-xl p-4">
            <h3 className="font-semibold text-red-800 mb-2">Missing Required Data</h3>
            <div className="space-y-1 text-sm text-red-700">
              {!hasRequiredData && <div>• Farmer address is missing</div>}
              {!hasTransporter && <div>• Transporter address is missing</div>}
              {!hasPlatform && <div>• Platform address is missing</div>}
            </div>
            <p className="text-sm text-red-600 mt-2">
              Please ensure all parties are properly assigned before funding escrow.
            </p>
          </div>
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Fund Escrow">
      {step === 'confirm' && (
        <div className="space-y-6">
          <div className="bg-lime-lush/10 rounded-xl p-4">
            <h3 className="font-semibold text-ocean-navy mb-2">Deal Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-dusk-gray">Batch:</span>
                <span className="text-ocean-navy">#{deal.batch?.receiptTokenId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dusk-gray">Weight:</span>
                <span className="text-ocean-navy">{deal.batch?.weightKg} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dusk-gray">Transporter:</span>
                <span className="text-ocean-navy">{deal.transporter?.name || deal.transporter?.walletAddress}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4">
            <h3 className="font-semibold text-ocean-navy mb-2">Escrow Addresses</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-dusk-gray flex items-center gap-1">
                  <User size={14} />
                  Farmer:
                </span>
                <span className="text-ocean-navy font-mono text-xs">
                  {deal.farmer?.walletAddress || deal.batch?.farmer?.walletAddress || 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-dusk-gray flex items-center gap-1">
                  <Truck size={14} />
                  Transporter:
                </span>
                <span className="text-ocean-navy font-mono text-xs">
                  {deal.transporter?.walletAddress || 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-dusk-gray flex items-center gap-1">
                  <Building size={14} />
                  Platform:
                </span>
                <span className="text-ocean-navy font-mono text-xs">
                  {CONTRACTS.PLATFORM || 'Not set'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4">
            <h3 className="font-semibold text-ocean-navy mb-2">Payment Breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-dusk-gray flex items-center gap-1">
                  <User size={14} />
                  Farmer Payment:
                </span>
                <span className="text-ocean-navy">{formatCurrency(parseFloat(deal.farmerAmount || '0'))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dusk-gray flex items-center gap-1">
                  <Truck size={14} />
                  Freight Cost:
                </span>
                <span className="text-ocean-navy">{formatCurrency(parseFloat(deal.freightAmount || '0'))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dusk-gray flex items-center gap-1">
                  <Building size={14} />
                  Platform Fee:
                </span>
                <span className="text-ocean-navy">{formatCurrency(parseFloat(deal.platformFee || '0'))}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-ocean-navy">Total:</span>
                  <span className="text-ocean-navy">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-xl p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Important Notice</h3>
            <p className="text-sm text-yellow-700">
              By funding the escrow, you are locking the total amount of {formatCurrency(totalAmount)} in the smart contract. 
              Funds will be automatically distributed once all parties (Farmer, Transporter, and Buyer) have signed.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleFundEscrow}
              className="flex-1 bg-lime-lush hover:bg-lime-lush/90"
            >
              Fund Escrow
            </Button>
          </div>
        </div>
      )}

      {step === 'processing' && (
        <div className="space-y-6 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <DollarSign className="w-12 h-12 mx-auto text-lime-lush" />
          </motion.div>
          <div>
            <h3 className="text-lg font-semibold text-ocean-navy mb-2">
              Funding Escrow
            </h3>
            <p className="text-dusk-gray">
              Please confirm the transaction in your wallet to lock the funds in escrow.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
} 