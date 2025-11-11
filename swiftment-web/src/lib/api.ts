const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface VerifyPaymentRequest {
    signature: string;
    merchant: string;
}

export interface VerifyPaymentResponse {
    ok: boolean;
    reason?: string;
    message?: string;
}

export interface RegisterMerchantRequest {
    name: string;
    walletAddress: string;
    website?: string;
}

export interface RegisterMerchantResponse {
    success: boolean;
    message: string;
    data: {
        merchant: string;
        transaction: string;
        instructions: string[];
    };
}

export interface MerchantInfo {
    success: boolean;
    data: {
        merchant: string;
        treasury: string;
        authority: string;
        createdAt: string;
    };
}

/**
 * Verify a payment transaction on the backend
 */
export async function verifyPayment(
    signature: string,
    merchant: string
): Promise<VerifyPaymentResponse> {
    try {
        const response = await fetch(`${API_URL}/api/protected/verify-x-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                signature,
                merchant,
            }),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to verify payment:', error);
        return {
            ok: false,
            reason: 'network_error',
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Register a new merchant
 */
export async function registerMerchant(
    data: RegisterMerchantRequest
): Promise<RegisterMerchantResponse> {
    try {
        const response = await fetch(`${API_URL}/api/merchants/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        return await response.json();
    } catch (error) {
        console.error('Failed to register merchant:', error);
        throw error;
    }
}

/**
 * Get merchant information
 */
export async function getMerchantInfo(
    merchantAddress: string
): Promise<MerchantInfo> {
    try {
        const response = await fetch(`${API_URL}/api/merchants/${merchantAddress}`);
        return await response.json();
    } catch (error) {
        console.error('Failed to get merchant info:', error);
        throw error;
    }
}

/**
 * Health check
 */
export async function healthCheck(): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/`);
        return response.ok;
    } catch (error) {
        console.error('Backend health check failed:', error);
        return false;
    }
}
