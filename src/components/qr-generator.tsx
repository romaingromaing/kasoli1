'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { motion } from 'framer-motion';

interface QRGeneratorProps {
  data: string;
  size?: number;
  className?: string;
}

export function QRGenerator({ data, size = 200, className = '' }: QRGeneratorProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(data, {
      width: size,
      margin: 2,
      color: {
        dark: '#1E5287', // ocean-navy
        light: '#FAFAF7', // warm-white
      },
    })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [data, size]);

  if (!qrDataUrl) {
    return (
      <div 
        className={`flex items-center justify-center bg-dusk-gray/10 rounded-xl ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="w-8 h-8 border-2 border-teal-deep border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={className}
    >
      <img 
        src={qrDataUrl} 
        alt="QR Code" 
        className="rounded-xl shadow-lg"
        width={size}
        height={size}
      />
    </motion.div>
  );
}