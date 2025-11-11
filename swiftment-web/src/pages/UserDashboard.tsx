import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { connection, USDC_MINT } from '../lib/solana';

type OptedMerchant = { merchant: string; treasuryPda: string; treasuryAta: string };
type Purchase = { sig: string; slot: number; time: string; merchant: string; amount: number };

async function fetchOptedMerchants(user: string): Promise<OptedMerchant[]> {
  const r = await fetch(`/api/user/${user}/opted-in`);
  if (!r.ok) return [];
  return r.json();
}

async function fetchRecentPurchases(user: string): Promise<Purchase[]> {
  const r = await fetch(`/api/purchases/${user}`);
  if (!r.ok) return [];
  return r.json();
}

// Placeholder SDK surface for daily limits; wire to your on-chain methods.
const sdkDaily = {
  async getDailyLimit(merchant: string): Promise<number> {
    const r = await fetch(`/api/limits/${merchant}`);
    if (!r.ok) return 0;
    const { limit } = await r.json();
    return limit ?? 0;
  },
  async setDailyLimit(merchant: string, limit: number): Promise<void> {
    await fetch(`/api/limits/${merchant}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit }),
    });
  },
};

export default function UserDashboard() {
  const { publicKey } = useWallet();
  const [opted, setOpted] = useState<OptedMerchant[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [limits, setLimits] = useState<Record<string, number>>({});
  const [loadingLimits, setLoadingLimits] = useState(false);

  useEffect(() => {
    if (!publicKey) return;
    (async () => {
      const user = publicKey.toBase58();
      const [m, p] = await Promise.all([
        fetchOptedMerchants(user),
        fetchRecentPurchases(user),
      ]);
      setOpted(m);
      setPurchases(p);
    })();
  }, [publicKey]);

  useEffect(() => {
    if (!publicKey || opted.length === 0) return;
    setLoadingLimits(true);
    (async () => {
      const entries = await Promise.all(
        opted.map(async (m) => [m.merchant, await sdkDaily.getDailyLimit(m.merchant)] as const)
      );
      setLimits(Object.fromEntries(entries));
      setLoadingLimits(false);
    })();
  }, [publicKey, opted]);

  const onLimitChange = (merchant: string, next: number) => {
    setLimits((prev) => ({ ...prev, [merchant]: next }));
  };

  const onSaveLimit = async (merchant: string) => {
    const v = limits[merchant] ?? 0;
    await sdkDaily.setDailyLimit(merchant, v);
  };

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24 }}>
      <h2>User Dashboard</h2>
      {!publicKey && <p>Connect your wallet.</p>}

      {publicKey && (
        <>
          <section style={{ marginTop: 16 }}>
            <h3>Opted-in Merchants</h3>
            {opted.length === 0 && <p>None yet.</p>}
            {opted.map((m) => (
              <div key={m.merchant} style={{ border: '1px solid #333', borderRadius: 12, padding: 12, marginTop: 8 }}>
                <div><strong>Merchant:</strong> {m.merchant}</div>
                <div><small>Treasury PDA:</small> {m.treasuryPda}</div>
                <div><small>USDC ATA:</small> {m.treasuryAta}</div>
                <div style={{ marginTop: 8 }}>
                  <label>
                    Daily Limit (USDC):{' '}
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={limits[m.merchant] ?? 0}
                      onChange={(e) => onLimitChange(m.merchant, Number(e.target.value))}
                    />
                  </label>
                  <button style={{ marginLeft: 8 }} disabled={loadingLimits} onClick={() => onSaveLimit(m.merchant)}>
                    Save
                  </button>
                </div>
              </div>
            ))}
          </section>

          <section style={{ marginTop: 24 }}>
            <h3>Recent Purchases</h3>
            {purchases.length === 0 && <p>No recent purchases found.</p>}
            {purchases.map((p) => (
              <div key={p.sig} style={{ borderBottom: '1px solid #444', padding: '8px 0' }}>
                <div><strong>{p.amount}</strong> USDC → <code>{p.merchant}</code></div>
                <div><small>{p.time}</small></div>
                <div><a href={`https://solscan.io/tx/${p.sig}?cluster=devnet`} target="_blank">View</a></div>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
