import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';

/**
 * X402Transaction Entity
 * Store X402 payment records separately from main payments
 */
export interface X402Transaction {
    id: string;
    signature: string; // Blockchain transaction signature
    paymentScheme: string; // 'exact', 'upto', etc.
    network: string; // 'mainnet', 'devnet'
    blockchain: string; // 'solana', 'base', 'ethereum'
    asset: string; // 'USDC'
    amount: number; // in base units (e.g., 1000000 = 1 USDC)
    payTo: string; // Recipient address
    payFrom: string; // Sender address
    resource: string; // API endpoint accessed
    agentId?: string; // Optional agent identifier
    metadata: any; // Additional X402 metadata
    verified: boolean;
    verifiedAt?: Date;
    merchantId: string;
    userId?: string;
    paymentId?: string; // Link to main Payment entity if needed
    createdAt: Date;
    updatedAt: Date;
}

/**
 * X402PaymentInfo
 * Structure for payment requirements returned in 402 response
 */
export interface X402PaymentInfo {
    paymentScheme: string;
    network: string;
    blockchain: string;
    asset: string;
    amount: number;
    payTo: string;
    resource: string;
    description: string;
    facilitatorURL?: string;
}

/**
 * X402 Service
 * Handles X402 protocol payments for agentic commerce
 */
@Injectable()
export class X402Service {
    private readonly logger = new Logger(X402Service.name);
    private readonly connection: Connection;
    private readonly facilitatorURL: string;

    constructor(
        private configService: ConfigService,
        // Uncomment when you create the entity:
        // @InjectRepository(X402Transaction)
        // private x402Repository: Repository<X402Transaction>,
    ) {

        const rpcUrl = this.configService.get<string>('https://api.devnet.solana.com') ||
            'https://api.devnet.solana.com';
        this.connection = new Connection(rpcUrl, 'confirmed');


        this.facilitatorURL = this.configService.get<string>('https://facilitator.corbits.solana-devnet') ||
            'https://facilitator.corbits.dev';

        this.logger.log(`X402Service initialized with facilitator: ${this.facilitatorURL}`);
    }


    generatePaymentRequirements(
        merchantAddress: string,
        amountUSDC: number,
        resource: string,
        description: string,
        network: 'mainnet' | 'devnet' = 'devnet',
    ): X402PaymentInfo {
        // Convert USDC amount to base units (6 decimals)
        const amountBaseUnits = Math.floor(amountUSDC * 1_000_000);

        return {
            paymentScheme: 'exact',
            network: network,
            blockchain: 'solana',
            asset: 'USDC',
            amount: amountBaseUnits,
            payTo: merchantAddress,
            resource: resource,
            description: description,
            facilitatorURL: this.facilitatorURL,
        };
    }


    async verifyPayment(
        signature: string,
        expectedPayment: X402PaymentInfo,
    ): Promise<{ valid: boolean; transaction?: any; error?: string }> {
        try {
            this.logger.log(`Verifying X402 payment: ${signature}`);

            // Fetch transaction from blockchain
            const tx = await this.connection.getTransaction(signature, {
                maxSupportedTransactionVersion: 0,
                commitment: 'confirmed',
            });

            if (!tx) {
                return { valid: false, error: 'Transaction not found' };
            }

            if (tx.meta?.err) {
                return { valid: false, error: 'Transaction failed on-chain' };
            }

            // Verify payment details from token balances
            const verification = this.verifyTokenTransfer(
                tx,
                expectedPayment.payTo,
                expectedPayment.amount,
                expectedPayment.asset,
            );

            if (!verification.valid) {
                return { valid: false, error: verification.error };
            }

            this.logger.log(`Payment verified successfully: ${signature}`);
            return { valid: true, transaction: tx };

        } catch (error) {
            this.logger.error(`Error verifying payment: ${error.message}`);
            return { valid: false, error: error.message };
        }
    }

    /**
     * Verify token transfer in transaction
     * Checks that the correct amount was sent to the correct address
     */
    private verifyTokenTransfer(
        tx: any,
        expectedRecipient: string,
        expectedAmount: number,
        asset: string,
    ): { valid: boolean; error?: string } {
        try {
            const preBalances = tx.meta?.preTokenBalances || [];
            const postBalances = tx.meta?.postTokenBalances || [];

            // Build balance map
            const balanceChanges = new Map<string, number>();

            for (const pre of preBalances) {
                const account = tx.transaction.message.getAccountKeys({
                    accountKeysFromLookups: tx.meta?.loadedAddresses
                }).get(pre.accountIndex)?.toBase58();

                if (account) {
                    balanceChanges.set(account, -(pre.uiTokenAmount?.uiAmount || 0));
                }
            }

            for (const post of postBalances) {
                const account = tx.transaction.message.getAccountKeys({
                    accountKeysFromLookups: tx.meta?.loadedAddresses
                }).get(post.accountIndex)?.toBase58();

                if (account) {
                    const current = balanceChanges.get(account) || 0;
                    balanceChanges.set(account, current + (post.uiTokenAmount?.uiAmount || 0));
                }
            }

            // Check if recipient received the expected amount (allow 1% tolerance for fees)
            const recipientChange = Array.from(balanceChanges.entries())
                .find(([account]) => account === expectedRecipient);

            if (!recipientChange) {
                return { valid: false, error: 'Recipient not found in transaction' };
            }

            const receivedAmount = recipientChange[1];
            const expectedUSDC = expectedAmount / 1_000_000; // Convert from base units
            const tolerance = expectedUSDC * 0.01; // 1% tolerance

            if (Math.abs(receivedAmount - expectedUSDC) > tolerance) {
                return {
                    valid: false,
                    error: `Amount mismatch: expected ${expectedUSDC}, got ${receivedAmount}`
                };
            }

            return { valid: true };

        } catch (error) {
            return { valid: false, error: `Verification error: ${error.message}` };
        }
    }

    /**
     * Record X402 transaction in database
     */
    async recordTransaction(
        signature: string,
        paymentInfo: X402PaymentInfo,
        payFrom: string,
        merchantId: string,
        agentId?: string,
    ): Promise<void> {
        try {
            // Uncomment when entity is created:
            /*
            const transaction = this.x402Repository.create({
              signature,
              paymentScheme: paymentInfo.paymentScheme,
              network: paymentInfo.network,
              blockchain: paymentInfo.blockchain,
              asset: paymentInfo.asset,
              amount: paymentInfo.amount,
              payTo: paymentInfo.payTo,
              payFrom,
              resource: paymentInfo.resource,
              agentId,
              merchantId,
              verified: true,
              verifiedAt: new Date(),
              metadata: { description: paymentInfo.description },
              createdAt: new Date(),
              updatedAt: new Date(),
            });
      
            await this.x402Repository.save(transaction);
            */

            this.logger.log(`X402 transaction recorded: ${signature}`);
        } catch (error) {
            this.logger.error(`Error recording transaction: ${error.message}`);
            throw error;
        }
    }


    async getMerchantPaymentAddress(merchantId: string): Promise<string> {

        return this.configService.get<string>('EhxuCNAjpQSExjYByDJWNtqR8QyqekiDZfXHTbYdy1PF') || '';
    }

    /**
     * Parse X-PAYMENT header from request
     * The client sends payment authorization in this header
     */
    parsePaymentHeader(header: string): {
        signature?: string;
        scheme?: string;
        network?: string;
        error?: string;
    } {
        try {
            // X-PAYMENT header format: "scheme=exact, signature=<base58>, network=mainnet"
            const parts = header.split(',').map(p => p.trim());
            const parsed: any = {};

            for (const part of parts) {
                const [key, value] = part.split('=').map(s => s.trim());
                if (key && value) {
                    parsed[key] = value;
                }
            }

            return {
                signature: parsed.signature,
                scheme: parsed.scheme,
                network: parsed.network,
            };

        } catch (error) {
            return { error: `Invalid payment header: ${error.message}` };
        }
    }


    createPaymentResponseHeader(signature: string, verified: boolean): string {
        return `signature=${signature}, verified=${verified}, timestamp=${Date.now()}`;
    }


    async validateRequest(
        paymentHeader: string | undefined,
        expectedPayment: X402PaymentInfo,
    ): Promise<{ valid: boolean; signature?: string; error?: string }> {
        if (!paymentHeader) {
            return { valid: false, error: 'No payment header provided' };
        }

        const parsed = this.parsePaymentHeader(paymentHeader);

        if (parsed.error || !parsed.signature) {
            return { valid: false, error: parsed.error || 'Invalid payment header' };
        }

        const verification = await this.verifyPayment(parsed.signature, expectedPayment);

        if (!verification.valid) {
            return { valid: false, error: verification.error };
        }

        return { valid: true, signature: parsed.signature };
    }
}