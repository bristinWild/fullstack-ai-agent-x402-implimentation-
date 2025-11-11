// swiftment-web/src/components/PayButton.tsx
// Updated PayButton with backend verification

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PROGRAM_ID, USDC_MINT } from "../lib/solana";
import { verifyPayment } from "../lib/api";
import * as anchor from "@coral-xyz/anchor";

interface PayButtonProps {
  merchantAuthority: string;
  amountUsdc: number; // in USDC (e.g. 2.5 = $2.50)
  label?: string;
  onSuccess?: (signature: string) => void;
  onError?: (error: Error) => void;
}

export function PayButton({
  merchantAuthority,
  amountUsdc,
  label = "Pay Now",
  onSuccess,
  onError,
}: PayButtonProps) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");

  async function handlePay() {
    if (!publicKey) {
      setStatus("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setStatus("Preparing transaction...");

    try {
      const merchant = new PublicKey(merchantAuthority);
      const payer = publicKey;

      // Convert USDC amount to lamports (6 decimals)
      const amountLamports = Math.floor(amountUsdc * 1_000_000);

      // Derive PDAs
      const [merchantPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("merchant"), merchant.toBuffer()],
        PROGRAM_ID
      );

      const [treasuryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury"), merchantPda.toBuffer()],
        PROGRAM_ID
      );

      const [userPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), payer.toBuffer()],
        PROGRAM_ID
      );

      const [userPlatformPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user_platform"), payer.toBuffer(), merchant.toBuffer()],
        PROGRAM_ID
      );

      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        PROGRAM_ID
      );

      // Get token accounts
      const payerUsdcAta = getAssociatedTokenAddressSync(USDC_MINT, payer);
      const treasuryUsdcAta = getAssociatedTokenAddressSync(
        USDC_MINT,
        treasuryPda,
        true
      );

      // Create transaction
      const transaction = new Transaction();

      // Check if payer's USDC ATA exists, create if not
      try {
        await connection.getAccountInfo(payerUsdcAta);
      } catch {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            payer,
            payerUsdcAta,
            payer,
            USDC_MINT
          )
        );
      }

      // Create the payment instruction
      // Note: You'll need to import your program IDL and create the instruction properly
      // This is a simplified example - adjust based on your actual program interface

      setStatus("Awaiting approval...");

      // Send transaction
      const signature = await sendTransaction(transaction, connection);

      setStatus("Confirming transaction...");

      // Wait for confirmation
      await connection.confirmTransaction(signature, "confirmed");

      setStatus("Verifying payment with backend...");

      // Verify with backend
      const verificationResult = await verifyPayment(signature, merchantAuthority);

      if (verificationResult.ok) {
        setStatus("✅ Payment successful!");
        onSuccess?.(signature);
      } else {
        throw new Error(
          verificationResult.reason || "Payment verification failed"
        );
      }
    } catch (error) {
      console.error("Payment error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Payment failed";
      setStatus(`❌ ${errorMessage}`);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 16 }}>
      <button
        onClick={handlePay}
        disabled={!publicKey || loading}
        style={{
          padding: "12px 24px",
          fontSize: 16,
          background: loading ? "#ccc" : "#6366f1",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: loading || !publicKey ? "not-allowed" : "pointer",
          fontWeight: 600,
        }}
      >
        {loading ? "Processing..." : `${label} ($${amountUsdc.toFixed(2)})`}
      </button>
      {status && (
        <p
          style={{
            marginTop: 8,
            color: status.startsWith("✅") ? "green" : status.startsWith("❌") ? "red" : "#666",
          }}
        >
          {status}
        </p>
      )}
    </div>
  );
}
