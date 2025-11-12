import { useMemo } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import "@solana/wallet-adapter-react-ui/styles.css";

import { PayButton } from "./components/PayButton";
import MerchantSetup from "./pages/MerchantSetup";
import UserDashboard from "./pages/UserDashboard";
import { ErrorBoundary } from "./components/ErrorBoundary";


const RPC = import.meta.env.VITE_RPC as string;
const MERCHANT_AUTH = import.meta.env.VITE_MERCHANT_AUTH as string;

function isPubkey(s: string | undefined): boolean {
  if (!s) return false;
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s);
}

function Home() {
  const rpc = import.meta.env.VITE_RPC as string | undefined;
  const merchantAuth = import.meta.env.VITE_MERCHANT_AUTH as string | undefined;

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(to bottom, #f8fafc, #e2e8f0)',
      padding: '60px 5vw',
      boxSizing: 'border-box'
    }}>
      {/* Hero Section */}
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{
          fontSize: 'clamp(36px, 5vw, 56px)',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '16px'
        }}>
          Swiftment
        </h1>
        <p style={{
          fontSize: 'clamp(18px, 2vw, 24px)',
          color: '#64748b',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          Accept USDC payments with built-in spending limits on Solana
        </p>
      </div>

      {/* Features Grid - FULL WIDTH */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '60px',
        width: '100%'
      }}>
        {[
          { icon: '⚡', title: 'Instant Payments', desc: 'Receive USDC instantly' },
          { icon: '🛡️', title: 'Spending Limits', desc: 'User-controlled limits' },
          { icon: '🔧', title: 'Easy Integration', desc: 'One-line integration' },
          { icon: '💰', title: 'Low Fees', desc: 'Only network fees' }
        ].map(feature => (
          <div key={feature.title} style={{
            background: 'white',
            padding: '32px',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
            transition: 'transform 0.2s',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>{feature.icon}</div>
            <h3 style={{ fontSize: '20px', marginBottom: '8px', fontWeight: '600' }}>
              {feature.title}
            </h3>
            <p style={{ color: '#64748b', margin: 0 }}>{feature.desc}</p>
          </div>
        ))}
      </div>

      {/* Demo Section - Centered */}
      <div style={{
        background: 'white',
        padding: '48px',
        borderRadius: '24px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        maxWidth: '600px',
        margin: '0 auto 60px auto'
      }}>
        <h2 style={{ fontSize: '32px', marginBottom: '16px', textAlign: 'center' }}>
          Try It Out
        </h2>
        <p style={{ color: '#64748b', marginBottom: '32px', textAlign: 'center' }}>
          Test payment on Solana Devnet
        </p>

        {!rpc && <p style={{ color: 'tomato', textAlign: 'center' }}>Set <code>VITE_RPC</code> in your .env</p>}
        {!isPubkey(merchantAuth) ? (
          <p style={{ color: 'tomato', textAlign: 'center' }}>
            Set a valid <code>VITE_MERCHANT_AUTH</code> in your .env
          </p>
        ) : (
          <div>
            <div style={{
              background: '#f8fafc',
              padding: '24px',
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <span style={{ fontWeight: '500' }}>Demo Product</span>
                <span style={{ fontWeight: '700', fontSize: '20px' }}>2.5 USDC</span>
              </div>
              <p style={{
                color: '#64748b',
                margin: 0,
                fontSize: '14px',
                textAlign: 'left'
              }}>
                Test payment on devnet
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <PayButton merchantAuthority={merchantAuth!} amountUsdc={2.5} />
            </div>
          </div>
        )}
      </div>

      {/* CTA Section - FULL WIDTH */}
      <div style={{
        padding: '48px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '24px',
        color: 'white',
        textAlign: 'center',
        marginBottom: '60px'
      }}>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 36px)', marginBottom: '16px' }}>
          Ready to Accept Payments?
        </h2>
        <p style={{ fontSize: '18px', marginBottom: '32px', opacity: 0.9 }}>
          Start accepting USDC payments in less than 5 minutes
        </p>
        <Link to="/merchant" style={{ textDecoration: 'none' }}>
          <button style={{
            background: 'white',
            color: '#6366f1',
            padding: '14px 32px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}>
            Become a Merchant
          </button>
        </Link>
      </div>

      {/* Stats - FULL WIDTH */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '24px',
        width: '100%'
      }}>
        {[
          { label: 'Transaction Time', value: '<1s' },
          { label: 'Network Fee', value: '$0.00025' },
          { label: 'Platform Fee', value: '0%' },
          { label: 'Network', value: 'Solana' }
        ].map(stat => (
          <div key={stat.label} style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#6366f1',
              marginBottom: '8px'
            }}>
              {stat.value}
            </div>
            <div style={{ color: '#64748b', fontSize: '14px' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={RPC}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <ErrorBoundary>
            <BrowserRouter>
              {/* REMOVE ALL PADDING/MARGIN - TRUE FULL WIDTH */}
              <div style={{
                width: '100vw',
                minHeight: '100vh',
                margin: 0,
                padding: 0,
                overflow: 'hidden'
              }}>
                {/* Header - FULL WIDTH */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: '16px 5vw',
                  background: '#1e293b',
                  width: '100vw',
                  boxSizing: 'border-box'
                }}>
                  <nav style={{ display: "flex", gap: '24px' }}>
                    <Link to="/" style={{
                      color: 'white',
                      textDecoration: 'none',
                      fontSize: '16px',
                      fontWeight: '500'
                    }}>
                      Home
                    </Link>
                    <Link to="/merchant" style={{
                      color: 'white',
                      textDecoration: 'none',
                      fontSize: '16px',
                      fontWeight: '500'
                    }}>
                      Merchant Setup
                    </Link>
                    <Link to="/dashboard" style={{
                      color: 'white',
                      textDecoration: 'none',
                      fontSize: '16px',
                      fontWeight: '500'
                    }}>
                      User Dashboard
                    </Link>
                  </nav>
                  <WalletMultiButton />
                </div>

                {/* Routes Container - FULL WIDTH */}
                <div style={{ width: '100vw', boxSizing: 'border-box' }}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/merchant" element={<MerchantSetup />} />
                    <Route path="/dashboard" element={<UserDashboard />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </div>
              </div>
            </BrowserRouter>
          </ErrorBoundary>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}