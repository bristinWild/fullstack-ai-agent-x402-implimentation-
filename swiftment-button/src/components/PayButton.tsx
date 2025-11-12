import React, { useState } from 'react';
import * as anchor from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { SwiftmentPayButtonProps } from '../types';

// TODO: Import these from your Swiftment SDK
// You'll need to either:
// 1. Include your SDK code in this package
// 2. Create a separate @swiftment/sdk package
// 3. Copy the necessary SDK functions here
// 
// For now, this is a placeholder that shows the expected interface
const getProgram = (provider: anchor.AnchorProvider) => {
    // Your program initialization logic here
    throw new Error('getProgram not implemented - you need to add your SDK');
};

const sdk = (program: any) => {
    // Your SDK wrapper here
    return {
        ensureUserAndOptIn: async (publicKey: anchor.web3.PublicKey, merchantAuthority: anchor.web3.PublicKey) => {
            throw new Error('SDK not implemented');
        },
        pay: async (publicKey: anchor.web3.PublicKey, merchantAuthority: anchor.web3.PublicKey, amount: number) => {
            throw new Error('SDK not implemented');
            return '';
        }
    };
};

export function SwiftmentPayButton({
    merchantAuthority,
    amountUsdc,
    onSuccess,
    onError,
    buttonText,
    buttonStyle,
    disabled = false,
    className = '',
}: SwiftmentPayButtonProps) {
    const { connection } = useConnection();
    const { publicKey, signTransaction } = useWallet();
    const [loading, setLoading] = useState(false);

    const displayText = buttonText || `Pay ${amountUsdc} USDC`;

    const handleClick = async () => {
        if (!publicKey || !signTransaction) {
            const error = new Error('Wallet not connected');
            onError?.(error);
            return;
        }

        try {
            setLoading(true);

            const provider = new anchor.AnchorProvider(
                connection,
                { publicKey, signTransaction } as any,
                {}
            );
            const program = getProgram(provider);
            const api = sdk(program);

            // Ensure user account exists and merchant is opted in
            await api.ensureUserAndOptIn(
                publicKey,
                new anchor.web3.PublicKey(merchantAuthority)
            );

            // Execute payment
            const signature = await api.pay(
                publicKey,
                new anchor.web3.PublicKey(merchantAuthority),
                amountUsdc
            );

            onSuccess?.(signature);
        } catch (error) {
            console.error('Payment error:', error);
            onError?.(error as Error);
        } finally {
            setLoading(false);
        }
    };

    const defaultStyle: React.CSSProperties = {
        padding: '12px 24px',
        borderRadius: '12px',
        border: 'none',
        backgroundColor: '#512da8',
        color: 'white',
        fontSize: '16px',
        fontWeight: '600',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        transition: 'all 0.2s ease',
        ...buttonStyle,
    };

    const isDisabled = disabled || loading || !publicKey;

    return (
        <button
            onClick={handleClick}
            style={defaultStyle}
            disabled={isDisabled}
            className={className}
            aria-busy={loading}
            aria-disabled={isDisabled}
        >
            {loading ? 'Processing...' : displayText}
        </button>
    );
}