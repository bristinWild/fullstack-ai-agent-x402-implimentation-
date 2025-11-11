import { PublicKey } from "@solana/web3.js";

export const pdas = (programId: PublicKey) => ({
  config: () => PublicKey.findProgramAddressSync([Buffer.from("config")], programId)[0],
  merchant: (auth: PublicKey) =>
    PublicKey.findProgramAddressSync([Buffer.from("merchant"), auth.toBuffer()], programId)[0],
  treasury: (merchantPda: PublicKey) =>
    PublicKey.findProgramAddressSync([Buffer.from("treasury"), merchantPda.toBuffer()], programId)[0],
  user: (owner: PublicKey) =>
    PublicKey.findProgramAddressSync([Buffer.from("user"), owner.toBuffer()], programId)[0],
  userPlatform: (u: PublicKey, m: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("user_platform"), u.toBuffer(), m.toBuffer()],
      programId
    )[0],
});
