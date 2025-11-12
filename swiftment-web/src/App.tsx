import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { WalletContextProvider } from './contexts/WalletContext';
import { PaymentButton } from './components/PaymentButton';
import '@solana/wallet-adapter-react-ui/styles.css';

function Home() {
  const merchantAuth = import.meta.env.VITE_MERCHANT_AUTH as string | undefined;
  
  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(to bottom, #f8fafc, #e2e8f0)',
      padding: '60px 5vw',
      boxSizing: 'border-box',
      margin: 0, // Ensure no default margins
      overflowX: 'hidden' // Prevent horizontal scroll
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

      {/* Features Grid */}
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

      {/* Payment Demo Section */}
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

        <div style={{
          background: '#f8fafc',
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontWeight: '500' }}>Demo Product</span>
            <span style={{ fontWeight: '700', fontSize: '20px' }}>2.5 USDC</span>
          </div>
          <p style={{ color: '#64748b', margin: 0, fontSize: '14px', textAlign: 'left' }}>
            Test payment on devnet
          </p>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {merchantAuth ? (
            <PaymentButton 
              merchantId={merchantAuth}
              amount={2.5}
              productId="demo_product"
              onSuccess={() => alert('Payment successful!')}
              onError={(error) => alert(`Payment failed: ${error.message}`)}
              className="px-6 py-3"
            />
          ) : (
            <p style={{ color: 'red' }}>Please set VITE_MERCHANT_AUTH in your .env file</p>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <WalletContextProvider>
      <WalletModalProvider>
        <Router>
          <div style={{ position: 'relative', minHeight: '100vh' }}>
            <header style={{ 
              backgroundColor: '#1e293b', 
              padding: '1rem 5vw',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              zIndex: 1000
            }}>
              <Link to="/" style={{ 
                color: 'white', 
                textDecoration: 'none',
                fontSize: '1.25rem',
                fontWeight: '600'
              }}>
                Swiftment
              </Link>
              <WalletMultiButton />
            </header>
            
            <Routes>
              <Route path="/" element={<Home />} />
            </Routes>
          </div>
        </Router>
      </WalletModalProvider>
    </WalletContextProvider>
  );
}

export default App;