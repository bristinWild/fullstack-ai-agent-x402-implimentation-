import { Controller, Get, Param } from '@nestjs/common';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';

const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID!);
const USDC_MINT = new PublicKey(process.env.USDC_MINT!);

function deriveMerchantTreasuryPda(merchant: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('merchant_treasury'), merchant.toBuffer()],
    PROGRAM_ID
  )[0];
}

@Controller('api/user')
export class UsersController {
  @Get(':user/opted-in')
  async opted(@Param('user') userStr: string) {
    // MVP: read from an env registry; if your chain has opt-in accounts, replace this with a real scan or Anchor account fetch.
    const list = (process.env.OPTIN_CANDIDATE_MERCHANTS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const out = list.map((m) => {
      const mPk = new PublicKey(m);
      const tp = deriveMerchantTreasuryPda(mPk);
      const ata = getAssociatedTokenAddressSync(USDC_MINT, tp, true);
      return { merchant: mPk.toBase58(), treasuryPda: tp.toBase58(), treasuryAta: ata.toBase58() };
    });

    return out;
  }
}
