

import { useState } from "react";
import * as anchor from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { sdk, getProgram } from "../swiftment";

export function PayButton({
  merchantAuthority,
  amountUsdc
}: {
  merchantAuthority: string;
  amountUsdc: number;
}) {
  const { connection } = useConnection();
  const wallet = useWallet(); // Get the full wallet object
  const { publicKey } = wallet;

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");

  const onClick = async () => {
    if (!publicKey || !wallet.signTransaction || !wallet.sendTransaction) {
      setError("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setStatus("Preparing transaction...");
    setError("");

    try {
      // Create a proper AnchorProvider with the wallet
      const provider = new anchor.AnchorProvider(
        connection,
        wallet as any, // Pass the entire wallet object
        {
          commitment: 'confirmed',
          preflightCommitment: 'confirmed'
        }
      );

      const program = getProgram(provider);
      const api = sdk(program);

      console.log("User:", publicKey.toString());
      console.log("Merchant:", merchantAuthority);
      console.log("Amount:", amountUsdc);

      // First ensure user is registered and opted in
      setStatus("Registering user and opting in...");
      try {
        await api.ensureUserAndOptIn(
          publicKey,
          new anchor.web3.PublicKey(merchantAuthority)
        );
        console.log("User registered and opted in");
      } catch (err) {
        console.log("User might already be registered:", err);
        // Continue anyway - they might already be registered
      }

      // Now make the payment
      setStatus("Processing payment...");
      const sig = await api.pay(
        publicKey,
        new anchor.web3.PublicKey(merchantAuthority),
        amountUsdc
      );

      setStatus(`✅ Payment successful! Signature: ${sig}`);
      console.log("Payment signature:", sig);

      // Clear success message after 5 seconds
      setTimeout(() => setStatus(""), 5000);

    } catch (err: any) {
      console.error("Payment error:", err);
      const errorMessage = err?.message || err?.toString() || "Payment failed";
      setError(`❌ Error: ${errorMessage}`);
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 16 }}>
      <button
        onClick={onClick}
        disabled={!publicKey || loading}
        style={{
          padding: "12px 24px",
          fontSize: 16,
          background: loading ? "#ccc" : !publicKey ? "#666" : "#6366f1",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: loading || !publicKey ? "not-allowed" : "pointer",
          fontWeight: 600,
        }}
      >
        {loading ? "Processing..." : `Pay ${amountUsdc} USDC`}
      </button>

      {status && (
        <p style={{
          marginTop: 8,
          color: status.startsWith("✅") ? "green" : "#666",
          fontSize: 14
        }}>
          {status}
        </p>
      )}

      {error && (
        <p style={{
          marginTop: 8,
          color: "red",
          fontSize: 14
        }}>
          {error}
        </p>
      )}

      {!publicKey && (
        <p style={{
          marginTop: 8,
          color: "#666",
          fontSize: 14,
          fontStyle: "italic"
        }}>
          Connect your wallet to make a payment
        </p>
      )}
    </div>
  );
}