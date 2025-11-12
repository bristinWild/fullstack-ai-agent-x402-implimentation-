import {
    Controller,
    Post,
    Get,
    Body,
    Headers,
    HttpStatus,
    HttpException,
    UseGuards,
    Req,
    Res,
    Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { X402Service, X402PaymentInfo } from './x402.service';
import { PaymentsService } from '../payments/payments.service';

/**
 * X402 Purchase Request DTO
 */
export class X402PurchaseDto {
    merchantId: string;
    amount: number; // USDC amount (e.g., 10 = $10)
    productId?: string;
    metadata?: any;
}

/**
 * X402 Verification Request DTO
 */
export class X402VerifyDto {
    signature: string;
    merchantId: string;
    amount: number;
}

/**
 * X402Controller
 * Handles HTTP 402 payment-gated endpoints for agentic commerce
 * 
 * Example usage:
 * 1. Agent calls GET /api/v1/x402/purchase without payment
 * 2. Server responds 402 with payment requirements
 * 3. Agent signs transaction and submits to blockchain
 * 4. Agent retries GET with X-PAYMENT: signature=<tx_sig> header
 * 5. Server verifies payment and processes purchase
 */
@Controller('api/v1/x402')
export class X402Controller {
    private readonly logger = new Logger(X402Controller.name);

    constructor(
        private readonly x402Service: X402Service,
        private readonly paymentsService: PaymentsService,
    ) { }

    /**
     * X402 Protected Purchase Endpoint
     * This endpoint requires payment via X402 protocol
     * 
     * Flow:
     * - First call: Returns 402 with payment requirements
     * - Second call (with X-PAYMENT header): Verifies payment and processes
     */
    @Post('purchase')
    async purchase(
        @Body() dto: X402PurchaseDto,
        @Headers('x-payment') paymentHeader: string | undefined,
        @Headers('x-agent-id') agentId: string | undefined,
        @Res() res: Response,
    ) {
        try {
            this.logger.log(`X402 purchase request: ${JSON.stringify(dto)}`);

            // Get merchant payment address
            const merchantAddress = await this.x402Service.getMerchantPaymentAddress(
                dto.merchantId,
            );

            if (!merchantAddress) {
                throw new HttpException(
                    'Merchant not found or not configured for X402',
                    HttpStatus.NOT_FOUND,
                );
            }

            // Generate payment requirements
            const paymentInfo = this.x402Service.generatePaymentRequirements(
                merchantAddress,
                dto.amount,
                `/api/v1/x402/purchase`,
                `Purchase from merchant ${dto.merchantId}`,
                'devnet', // Change to 'mainnet' for production
            );

            // Check if payment header is present
            if (!paymentHeader) {
                // No payment provided - return 402 Payment Required
                this.logger.log('No payment header - returning 402');

                return res.status(402).json({
                    error: 'Payment Required',
                    payment: paymentInfo,
                    message: 'Please submit payment and retry with X-PAYMENT header',
                });
            }

            // Validate payment
            const validation = await this.x402Service.validateRequest(
                paymentHeader,
                paymentInfo,
            );

            if (!validation.valid) {
                throw new HttpException(
                    {
                        error: 'Payment verification failed',
                        details: validation.error,
                    },
                    HttpStatus.PAYMENT_REQUIRED,
                );
            }

            this.logger.log(`Payment verified: ${validation.signature}`);


            const payFrom = agentId || 'anonymous-agent';


            await this.x402Service.recordTransaction(
                validation.signature!,
                paymentInfo,
                payFrom,
                dto.merchantId,
                agentId,
            );

            // Process the actual purchase using existing payment service
            // This integrates with your on-chain program
            const purchaseResult = await this.paymentsService.processPurchase({
                merchantId: dto.merchantId,
                amount: dto.amount,
                signature: validation.signature!,
                metadata: {
                    ...dto.metadata,
                    x402: true,
                    agentId,
                },
            });

            // Add payment response header
            const responseHeader = this.x402Service.createPaymentResponseHeader(
                validation.signature!,
                true,
            );

            return res
                .status(200)
                .header('X-Payment-Response', responseHeader)
                .json({
                    success: true,
                    signature: validation.signature,
                    purchase: purchaseResult,
                    message: 'Purchase completed successfully',
                });

        } catch (error) {
            this.logger.error(`X402 purchase error: ${error.message}`);

            if (error instanceof HttpException) {
                throw error;
            }

            throw new HttpException(
                {
                    error: 'Purchase failed',
                    details: error.message,
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Get merchant X402 payment info
     * Allows agents to discover payment requirements before purchase
     */
    @Get('merchant/:merchantId/payment-info')
    async getMerchantPaymentInfo(
        @Req() req: any,
    ): Promise<any> {
        try {
            const merchantId = req.params.merchantId;

            const merchantAddress = await this.x402Service.getMerchantPaymentAddress(
                merchantId,
            );

            if (!merchantAddress) {
                throw new HttpException(
                    'Merchant not found',
                    HttpStatus.NOT_FOUND,
                );
            }

            // Return merchant's X402 configuration
            return {
                merchantId,
                paymentAddress: merchantAddress,
                blockchain: 'solana',
                network: 'devnet', // Change to 'mainnet' for production
                supportedAssets: ['USDC'],
                facilitatorURL: 'https://facilitator.corbits.dev',
                endpoints: {
                    purchase: `/api/v1/x402/purchase`,
                    verify: `/api/v1/x402/verify`,
                },
            };

        } catch (error) {
            this.logger.error(`Error fetching merchant info: ${error.message}`);
            throw error;
        }
    }

    /**
     * Manual payment verification endpoint
     * Allows checking if a payment is valid without processing
     */
    @Post('verify')
    async verifyPayment(
        @Body() dto: X402VerifyDto,
    ): Promise<any> {
        try {
            const merchantAddress = await this.x402Service.getMerchantPaymentAddress(
                dto.merchantId,
            );

            const paymentInfo = this.x402Service.generatePaymentRequirements(
                merchantAddress,
                dto.amount,
                '/api/v1/x402/verify',
                'Payment verification',
                'devnet',
            );

            const result = await this.x402Service.verifyPayment(
                dto.signature,
                paymentInfo,
            );

            return {
                valid: result.valid,
                signature: dto.signature,
                error: result.error,
                timestamp: Date.now(),
            };

        } catch (error) {
            this.logger.error(`Verification error: ${error.message}`);
            throw new HttpException(
                {
                    error: 'Verification failed',
                    details: error.message,
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Health check endpoint for X402 service
     */
    @Get('health')
    async health(): Promise<any> {
        return {
            status: 'ok',
            service: 'x402',
            protocol: 'HTTP 402 Payment Required',
            facilitator: 'https://facilitator.corbits.dev',
            blockchain: 'solana',
            timestamp: Date.now(),
        };
    }

    /**
     * Get X402 payment statistics for a merchant
     */
    @Get('merchant/:merchantId/stats')
    async getMerchantStats(
        @Req() req: any,
    ): Promise<any> {
        try {
            const merchantId = req.params.merchantId;

            // TODO: Query x402_transactions table for analytics
            // For now, return placeholder data

            return {
                merchantId,
                totalTransactions: 0,
                totalVolume: 0,
                uniqueAgents: 0,
                averagePayment: 0,
                lastPayment: null,
            };

        } catch (error) {
            this.logger.error(`Error fetching stats: ${error.message}`);
            throw error;
        }
    }
}