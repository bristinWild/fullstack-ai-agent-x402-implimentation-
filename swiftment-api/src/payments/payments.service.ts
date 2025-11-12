import { Injectable, OnModuleInit } from '@nestjs/common';
import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as anchor from '@coral-xyz/anchor';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface ConfigState {
  feeAuthority: PublicKey;
  feeBps: number; // 0-10000
}

@Injectable()
export class PaymentsService implements OnModuleInit {
  private programId: PublicKey;
  private usdcMint: PublicKey;
  private authorityFallback: PublicKey | undefined;
  private connection: Connection;
  private isInitialized = false;

  constructor() {
    // Initialize with default values, will be overridden in onModuleInit
    this.programId = new PublicKey('6SsNGoMWPnU18ax2MqCtfaQuTY8MgehYUt52bsrNc84k');
    this.usdcMint = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
    this.connection = new Connection('https://api.devnet.solana.com');
  }

  async onModuleInit() {
    try {
      // Override with environment variables if they exist
      if (process.env.PROGRAM_ID) {
        this.programId = new PublicKey(process.env.PROGRAM_ID);
      }

      if (process.env.USDC_MINT) {
        this.usdcMint = new PublicKey(process.env.USDC_MINT);
      }

      if (process.env.RPC_URL) {
        this.connection = new Connection(process.env.RPC_URL, 'confirmed');
      }

      if (process.env.AUTHORITY_FEE_WALLET) {
        this.authorityFallback = new PublicKey(process.env.AUTHORITY_FEE_WALLET);
      }

      this.isInitialized = true;
      console.log('PaymentsService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PaymentsService:', error);
      throw error;
    }
  }


  private deriveMerchantTreasuryPda(merchant: PublicKey): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('merchant_treasury'), merchant.toBuffer()],
      this.programId
    );
    return pda;
  }

  private deriveConfigPda(): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
      this.programId
    );
    return pda;
  }

  /**
   * Reads Config PDA using Anchor IDL if available; otherwise falls back to env.
   * If you have your IDL JSON, import it and decode properly.
   */
  private async loadConfig(): Promise<ConfigState> {
    if (!this.isInitialized) {
      throw new Error('PaymentsService is not initialized');
    }

    try {
      // If your backend repo has the IDL, do something like:
      // import idl from '../../idl/swiftment_core.json';
      // const provider = new anchor.AnchorProvider(this.connection, {} as any, {});
      // const program = new anchor.Program(idl as any, this.programId, provider);
      // const cfgPda = this.deriveConfigPda();
      // const cfg = await program.account.config.fetch(cfgPda);
      // return { feeAuthority: cfg.feeAuthority, feeBps: cfg.feeBps };

      if (!this.authorityFallback) {
        throw new Error('No Config reader and no AUTHORITY_FEE_WALLET fallback');
      }
      return { feeAuthority: this.authorityFallback, feeBps: 0 }; // no fee bps known
    } catch (error) {
      console.error('Error in loadConfig:', error);
      if (!this.authorityFallback) {
        throw new Error('No fallback authority available');
      }
      return { feeAuthority: this.authorityFallback, feeBps: 0 };
    }
  }

  /**
   * Strict verification:
   *  - Fetch parsed tx by signature
   *  - Find all token transfers in postTokenBalances - preTokenBalances delta
   *  - Ensure transfer to merchant treasury ATA (USDC)
   *  - If feeBps > 0, ensure transfer to feeAuthority ATA
   */
  async verifySPLTransfer(signature: string, merchantStr: string): Promise<boolean> {
    const merchant = new PublicKey(merchantStr);
    const cfg = await this.loadConfig();

    const treasuryPda = this.deriveMerchantTreasuryPda(merchant);
    const merchantAta = getAssociatedTokenAddressSync(this.usdcMint, treasuryPda, true);
    const feeAta = getAssociatedTokenAddressSync(this.usdcMint, cfg.feeAuthority, true);

    const tx = await this.connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed',
    });
    if (!tx) return false;

    // Check it involved SPL-Token program at all
    const ixPrograms = (tx.transaction.message.staticAccountKeys || []).map(k => k.toBase58());
    if (!ixPrograms.includes(TOKEN_PROGRAM_ID.toBase58())) {
      // Not necessarily fatal if parser provides balances — continue
    }

    // Build balance maps per account pre/post
    const pre: Record<string, { mint: string; ui: number }> = {};
    const post: Record<string, { mint: string; ui: number }> = {};

    for (const b of tx.meta?.preTokenBalances ?? []) {
      pre[b.accountIndex] = { mint: b.mint, ui: Number(b.uiTokenAmount.uiAmount || 0) };
    }
    for (const b of tx.meta?.postTokenBalances ?? []) {
      post[b.accountIndex] = { mint: b.mint, ui: Number(b.uiTokenAmount.uiAmount || 0) };
    }

    // Map account index → pubkey
    const acctKeys = tx.transaction.message.getAccountKeys({ accountKeysFromLookups: tx.meta?.loadedAddresses });
    const indexToPubkey = (i: number) => acctKeys.get(i)?.toBase58() || '';

    // Compute deltas
    type Delta = { owner: string; ata: string; mint: string; delta: number };
    const deltas: Delta[] = [];
    const allIdx = new Set<number>([
      ...Object.keys(pre).map(Number),
      ...Object.keys(post).map(Number),
    ]);

    for (const i of allIdx) {
      const p = pre[i]; const q = post[i];
      if (!p && !q) continue;
      const mint = (q?.mint ?? p?.mint) || '';
      if (mint !== this.usdcMint.toBase58()) continue; // only USDC
      const before = p?.ui ?? 0;
      const after = q?.ui ?? 0;
      const d = after - before; // positive => received
      if (d === 0) continue;
      const ata = indexToPubkey(i);
      deltas.push({ owner: 'unknown', ata, mint, delta: d });
    }

    // Merge by ATA
    const byAta = new Map<string, number>();
    for (const d of deltas) {
      byAta.set(d.ata, (byAta.get(d.ata) ?? 0) + d.delta);
    }

    const recvToMerchant = byAta.get(merchantAta.toBase58()) ?? 0;
    if (recvToMerchant <= 0) return false; // must have received USDC

    // Fee verification (if fee > 0)
    if (cfg.feeBps && cfg.feeBps > 0) {
      const recvToFee = byAta.get(feeAta.toBase58()) ?? 0;
      if (recvToFee <= 0) return false;
      // Optional: check proportionally: fee ≈ amount * feeBps/10000 (allow small rounding)
      const expectedFee = (recvToMerchant * cfg.feeBps) / 10000;
      const within = Math.abs(recvToFee - expectedFee) <= 0.0001;
      if (!within) return false;
    }

    return true;
  }
}
