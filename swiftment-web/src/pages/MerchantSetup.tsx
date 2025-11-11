import React, { useEffect, useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { connection, deriveMerchantTreasuryPda, deriveTreasuryPda ,ataOfUSDC, USDC_MINT } from '../lib/solana';
import CopySnippet from '../components/CopySnippet';

export default function MerchantSetup() {
  const { publicKey } = useWallet();
  const [treasuryPda, setTreasuryPda] = useState<PublicKey | null>(null);
  const [treasuryAta, setTreasuryAta] = useState<PublicKey | null>(null);
  const [merchantPda, setMerchantPda] = useState<PublicKey | null>(null);
  const [usdc, setUsdc] = useState<string>('0');

  useEffect(() => {
    if (!publicKey) return;
    const merchantPda = deriveMerchantTreasuryPda(publicKey);
    setMerchantPda(merchantPda);
    const TreasuryPda = deriveTreasuryPda(publicKey);
    setTreasuryPda(TreasuryPda);
    const TreasuryAta = ataOfUSDC(TreasuryPda);
    setTreasuryAta(TreasuryAta);
  }, [publicKey]);

  useEffect(() => {
    if (!treasuryAta) return;
    (async () => {
      try {
        const bal = await connection.getTokenAccountBalance(treasuryAta);
        setUsdc(bal.value.uiAmountString ?? '0');
      } catch {
        setUsdc('0');
      }
    })();
  }, [treasuryAta]);

  const snippet = useMemo(() => {
    const addr = treasuryPda?.toBase58() ?? '<connect wallet>';
    return `<PayButton address="${addr}" mint="${USDC_MINT.toBase58()}" />`;
  }, [treasuryPda]);

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: 24 }}>
      <h2>Merchant Setup</h2>
      {!publicKey && <p>Connect your wallet to view your merchant treasury.</p>}

      {publicKey && (
        <>
          <div style={{ marginTop: 12 }}>
            <div><strong>Merchant Account:</strong> {publicKey.toBase58()}</div>
            <div><strong>Merchant PDA:</strong> {merchantPda?.toBase58() ?? '—'}</div>
            <div><strong>Treasury PDA:</strong> {treasuryPda?.toBase58() ?? '—'}</div>
            <div><strong>Treasury USDC ATA:</strong> {treasuryAta?.toBase58() ?? '—'}</div>
            <div><strong>USDC Balance:</strong> {usdc}</div>
          </div>

          <h3 style={{ marginTop: 24 }}>Embed Pay Button</h3>
          <CopySnippet code={snippet} />
          <p style={{ marginTop: 6, opacity: 0.8 }}>
            Paste this in any merchant page; the SDK will route funds to your Treasury PDA’s USDC ATA.
          </p>
        </>
      )}
    </div>
  );
}
