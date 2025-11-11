import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';

export const RPC_URL =
  import.meta.env.VITE_RPC || "https://api.devnet.solana.com";

export const PROGRAM_ID = new PublicKey(import.meta.env.VITE_PROGRAM_ID as string);
export const USDC_MINT = new PublicKey(import.meta.env.VITE_USDC_MINT as string);

export const connection = new Connection(RPC_URL, 'confirmed');

/**
 * PDA helpers — update seeds here if your program differs.
 * Common patterns:
 *  - merchant treasury: ["merchant_treasury", merchant]
 *  - program config: ["config"]
 */
export function deriveMerchantTreasuryPda(merchant: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("merchant"), merchant.toBuffer()],
    PROGRAM_ID
  )[0];
}

export function deriveTreasuryPda(merchant: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("treasury"), deriveMerchantTreasuryPda(merchant).toBuffer()],
    PROGRAM_ID
  )[0];
}

export function deriveConfigPda() {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    PROGRAM_ID
  )[0];
}

export function ataOfUSDC(owner: PublicKey) {
  return getAssociatedTokenAddressSync(USDC_MINT, owner, true);
}



