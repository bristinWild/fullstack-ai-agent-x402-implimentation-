

import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { pdas as makePdas } from "./pda";

// Import the raw IDL
import rawIdl from "./idl/swiftment_core_mvp.json";

export const PROGRAM_ID = new PublicKey(import.meta.env.VITE_PROGRAM_ID as string);
export const USDC_MINT = new PublicKey(import.meta.env.VITE_USDC_MINT as string);

// Add complete IDL - cast to unknown then Idl to bypass TypeScript
const idlWithTypes = {
  ...rawIdl,
  types: [
    {
      name: "Config",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "pubkey" },
          { name: "usdcMint", type: "pubkey" },
          { name: "purchaseFeeBps", type: "u16" },
          { name: "withdrawFeeBps", type: "u16" },
          { name: "bump", type: "u8" }
        ]
      }
    },
    {
      name: "Merchant",
      type: {
        kind: "struct",
        fields: [
          { name: "merchantAuthority", type: "pubkey" },
          { name: "treasury", type: "pubkey" },
          { name: "bump", type: "u8" }
        ]
      }
    },
    {
      name: "Treasury",
      type: {
        kind: "struct",
        fields: [
          { name: "merchant", type: "pubkey" },
          { name: "usdcAta", type: "pubkey" },
          { name: "bump", type: "u8" }
        ]
      }
    },
    {
      name: "User",
      type: {
        kind: "struct",
        fields: [
          { name: "owner", type: "pubkey" },
          { name: "defaultDailyLimitUsdc", type: "u64" },
          { name: "bump", type: "u8" }
        ]
      }
    },
    {
      name: "UserPlatform",
      type: {
        kind: "struct",
        fields: [
          { name: "user", type: "pubkey" },
          { name: "merchant", type: "pubkey" },
          { name: "dailyLimitUsdc", type: "u64" },
          { name: "spentTodayUsdc", type: "u64" },
          { name: "lastResetUnix", type: "i64" },
          { name: "bump", type: "u8" }
        ]
      }
    },
    {
      name: "PurchaseEvent",
      type: {
        kind: "struct",
        fields: [
          { name: "user", type: "pubkey" },
          { name: "merchant", type: "pubkey" },
          { name: "amountUsdc", type: "u64" },
          { name: "feeUsdc", type: "u64" },
          { name: "ts", type: "i64" }
        ]
      }
    },
    {
      name: "WithdrawEvent",
      type: {
        kind: "struct",
        fields: [
          { name: "merchant", type: "pubkey" },
          { name: "amountUsdc", type: "u64" },
          { name: "feeUsdc", type: "u64" },
          { name: "ts", type: "i64" }
        ]
      }
    }
  ]
} as unknown as anchor.Idl;

export function getProgram(provider: anchor.AnchorProvider) {
  try {
    return new anchor.Program(idlWithTypes, provider);
  } catch (error: any) {
    console.error("Failed to create program:", error);
    throw new Error(`Failed to initialize program: ${error.message}`);
  }
}

export const sdk = (program: anchor.Program) => {
  const find = makePdas(PROGRAM_ID);

  return {
    pdas: find,

    async registerMerchant(merchantAuthority: PublicKey) {
      const merchant = find.merchant(merchantAuthority);
      const treasury = find.treasury(merchant);
      const config = find.config();
      const treasuryUsdcAta = getAssociatedTokenAddressSync(USDC_MINT, treasury, true);

      console.log("🏪 Registering merchant...");
      console.log("   Merchant:", merchant.toString());
      console.log("   Treasury:", treasury.toString());

      try {
        const tx = await program.methods
          .registerMerchant()
          .accounts({
            config,
            merchant,
            treasury,
            treasuryUsdcAta,
            usdcMint: USDC_MINT,
            merchantAuthority,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        console.log("✅ Merchant registered! Tx:", tx);
        return tx;
      } catch (error: any) {
        if (error.message?.includes("already in use")) {
          console.log("ℹ️  Merchant already registered");
          return null;
        }
        throw error;
      }
    },

    async ensureUserAndOptIn(
      userAuthority: PublicKey,
      merchantAuthority: PublicKey,
      dailyLimit = 100_000_000
    ) {
      const user = find.user(userAuthority);
      const merchant = find.merchant(merchantAuthority);
      const userPlatform = find.userPlatform(user, merchant);
      const config = find.config();

      console.log("🔑 PDAs:", {
        user: user.toString(),
        merchant: merchant.toString(),
        userPlatform: userPlatform.toString(),
        config: config.toString()
      });

      // Try to register user
      try {
        console.log("📝 Registering user...");
        await program.methods
          .registerUser()
          .accounts({
            user,
            userAuthority,
            systemProgram: SystemProgram.programId
          })
          .rpc();
        console.log("✅ User registered");
      } catch (error: any) {
        if (error.message?.includes("already in use")) {
          console.log("ℹ️  User already registered");
        } else {
          console.log("⚠️  User registration:", error.message?.substring(0, 100));
        }
      }

      // Try to opt in to merchant
      try {
        console.log("📝 Opting in to merchant...");
        await program.methods
          .optIn(new anchor.BN(dailyLimit))
          .accounts({
            config,
            user,
            merchant,
            userPlatform,
            userAuthority,
            systemProgram: SystemProgram.programId
          })
          .rpc();
        console.log("✅ Opted in");
      } catch (error: any) {
        if (error.message?.includes("already in use")) {
          console.log("ℹ️  Already opted in");
        } else if (error.message?.includes("AccountNotInitialized")) {
          console.log("⚠️  Merchant not registered yet!");
          throw new Error("Merchant must register first. Please register as a merchant.");
        } else {
          console.log("⚠️  Opt-in:", error.message?.substring(0, 100));
        }
      }

      return { user, merchant, userPlatform };
    },

    async pay(
      userAuthority: PublicKey,
      merchantAuthority: PublicKey,
      amountUsdc: number
    ) {
      const config = find.config();
      const user = find.user(userAuthority);
      const merchant = find.merchant(merchantAuthority);
      const treasury = find.treasury(merchant);
      const userPlatform = find.userPlatform(user, merchant);

      const userUsdcAta = getAssociatedTokenAddressSync(USDC_MINT, userAuthority);
      const treasuryUsdcAta = getAssociatedTokenAddressSync(USDC_MINT, treasury, true);

      console.log("💳 Payment accounts:", {
        config: config.toString(),
        user: user.toString(),
        merchant: merchant.toString(),
        treasury: treasury.toString(),
        userUsdcAta: userUsdcAta.toString(),
        treasuryUsdcAta: treasuryUsdcAta.toString()
      });

      // Fetch config to get authority treasury
      const cfg = await (program.account as any).config.fetch(config);

      console.log("⚙️  Config fetched:", {
        authority: cfg.authority.toString(),
        usdcMint: cfg.usdcMint.toString()
      });

      const authorityTreasury = getAssociatedTokenAddressSync(
        USDC_MINT,
        cfg.authority as PublicKey
      );

      const amount = new anchor.BN(Math.round(amountUsdc * 1_000_000)); // 6 decimals

      console.log("💰 Payment details:", {
        amountUsdc,
        amountLamports: amount.toString(),
        authorityTreasury: authorityTreasury.toString()
      });

      console.log("📤 Sending transaction...");

      // FIXED: Include usdcMint in the accounts
      return program.methods
        .pay(amount)
        .accounts({
          config,
          user,
          merchant,
          userPlatform,
          userUsdcAta,
          treasury,
          treasuryUsdcAta,
          authorityTreasury,
          userAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
    }
  };
};