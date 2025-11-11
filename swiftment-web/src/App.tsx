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

// Keep your existing env names
const RPC = import.meta.env.VITE_RPC as string;
const MERCHANT_AUTH = import.meta.env.VITE_MERCHANT_AUTH as string;

function isPubkey(s: string | undefined): boolean {
  if (!s) return false;
  // base58-ish, quick check; you can skip if your PayButton already validates internally
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s);
}


function Home() {
  const rpc = import.meta.env.VITE_RPC as string | undefined;
  const merchantAuth = import.meta.env.VITE_MERCHANT_AUTH as string | undefined;
  

  return (
    <div style={{ padding: 24 }}>
      <h2>Swiftment Demo</h2>
      {!rpc && <p style={{color: 'tomato'}}>Set <code>VITE_RPC</code> in your .env</p>}
      {!isPubkey(merchantAuth) ? (
        <p style={{color: 'tomato'}}>
          Set a valid <code>VITE_MERCHANT_AUTH</code> (base58 pubkey) in your .env
        </p>
      ) : (
        <PayButton merchantAuthority={merchantAuth!} amountUsdc={2.5} />
      )}
    </div>
  );
}

export default function App() {
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

  console.log("VITE_RPC =", import.meta.env.VITE_RPC);


  return (
    <ConnectionProvider endpoint={RPC}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <ErrorBoundary>
          <BrowserRouter>
            <div style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <WalletMultiButton />
                <nav style={{ display: "flex", gap: 12 }}>
                  <Link to="/">Home</Link>
                  <Link to="/merchant">Merchant Setup</Link>
                  <Link to="/dashboard">User Dashboard</Link>
                </nav>
              </div>

              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/merchant" element={<MerchantSetup />} />
                <Route path="/dashboard" element={<UserDashboard />} />
                {/* optional: redirect unknown routes */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </BrowserRouter>
          </ErrorBoundary>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
