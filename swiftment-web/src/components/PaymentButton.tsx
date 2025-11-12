import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

interface PaymentButtonProps {
  merchantId: string;
  amount: number;
  productId: string;
  onSuccess: (data?: any) => void;
  onError: (error: Error) => void;
  className?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
console.log('Using API URL:', API_URL);

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  merchantId,
  amount,
  productId,
  onSuccess,
  onError,
  className = '',
}) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    if (!publicKey || !connection || !sendTransaction) {
      onError(new Error('Wallet not connected or ready'));
      return;
    }

    setIsLoading(true);

    try {
      // 1. Request payment requirements
      const paymentResponse = await fetch(`${API_URL}/api/v1/x402/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantId,
          amount,
          productId,
          userId: publicKey.toString(),
        }),
      });

      // 2. Handle 402 Payment Required response
      if (paymentResponse.status === 402) {
        const paymentInfo = await paymentResponse.json();
        
        if (!paymentInfo.payment) {
          throw new Error('Invalid payment requirements received from server');
        }

        const { payTo, amount: amountInLamports } = paymentInfo.payment;
        const merchantPublicKey = new PublicKey(payTo);
        
        // Get recent blockhash and create transaction
        const { blockhash } = await connection.getLatestBlockhash();
        const transaction = new Transaction({
          recentBlockhash: blockhash,
          feePayer: publicKey,
        }).add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: merchantPublicKey,
            lamports: amountInLamports,
          })
        );

        // 3. Send the transaction
        const signature = await sendTransaction(transaction, connection);
        await connection.confirmTransaction(signature, 'confirmed');

        // 4. Submit the signed transaction back to the server
        const verificationResponse = await fetch(`${API_URL}/api/v1/x402/purchase`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Payment': `signature=${signature},scheme=exact`,
          },
          body: JSON.stringify({
            merchantId,
            amount,
            productId,
            userId: publicKey.toString(),
            signature,
          }),
        });

        if (!verificationResponse.ok) {
          let errorMessage = 'Payment verification failed';
          try {
            const errorData = await verificationResponse.json();
            console.error('Verification error details:', errorData);
            errorMessage = errorData.message || errorData.error?.message || JSON.stringify(errorData);
          } catch (e) {
            console.error('Failed to parse error response:', e);
          }
          throw new Error(errorMessage);
        }

        const result = await verificationResponse.json();
        onSuccess(result);
        return;
      }

      // Handle other non-200 responses
      if (!paymentResponse.ok) {
        const error = await paymentResponse.json();
        throw new Error(error.message || 'Payment request failed');
      }

      // If we get here, the payment was successful on the first try (shouldn't happen with X402)
      const result = await paymentResponse.json();
      onSuccess(result);
      
    } catch (error) {
      console.error('Payment error:', error);
      onError(error instanceof Error ? error : new Error('Payment failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={isLoading || !publicKey}
      className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        (isLoading || !publicKey) ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {isLoading ? 'Processing...' : `Pay ${amount} USDC`}
    </button>
  );
};