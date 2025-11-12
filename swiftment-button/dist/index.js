"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  SwiftmentPayButton: () => SwiftmentPayButton
});
module.exports = __toCommonJS(index_exports);

// src/components/PayButton.tsx
var import_react = __toESM(require("react"));
var anchor = __toESM(require("@coral-xyz/anchor"));
var import_wallet_adapter_react = require("@solana/wallet-adapter-react");
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
  const { connection } = (0, import_wallet_adapter_react.useConnection)();
  const { publicKey, signTransaction } = (0, import_wallet_adapter_react.useWallet)();
  const [loading, setLoading] = (0, import_react.useState)(false);
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
  return /* @__PURE__ */ import_react.default.createElement(
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SwiftmentPayButton
});
