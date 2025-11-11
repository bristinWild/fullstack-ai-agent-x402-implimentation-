import * as anchor from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { sdk, getProgram } from "../swiftment";

export function PayButton({ merchantAuthority, amountUsdc }: { merchantAuthority: string; amountUsdc: number }) {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();

  const onClick = async () => {
    if (!publicKey || !signTransaction) return;
    const provider = new anchor.AnchorProvider(connection, { publicKey, signTransaction } as any, {});
    const program = getProgram(provider);
    const api = sdk(program);

    await api.ensureUserAndOptIn(publicKey, new anchor.web3.PublicKey(merchantAuthority));
    const sig = await api.pay(publicKey, new anchor.web3.PublicKey(merchantAuthority), amountUsdc);
    alert(`Paid! Sig: ${sig}`);
  };

  return <button onClick={onClick} style={{ padding: 12, borderRadius: 12 }}>Pay {amountUsdc} USDC</button>;
}
