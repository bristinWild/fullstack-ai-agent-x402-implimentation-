import React, { CSSProperties } from 'react';

interface SwiftmentPayButtonProps {
    /**
     * The merchant's Solana public key (base58 encoded string)
     */
    merchantAuthority: string;
    /**
     * Amount to pay in USDC
     */
    amountUsdc: number;
    /**
     * Optional daily limit for the user platform opt-in (in USDC, with 6 decimals)
     * @default 100_000_000 (100 USDC)
     */
    dailyLimit?: number;
    /**
     * Callback function called when payment succeeds
     * @param signature - Transaction signature
     */
    onSuccess?: (signature: string) => void;
    /**
     * Callback function called when payment fails
     * @param error - Error object
     */
    onError?: (error: Error) => void;
    /**
     * Custom text for the button
     * @default "Pay {amountUsdc} USDC"
     */
    buttonText?: string;
    /**
     * Custom CSS styles for the button
     */
    buttonStyle?: CSSProperties;
    /**
     * Whether the button is disabled
     * @default false
     */
    disabled?: boolean;
    /**
     * Custom class name for the button
     */
    className?: string;
    /**
     * Program ID for the Swiftment program
     * @default Uses VITE_PROGRAM_ID from environment or provided value
     */
    programId?: string;
    /**
     * USDC Mint address
     * @default Uses VITE_USDC_MINT from environment or provided value
     */
    usdcMint?: string;
}

declare function SwiftmentPayButton({ merchantAuthority, amountUsdc, onSuccess, onError, buttonText, buttonStyle, disabled, className, }: SwiftmentPayButtonProps): React.JSX.Element;

export { SwiftmentPayButton, type SwiftmentPayButtonProps };
