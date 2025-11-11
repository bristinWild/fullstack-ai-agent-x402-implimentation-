import React, { useState } from 'react';
import * as anchor from '@coral-xyz/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

// Types
export interface SwiftmentPayButtonProps {
    merchantAddress: string;
    amount: number;
    label?: string;
    description?: string;
    programId?: string;
    rpcUrl?: string;
    onSuccess?: (signature: string) => void;
    onError?: (error: Error) => void;
    className?: string;
    style?: React.CSSProperties;
    theme?: 'light' | 'dark' | 'gradient';
    size?: 'small' | 'medium' | 'large';
}

// Default styles for different themes
const getButtonStyles = (theme: string = 'gradient', size: string = 'medium') => {
    const sizeStyles = {
        small: { padding: '8px 16px', fontSize: '14px' },
        medium: { padding: '12px 24px', fontSize: '16px' },
        large: { padding: '16px 32px', fontSize: '18px' }
    };

    const themeStyles = {
        light: {
            background: '#fff',
            color: '#000',
            border: '2px solid #000'
        },
        dark: {
            background: '#000',
            color: '#fff',
            border: '2px solid #fff'
        },
        gradient: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            border: 'none'
        }
    };

    return {
        ...sizeStyles[size as keyof typeof sizeStyles],
        ...themeStyles[theme as keyof typeof themeStyles],
        borderRadius: '12px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontFamily: 'system-ui, -apple-system, sans-serif'
    };
};

export const SwiftmentPayButton: React.FC<SwiftmentPayButtonProps> = ({
    merchantAddress,
    amount,
    label = 'Pay with Swiftment',
    description,
    programId = '6SsNGoMWPnU18ax2MqCtfaQuTY8MgehYUt52bsrNc84k',
    rpcUrl = 'https://api.devnet.solana.com',
    onSuccess,
    onError,
    className,
    style,
    theme = 'gradient',
    size = 'medium'
}) => {
    const { connection } = useConnection();
    const { publicKey, signTransaction } = useWallet();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePayment = async () => {
        if (!publicKey || !signTransaction) {
            setError('Please connect your wallet');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Create provider
            const provider = new anchor.AnchorProvider(
                connection,
                { publicKey, signTransaction } as any,
                { commitment: 'confirmed' }
            );

            // TODO: Import your program IDL and create program instance
            // const program = new anchor.Program(IDL, new PublicKey(programId), provider);

            // For now, this is a placeholder - integrate with your actual program
            console.log('Processing payment...', {
                merchant: merchantAddress,
                amount,
                user: publicKey.toBase58()
            });

            // Simulate transaction (replace with actual program call)
            const signature = 'demo_signature_' + Date.now();

            if (onSuccess) {
                onSuccess(signature);
            }

            setLoading(false);
        } catch (err: any) {
            const errorMessage = err?.message || 'Payment failed';
            setError(errorMessage);
            if (onError) {
                onError(err);
            }
            setLoading(false);
        }
    };

    const buttonStyles = {
        ...getButtonStyles(theme, size),
        ...style,
        opacity: loading ? 0.7 : 1,
        cursor: loading ? 'not-allowed' : 'pointer'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
                className={className}
                style={buttonStyles}
                onClick={handlePayment}
                disabled={loading || !publicKey}
            >
                {loading ? 'Processing...' : label}
            </button>

            {description && (
                <p style={{ margin: 0, fontSize: '14px', opacity: 0.7 }}>
                    {description}
                </p>
            )}

            {error && (
                <p style={{ margin: 0, color: '#ef4444', fontSize: '14px' }}>
                    {error}
                </p>
            )}

            {!publicKey && (
                <p style={{ margin: 0, fontSize: '12px', opacity: 0.6 }}>
                    Connect your Solana wallet to continue
                </p>
            )}
        </div>
    );
};

export default SwiftmentPayButton;