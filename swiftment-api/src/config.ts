import * as dotenv from "dotenv"; dotenv.config();
export const CFG = {
  rpc: process.env.RPC!,
  programId: process.env.PROGRAM_ID!,
  usdcMint: process.env.USDC_MINT!,
  merchantAuth: process.env.MERCHANT_AUTH!,
};
