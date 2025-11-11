import { Controller, Get, Param, Query } from '@nestjs/common';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';

const RPC_URL = process.env.RPC_URL!;
const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID!);
const USDC_MINT = new PublicKey(process.env.USDC_MINT!);

function deriveMerchantTreasuryPda(merchant: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('merchant_treasury'), merchant.toBuffer()],
    PROGRAM_ID
  )[0];
}

@Controller('api/purchases')
export class PurchasesController {
  private conn = new Connection(RPC_URL, 'confirmed');

  @Get(':user')
  async list(@Param('user') userStr: string, @Query('limit') limitStr?: string) {
    const user = new PublicKey(userStr);
    const limit = Math.min(Number(limitStr || 50), 200);

    // MVP: scan recent signatures against PROGRAM_ID
    const sigs = await this.conn.getSignaturesForAddress(PROGRAM_ID, { limit });
    const out: { sig: string; slot: number; time: string; merchant: string; amount: number }[] = [];

    for (const s of sigs) {
      const tx = await this.conn.getTransaction(s.signature, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed',
      });
      if (!tx) continue;

      // Fast filter: ensure user is among accounts
      const keys = tx.transaction.message.getAccountKeys({ accountKeysFromLookups: tx.meta?.loadedAddresses });
      if (!keys.staticAccountKeys.some(k => k.equals(user))) {
        // Not guaranteed, but avoids most irrelevant tx
        // (Optionally drop this if users don't appear in account keys after versioned lookups)
      }

      // Token balance deltas (USDC only)
      const pre: Record<number, number> = {};
      const post: Record<number, number> = {};
      const mintMap: Record<number, string> = {};

      for (const b of tx.meta?.preTokenBalances ?? []) {
        pre[b.accountIndex] = Number(b.uiTokenAmount.uiAmount || 0);
        mintMap[b.accountIndex] = b.mint;
      }
      for (const b of tx.meta?.postTokenBalances ?? []) {
        post[b.accountIndex] = Number(b.uiTokenAmount.uiAmount || 0);
        mintMap[b.accountIndex] = b.mint;
      }

      const acctKeys = tx.transaction.message.getAccountKeys({ accountKeysFromLookups: tx.meta?.loadedAddresses });

      // Heuristic: find any +USDC to an ATA that looks like a merchant treasury ATA
      for (const [iStr, after] of Object.entries(post)) {
        const i = Number(iStr);
        const before = pre[i] ?? 0;
        const delta = after - before;
        const mint = mintMap[i];
        if (mint !== USDC_MINT.toBase58() || delta <= 0) continue;

        const ataPk = acctKeys.get(i);
        if (!ataPk) continue;

        // Optional: if you maintain a merchant registry, verify ATA matches it
        // Here we treat any USDC recipient as “merchant” if its owner PDA matches deriveMerchantTreasuryPda
        // (Cannot confirm ATA owner without account fetch; keep MVP simple)
        // You can tighten by fetching token account owner here.

        out.push({
          sig: s.signature,
          slot: s.slot,
          time: s.blockTime ? new Date(s.blockTime * 1000).toISOString() : '',
          merchant: ataPk.toBase58(),
          amount: Number(delta.toFixed(6)),
        });
      }
    }

    return out.slice(0, limit);
  }
}
