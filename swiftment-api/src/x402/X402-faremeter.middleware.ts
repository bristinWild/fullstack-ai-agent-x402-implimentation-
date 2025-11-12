

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { express as faremeter } from '@faremeter/middleware';
import { solana } from '@faremeter/info';


@Injectable()
export class FaremeterMiddleware implements NestMiddleware {
    private readonly logger = new Logger(FaremeterMiddleware.name);
    private middleware: any;

    constructor() {
        this.initializeMiddleware();
    }

    private async initializeMiddleware() {
        try {
            // Create Faremeter middleware instance
            this.middleware = await faremeter.createMiddleware({
                facilitatorURL: process.env.X402_FACILITATOR_URL ||
                    'https://facilitator.corbits.dev',

                // Define payment requirements for different endpoints
                accepts: [
                    {
                        // Solana USDC payment
                        ...solana.x402Exact({
                            network: process.env.NODE_ENV === 'production' ? 'mainnet-beta' : 'devnet',
                            asset: 'USDC',
                            amount: 10000, // $0.01 in USDC base units (6 decimals)
                            payTo: process.env.MERCHANT_WALLET_ADDRESS || '',
                        }),
                        resource: '/api/v1/premium/purchase',
                        description: 'Premium purchase endpoint - $0.01 per call',
                    },
                    {
                        // Higher tier payment
                        ...solana.x402Exact({
                            network: process.env.NODE_ENV === 'production' ? 'mainnet-beta' : 'devnet',
                            asset: 'USDC',
                            amount: 50000, // $0.05
                            payTo: process.env.MERCHANT_WALLET_ADDRESS || '',
                        }),
                        resource: '/api/v1/premium/advanced',
                        description: 'Advanced features - $0.05 per call',
                    },
                ],

            });

            this.logger.log('Faremeter middleware initialized successfully');
        } catch (error) {
            this.logger.error(`Failed to initialize Faremeter: ${error.message}`);
            throw error;
        }
    }

    async use(req: Request, res: Response, next: NextFunction) {
        if (!this.middleware) {
            return res.status(503).json({
                error: 'Payment service not available',
                message: 'X402 middleware not initialized',
            });
        }

        // Execute Faremeter middleware
        return this.middleware(req, res, next);
    }
}

/**
 * Alternative: Direct Faremeter Integration for Express Routes
 * Use this if you prefer to apply middleware directly to routes
 */
export class FaremeterFactory {
    private static readonly logger = new Logger(FaremeterFactory.name);

    /**
     * Create Faremeter middleware for a specific endpoint
     */
    static async createFor(config: {
        amount: number; // Amount in USDC (e.g., 0.01)
        resource: string;
        description: string;
        merchantWallet: string;
        network?: 'mainnet' | 'devnet';
    }) {
        try {
            const amountBaseUnits = Math.floor(config.amount * 1_000_000);

            const middleware = await faremeter.createMiddleware({
                facilitatorURL: process.env.X402_FACILITATOR_URL ||
                    'https://facilitator.corbits.dev',
                accepts: [
                    {
                        ...solana.x402Exact({
                            network: 'devnet',
                            asset: 'USDC',
                            amount: amountBaseUnits,
                            payTo: config.merchantWallet,
                        }),
                        resource: config.resource,
                        description: config.description,
                    },
                ],
            });

            this.logger.log(`Faremeter middleware created for ${config.resource}`);
            return middleware;
        } catch (error) {
            this.logger.error(`Failed to create middleware: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create dynamic middleware based on request parameters
     */
    static async createDynamic(
        merchantId: string,
        amountUSDC: number,
    ): Promise<any> {
        // Fetch merchant's wallet address from database
        // For now using environment variable
        const merchantWallet = process.env.MERCHANT_WALLET_ADDRESS || '';

        return this.createFor({
            amount: amountUSDC,
            resource: `/api/v1/merchant/${merchantId}/pay`,
            description: `Payment to merchant ${merchantId}`,
            merchantWallet,
            network: process.env.NODE_ENV === 'production' ? 'mainnet' : 'devnet',
        });
    }
}

/**
 * Example usage in NestJS controller:
 * 
 * @Controller('api/v1/premium')
 * export class PremiumController {
 *   
 *   @Post('purchase')
 *   @UseMiddleware(FaremeterMiddleware) // If using NestModule configuration
 *   async purchase(@Body() dto: any) {
 *     // This only executes if payment is valid
 *     return { success: true, data: 'Premium content' };
 *   }
 * }
 * 
 * OR for Express-style routes:
 * 
 * app.post(
 *   '/api/v1/premium/purchase',
 *   await FaremeterFactory.createFor({
 *     amount: 0.01,
 *     resource: '/api/v1/premium/purchase',
 *     description: 'Premium purchase',
 *     merchantWallet: 'YOUR_WALLET',
 *   }),
 *   (req, res) => {
 *     res.json({ success: true });
 *   }
 * );
 */