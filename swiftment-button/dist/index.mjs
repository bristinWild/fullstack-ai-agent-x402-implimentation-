// src/components/PayButton.tsx
import React, { useState } from "react";
import * as anchor from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
var getProgram = (provider) => {
  throw new Error("getProgram not implemented - you need to add your SDK");
};
var sdk = (program) => {
  return {
    ensureUserAndOptIn: async (publicKey, merchantAuthority) => {
      throw new Error("SDK not implemented");
    },
    pay: async (publicKey, merchantAuthority, amount) => {
      throw new Error("SDK not implemented");
      return "";
    }
  };
};
function SwiftmentPayButton({
  merchantAuthority,
  amountUsdc,
  onSuccess,
  onError,
  buttonText,
  buttonStyle,
  disabled = false,
  className = ""
}) {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const displayText = buttonText || `Pay ${amountUsdc} USDC`;
  const handleClick = async () => {
    if (!publicKey || !signTransaction) {
      const error = new Error("Wallet not connected");
      onError?.(error);
      return;
    }
    try {
      setLoading(true);
      const provider = new anchor.AnchorProvider(
        connection,
        { publicKey, signTransaction },
        {}
      );
      const program = getProgram(provider);
      const api = sdk(program);
      await api.ensureUserAndOptIn(
        publicKey,
        new anchor.web3.PublicKey(merchantAuthority)
      );
      const signature = await api.pay(
        publicKey,
        new anchor.web3.PublicKey(merchantAuthority),
        amountUsdc
      );
      onSuccess?.(signature);
    } catch (error) {
      console.error("Payment error:", error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };
  const defaultStyle = {
    padding: "12px 24px",
    borderRadius: "12px",
    border: "none",
    backgroundColor: "#512da8",
    color: "white",
    fontSize: "16px",
    fontWeight: "600",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled || loading ? 0.6 : 1,
    transition: "all 0.2s ease",
    ...buttonStyle
  };
  const isDisabled = disabled || loading || !publicKey;
  return /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleClick,
      style: defaultStyle,
      disabled: isDisabled,
      className,
      "aria-busy": loading,
      "aria-disabled": isDisabled
    },
    loading ? "Processing..." : displayText
  );
}
export {
  SwiftmentPayButton
};
