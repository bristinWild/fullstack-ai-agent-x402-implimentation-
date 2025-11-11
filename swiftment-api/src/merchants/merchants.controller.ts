import { Controller, Get, Post, Body, Param, HttpStatus, HttpException } from '@nestjs/common';
import { PublicKey } from '@solana/web3.js';
import { SolanaProgramService } from '../solana/solana-program.service';

export class RegisterMerchantDto {
  name: string;
  walletAddress: string;
  website?: string;
}

export class WithdrawDto {
  amount: string;
  destination: string;
}

@Controller('api/merchants')
export class MerchantsController {
  constructor(private readonly solanaProgram: SolanaProgramService) {}

  /**
   * Register a new merchant
   * @param registerDto Merchant registration data
   * @returns Transaction to sign and send
   */
  @Post('register')
  async register(@Body() registerDto: RegisterMerchantDto) {
    try {
      const merchantAuthority = new PublicKey(registerDto.walletAddress);
      
      // Check if merchant already exists
      const existingMerchant = await this.solanaProgram.getMerchant(merchantAuthority);
      if (existingMerchant) {
        throw new Error('Merchant already registered');
      }

      // Create registration transaction
      const transaction = await this.solanaProgram.registerMerchant(merchantAuthority);
      
      return {
        success: true,
        message: 'Merchant registration transaction created',
        data: {
          merchant: merchantAuthority.toBase58(),
          transaction: transaction.serialize({ requireAllSignatures: false }).toString('base64'),
          // Include instructions for the client
          instructions: [
            '1. Sign this transaction with the merchant wallet',
            '2. Send the signed transaction to the Solana network',
            '3. Wait for confirmation'
          ]
        }
      };
    } catch (error) {
      throw new HttpException(
        `Failed to register merchant: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Get merchant treasury information
   * @param merchantAddress Merchant's wallet address
   * @returns Treasury information including balance
   */
  @Get(':merchant/treasury')
  async getTreasury(@Param('merchant') merchantAddress: string) {
    try {
      const merchantAuthority = new PublicKey(merchantAddress);
      return await this.solanaProgram.getTreasuryBalance(merchantAuthority);
    } catch (error) {
      throw new HttpException(
        `Failed to get treasury: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Withdraw funds from merchant treasury
   * @param merchantAddress Merchant's wallet address
   * @param withdrawDto Withdrawal details
   * @returns Withdrawal transaction to sign
   */
  @Post(':merchant/withdraw')
  async withdraw(
    @Param('merchant') merchantAddress: string,
    @Body() withdrawDto: WithdrawDto
  ) {
    try {
      const merchantAuthority = new PublicKey(merchantAddress);
      const destination = new PublicKey(withdrawDto.destination);
      const amount = Number(withdrawDto.amount);

      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid amount');
      }

      // In a real implementation, you would create a withdrawal transaction here
      // This is a placeholder for the actual implementation
      
      return {
        success: true,
        message: 'Withdrawal transaction created',
        data: {
          merchant: merchantAuthority.toBase58(),
          destination: destination.toBase58(),
          amount: amount.toString(),
          fee: '0.5%', // This would be calculated based on the program's fee structure
          transaction: '', // This would be the serialized transaction
          instructions: [
            '1. Sign this transaction with the merchant wallet',
            '2. Send the signed transaction to the Solana network',
            '3. Wait for confirmation'
          ]
        }
      };
    } catch (error) {
      throw new HttpException(
        `Withdrawal failed: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Get merchant information
   * @param merchantAddress Merchant's wallet address
   * @returns Merchant details
   */
  @Get(':merchant')
  async getMerchant(@Param('merchant') merchantAddress: string) {
    try {
      const merchantAuthority = new PublicKey(merchantAddress);
      const merchant = await this.solanaProgram.getMerchant(merchantAuthority);
      
      if (!merchant) {
        throw new Error('Merchant not found');
      }

      return {
        success: true,
        data: {
          merchant: merchantAuthority.toBase58(),
          treasury: merchant.treasury,
          authority: merchant.merchantAuthority,
          createdAt: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get merchant: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
