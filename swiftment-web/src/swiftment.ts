import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import idl from "./idl/swiftment_core_mvp.json";
import { pdas as makePdas } from "./pda";

export const PROGRAM_ID = new PublicKey(import.meta.env.VITE_PROGRAM_ID as string);
export const USDC_MINT  = new PublicKey(import.meta.env.VITE_USDC_MINT as string);

export function getProgram(provider: anchor.AnchorProvider) {
  return new anchor.Program(idl as any, PROGRAM_ID, provider);
}

export const sdk = (program: anchor.Program) => {
  const find = makePdas(PROGRAM_ID);

  return {
    pdas: find,
    async ensureUserAndOptIn(userAuthority: PublicKey, merchantAuthority: PublicKey, dailyLimit = 100_000_000) {
      const user = find.user(userAuthority);
      const merchant = find.merchant(merchantAuthority);
      const userPlatform = find.userPlatform(user, merchant);
      const config = find.config();

      try {
        await program.methods.registerUser().accounts({
          user, userAuthority, systemProgram: SystemProgram.programId
        }).rpc();
      } catch {}
      try {
        await program.methods.optIn(new anchor.BN(dailyLimit)).accounts({
          config, user, merchant, userPlatform, userAuthority, systemProgram: SystemProgram.programId
        }).rpc();
      } catch {}

      return { user, merchant, userPlatform };
    },

    async pay(userAuthority: PublicKey, merchantAuthority: PublicKey, amountUsdc: number) {
      const config = find.config();
      const user = find.user(userAuthority);
      const merchant = find.merchant(merchantAuthority);
      const treasury = find.treasury(merchant);
      const userPlatform = find.userPlatform(user, merchant);

      const userUsdcAta     = getAssociatedTokenAddressSync(USDC_MINT, userAuthority);
      const treasuryUsdcAta = getAssociatedTokenAddressSync(USDC_MINT, treasury, true);

      const cfg = await program.account.config.fetch(config);
      const authorityTreasury = getAssociatedTokenAddressSync(USDC_MINT, cfg.authority);

      const amount = new anchor.BN(Math.round(amountUsdc * 1_000_000)); // 6 decimals
      return program.methods.pay(amount).accounts({
        config, user, merchant, userPlatform,
        userUsdcAta, treasury, treasuryUsdcAta,
        authorityTreasury, userAuthority,
        tokenProgram: anchor.SPL_TOKEN_PROGRAM_ID,
      }).rpc();
    },
  };
};
