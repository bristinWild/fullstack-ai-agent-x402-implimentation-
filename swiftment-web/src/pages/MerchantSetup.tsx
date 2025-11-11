import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { connection, deriveMerchantTreasuryPda, deriveTreasuryPda, ataOfUSDC, USDC_MINT } from '../lib/solana';

// Copy button component
const CopyButton: React.FC<{ text: string; label?: string }> = ({ text, label = 'Copy' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        padding: '6px 12px',
        background: copied ? '#10b981' : '#6366f1',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.2s'
      }}
    >
      {copied ? '✓ Copied!' : label}
    </button>
  );
};

// Code snippet component
const CodeSnippet: React.FC<{ code: string; language?: string; title?: string }> = ({
  code,
  language = 'tsx',
  title
}) => {
  return (
    <div style={{ marginTop: '16px' }}>
      {title && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{title}</h4>
          <CopyButton text={code} />
        </div>
      )}
      <pre style={{
        background: '#1e293b',
        color: '#e2e8f0',
        padding: '16px',
        borderRadius: '8px',
        overflow: 'auto',
        fontSize: '13px',
        margin: 0,
        fontFamily: 'Monaco, Consolas, monospace'
      }}>
        <code>{code}</code>
      </pre>
    </div>
  );
};

// Stats card component
const StatCard: React.FC<{ label: string; value: string; icon?: string }> = ({ label, value, icon }) => {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      borderRadius: '12px',
      color: 'white',
      flex: 1,
      minWidth: '200px'
    }}>
      <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
        {icon && <span style={{ marginRight: '8px' }}>{icon}</span>}
        {label}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{value}</div>
    </div>
  );
};

export default function MerchantSetup() {
  const { publicKey } = useWallet();
  const [treasuryPda, setTreasuryPda] = useState<PublicKey | null>(null);
  const [treasuryAta, setTreasuryAta] = useState<PublicKey | null>(null);
  const [merchantPda, setMerchantPda] = useState<PublicKey | null>(null);
  const [usdc, setUsdc] = useState<string>('0');
  const [activeTab, setActiveTab] = useState<'overview' | 'integration' | 'customize'>('overview');

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
    const fetchBalance = async () => {
      try {
        const bal = await connection.getTokenAccountBalance(treasuryAta);
        setUsdc(bal.value.uiAmountString ?? '0');
      } catch {
        setUsdc('0');
      }
    };
    fetchBalance();
    const interval = setInterval(fetchBalance, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [treasuryAta]);

  const merchantAddress = publicKey?.toBase58() || '';

  // Integration snippets
  const npmInstall = `npm install @swiftment/pay-button @solana/wallet-adapter-react`;

  const reactComponent = `import { SwiftmentPayButton } from '@swiftment/pay-button';

function ProductPage() {
  return (
    <SwiftmentPayButton
      merchantAddress="${merchantAddress}"
      amount={29.99}
      label="Buy Now - $29.99"
      description="Premium Product"
      onSuccess={(signature) => {
        console.log('Payment successful!', signature);
      }}
    />
  );
}`;

  const htmlScript = `<!-- Add this to your HTML -->
<script src="https://unpkg.com/@swiftment/pay-button"></script>
<div id="swiftment-pay"></div>

<script>
  SwiftmentPayButton.render('#swiftment-pay', {
    merchantAddress: '${merchantAddress}',
    amount: 29.99,
    label: 'Buy Now'
  });
</script>`;

  const nextjsComponent = `// app/checkout/page.tsx
'use client';

import { SwiftmentPayButton } from '@swiftment/pay-button';
import dynamic from 'next/dynamic';

const PayButton = dynamic(
  () => import('@swiftment/pay-button').then(m => m.SwiftmentPayButton),
  { ssr: false }
);

export default function CheckoutPage() {
  return (
    <PayButton 
      merchantAddress="${merchantAddress}"
      amount={49.99}
    />
  );
}`;

  if (!publicKey) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '40px auto',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{
          background: '#f8fafc',
          padding: '60px 24px',
          borderRadius: '16px',
          border: '2px dashed #cbd5e1'
        }}>
          <h2 style={{ fontSize: '32px', marginBottom: '16px' }}>
            Welcome to Swiftment Merchant Dashboard
          </h2>
          <p style={{ fontSize: '18px', color: '#64748b', marginBottom: '24px' }}>
            Connect your wallet to get started with accepting payments
          </p>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>
            ✨ No registration required • 🚀 Start accepting USDC in minutes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>
          Merchant Dashboard
        </h1>
        <p style={{ color: '#64748b', fontSize: '16px' }}>
          Accept USDC payments with built-in fraud protection
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '32px',
        flexWrap: 'wrap'
      }}>
        <StatCard label="Treasury Balance" value={`${usdc} USDC`} icon="💰" />
        <StatCard label="Status" value="Active" icon="✅" />
        <StatCard label="Network" value="Devnet" icon="🌐" />
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '2px solid #e2e8f0',
        marginBottom: '24px'
      }}>
        {(['overview', 'integration', 'customize'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #6366f1' : 'none',
              color: activeTab === tab ? '#6366f1' : '#64748b',
              fontWeight: activeTab === tab ? '600' : '400',
              cursor: 'pointer',
              fontSize: '16px',
              marginBottom: '-2px',
              textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div>
          <div style={{
            background: '#f8fafc',
            padding: '24px',
            borderRadius: '12px',
            marginBottom: '24px'
          }}>
            <h3 style={{ marginTop: 0 }}>Account Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <strong>Merchant Address:</strong>
                <div style={{
                  fontFamily: 'Monaco, monospace',
                  fontSize: '13px',
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <code style={{
                    background: 'white',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    flex: 1
                  }}>
                    {merchantAddress}
                  </code>
                  <CopyButton text={merchantAddress} />
                </div>
              </div>
              <div>
                <strong>Treasury PDA:</strong>
                <div style={{
                  fontFamily: 'Monaco, monospace',
                  fontSize: '13px',
                  marginTop: '4px'
                }}>
                  <code style={{
                    background: 'white',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    display: 'block'
                  }}>
                    {treasuryPda?.toBase58() ?? '—'}
                  </code>
                </div>
              </div>
              <div>
                <strong>Treasury USDC ATA:</strong>
                <div style={{
                  fontFamily: 'Monaco, monospace',
                  fontSize: '13px',
                  marginTop: '4px'
                }}>
                  <code style={{
                    background: 'white',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    display: 'block'
                  }}>
                    {treasuryAta?.toBase58() ?? '—'}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'integration' && (
        <div>
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #10b981',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <strong style={{ color: '#047857' }}>📚 Quick Start Guide</strong>
            <p style={{ margin: '8px 0 0 0', color: '#065f46' }}>
              Choose your integration method below and start accepting payments in minutes!
            </p>
          </div>

          <h3>1️⃣ Install Package</h3>
          <CodeSnippet code={npmInstall} language="bash" title="NPM Install" />

          <h3 style={{ marginTop: '32px' }}>2️⃣ Choose Your Integration</h3>

          <h4 style={{ marginTop: '24px', color: '#6366f1' }}>React Component</h4>
          <CodeSnippet code={reactComponent} title="React/Vite/CRA" />

          <h4 style={{ marginTop: '24px', color: '#6366f1' }}>Next.js App Router</h4>
          <CodeSnippet code={nextjsComponent} title="Next.js 13+ (App Router)" />

          <h4 style={{ marginTop: '24px', color: '#6366f1' }}>Vanilla HTML/JS</h4>
          <CodeSnippet code={htmlScript} language="html" title="HTML Script Tag" />

          <div style={{
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            padding: '16px',
            borderRadius: '8px',
            marginTop: '24px'
          }}>
            <strong style={{ color: '#92400e' }}>⚡ Coming Soon:</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#78350f' }}>
              <li>WordPress Plugin</li>
              <li>Shopify App</li>
              <li>WooCommerce Extension</li>
              <li>Webflow Widget</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'customize' && (
        <div>
          <h3>🎨 Button Customization</h3>
          <p style={{ color: '#64748b' }}>
            Customize the appearance of your payment button to match your brand
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginTop: '24px'
          }}>
            {/* Theme examples */}
            <div style={{
              background: '#f8fafc',
              padding: '20px',
              borderRadius: '12px'
            }}>
              <h4>Gradient Theme (Default)</h4>
              <CodeSnippet
                code={`<SwiftmentPayButton
  merchantAddress="${merchantAddress}"
  amount={29.99}
  theme="gradient"
/>`}
              />
            </div>

            <div style={{
              background: '#f8fafc',
              padding: '20px',
              borderRadius: '12px'
            }}>
              <h4>Light Theme</h4>
              <CodeSnippet
                code={`<SwiftmentPayButton
  merchantAddress="${merchantAddress}"
  amount={29.99}
  theme="light"
/>`}
              />
            </div>

            <div style={{
              background: '#f8fafc',
              padding: '20px',
              borderRadius: '12px'
            }}>
              <h4>Dark Theme</h4>
              <CodeSnippet
                code={`<SwiftmentPayButton
  merchantAddress="${merchantAddress}"
  amount={29.99}
  theme="dark"
/>`}
              />
            </div>
          </div>

          <h4 style={{ marginTop: '32px' }}>Custom Styles</h4>
          <CodeSnippet
            code={`<SwiftmentPayButton
  merchantAddress="${merchantAddress}"
  amount={29.99}
  style={{
    background: '#your-brand-color',
    borderRadius: '8px',
    padding: '16px 32px',
    fontSize: '18px'
  }}
/>`}
            title="Custom CSS Styles"
          />
        </div>
      )}
    </div>
  );
}