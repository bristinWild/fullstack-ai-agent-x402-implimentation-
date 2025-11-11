import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, Idl, BN, Provider } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';
import * as anchor from '@coral-xyz/anchor';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import the IDL JSON
import * as idl from './swiftment_program.json';

// Define account types
type MerchantAccount = {
  merchantAuthority: PublicKey;
  treasury: PublicKey;
  bump: number;
};

type TreasuryAccount = {
  merchant: PublicKey;
  usdcAta: PublicKey;
  bump: number;
};

type UserAccount = {
  owner: PublicKey;
  defaultDailyLimitUsdc: BN;
  bump: number;
};

type UserPlatformAccount = {
  user: PublicKey;
  merchant: PublicKey;
  dailyLimitUsdc: BN;
  spentTodayUsdc: BN;
  lastResetUnix: BN;
  bump: number;
};

// Define the program interface
interface SwiftmentProgram extends Program {
  account: {
    merchant: {
      fetch: (publicKey: PublicKey) => Promise<MerchantAccount>;
    };
    treasury: {
      fetch: (publicKey: PublicKey) => Promise<TreasuryAccount>;
    };
    user: {
      fetch: (publicKey: PublicKey) => Promise<UserAccount>;
    };
    userPlatform: {
      fetch: (publicKey: PublicKey) => Promise<UserPlatformAccount>;
    };
  };
}

@Injectable()
export class SolanaProgramService implements OnModuleInit {
  private program: SwiftmentProgram;
  private provider: AnchorProvider;
  private programId: PublicKey;
  private usdcMint: PublicKey;
  private connection: Connection;
  private isInitialized = false;

  constructor() {
    // Initialize with default values, will be overridden in onModuleInit
    this.programId = new PublicKey('6SsNGoMWPnU18ax2MqCtfaQuTY8MgehYUt52bsrNc84k');
    this.usdcMint = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
    this.connection = new Connection('https://api.devnet.solana.com');
  }

  private readonly logger = new Logger(SolanaProgramService.name);

  async onModuleInit() {
    try {
      // Load environment variables
      dotenv.config();

      // Initialize connection
      this.connection = new Connection(
        process.env.RPC_URL || 'https://api.devnet.solana.com',
        'confirmed'
      );

      // Initialize program ID
      if (process.env.PROGRAM_ID) {
        this.programId = new PublicKey(process.env.PROGRAM_ID);
      } else {
        throw new Error('PROGRAM_ID environment variable is not set');
      }
      
      // Initialize USDC mint
      if (process.env.USDC_MINT) {
        this.usdcMint = new PublicKey(process.env.USDC_MINT);
      } else {
        this.logger.warn('USDC_MINT environment variable is not set, using default');
        this.usdcMint = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'); // Default devnet USDC
      }

      let keypair: Keypair;
      
      // Try to load wallet from ANCHOR_WALLET if specified
      if (process.env.ANCHOR_WALLET) {
        try {
          const keypairPath = process.env.ANCHOR_WALLET.replace('~', require('os').homedir());
          const keypairJson = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
          keypair = Keypair.fromSecretKey(Uint8Array.from(keypairJson));
          this.logger.log(`Loaded wallet from ${process.env.ANCHOR_WALLET}`);
        } catch (error) {
          this.logger.warn(`Failed to load wallet from ANCHOR_WALLET: ${error.message}`);
          this.logger.warn('Generating a new keypair for this session only');
          keypair = Keypair.generate();
        }
      } else {
        this.logger.warn('ANCHOR_WALLET environment variable is not set, generating a new keypair for this session');
        keypair = Keypair.generate();
      }

      // Create a wallet using the keypair
      const wallet = {
        publicKey: keypair.publicKey,
        signTransaction: async (tx: any) => {
          tx.partialSign(keypair);
          return tx;
        },
        signAllTransactions: async (txs: any[]) => {
          return txs.map(tx => {
            tx.partialSign(keypair);
            return tx;
          });
        },
      };

      this.provider = new AnchorProvider(this.connection, wallet as any, { 
        commitment: 'confirmed',
        preflightCommitment: 'confirmed'
      });
      
      // Set Anchor's default provider
      anchor.setProvider(this.provider);
      
      // Initialize the program with the IDL and provider
      this.program = new Program(
        idl as Idl,
        this.provider
      ) as unknown as SwiftmentProgram;

      this.isInitialized = true;
      this.logger.log('SolanaProgramService initialized successfully');
      this.logger.log(`Using wallet: ${wallet.publicKey.toString()}`);
      this.logger.log(`Program ID: ${this.programId.toString()}`);
      this.logger.log(`USDC Mint: ${this.usdcMint.toString()}`);
    } catch (error) {
      console.error('Failed to initialize SolanaProgramService:', error);
      throw error;
    }
  }

  // Find PDA for merchant
  findMerchantPDA(merchantAuthority: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('merchant'), merchantAuthority.toBuffer()],
      this.programId
    );
  }

  // Find PDA for treasury
  findTreasuryPDA(merchant: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('treasury'), merchant.toBuffer()],
      this.programId
    );
  }

  // Find PDA for user
  findUserPDA(userAuthority: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('user'), userAuthority.toBuffer()],
      this.programId
    );
  }

  // Find PDA for user platform (user + merchant)
  findUserPlatformPDA(user: PublicKey, merchant: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('user_platform'), user.toBuffer(), merchant.toBuffer()],
      this.programId
    );
  }

  // Register a new merchant
  async registerMerchant(merchantAuthority: PublicKey): Promise<Transaction> {
    const [merchantPDA] = this.findMerchantPDA(merchantAuthority);
    const [treasuryPDA] = this.findTreasuryPDA(merchantPDA);
    
    // Get the treasury's USDC ATA
    const treasuryUsdcAta = getAssociatedTokenAddressSync(
      this.usdcMint,
      treasuryPDA,
      true // Allow owner off curve
    );
    
    // Create the instruction
    const ix = await this.program.methods
      .registerMerchant()
      .accounts({
        merchantAuthority,
        merchant: merchantPDA,
        treasury: treasuryPDA,
        treasuryUsdcAta,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .instruction();

    // Create and return the transaction
    const transaction = new Transaction().add(ix);
    transaction.feePayer = merchantAuthority;
    transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
    
    return transaction;
  }

  // Get merchant info
  async getMerchant(merchantAuthority: PublicKey) {
    try {
      const [merchantPDA] = this.findMerchantPDA(merchantAuthority);
      const merchant = await this.program.account.merchant.fetch(merchantPDA);
      
      return {
        merchantAuthority: merchant.merchantAuthority.toBase58(),
        treasury: merchant.treasury.toBase58(),
        bump: merchant.bump,
        pda: merchantPDA.toBase58()
      };
    } catch (error) {
      if (error.message.includes('Account does not exist') || error.message.includes('Account not found')) {
        return null;
      }
      throw error;
    }
  }

  // Get treasury balance
  async getTreasuryBalance(merchantAuthority: PublicKey) {
    const [merchantPDA] = this.findMerchantPDA(merchantAuthority);
    const [treasuryPDA] = this.findTreasuryPDA(merchantPDA);
    const treasuryAta = getAssociatedTokenAddressSync(this.usdcMint, treasuryPDA, true);
    
    try {
      const accountInfo = await this.connection.getTokenAccountBalance(treasuryAta);
      return {
        merchant: merchantPDA.toBase58(),
        treasury: treasuryPDA.toBase58(),
        treasuryAta: treasuryAta.toBase58(),
        balance: accountInfo.value.uiAmountString || '0',
        decimals: accountInfo.value.decimals,
        mint: this.usdcMint.toBase58() // Use the known USDC mint
      };
    } catch (error) {
      // Account doesn't exist yet
      return {
        merchant: merchantPDA.toBase58(),
        treasury: treasuryPDA.toBase58(),
        treasuryAta: treasuryAta.toBase58(),
        balance: '0',
        decimals: 6, // USDC decimals
        mint: this.usdcMint.toBase58()
      };
    }
  }
}
