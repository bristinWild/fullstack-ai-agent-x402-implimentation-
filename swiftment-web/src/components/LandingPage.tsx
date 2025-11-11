import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PayButton } from './PayButton';

const MERCHANT_AUTH = import.meta.env.VITE_MERCHANT_AUTH as string;

export default function LandingPage() {
    const { publicKey } = useWallet();
    const [paymentComplete, setPaymentComplete] = useState(false);

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #f8fafc, #e2e8f0)' }}>
            {/* Hero Section */}
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                padding: '60px 24px',
                textAlign: 'center'
            }}>
                <div style={{ marginBottom: '40px' }}>
                    <h1 style={{
                        fontSize: '56px',
                        fontWeight: 'bold',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '16px'
                    }}>
                        Swiftment
                    </h1>
                    <p style={{
                        fontSize: '24px',
                        color: '#64748b',
                        maxWidth: '600px',
                        margin: '0 auto'
                    }}>
                        Accept USDC payments with built-in spending limits and fraud protection on Solana
                    </p>
                </div>

                {/* Features */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '24px',
                    marginBottom: '60px'
                }}>
                    {[
                        { icon: '⚡', title: 'Instant Payments', desc: 'Receive USDC instantly on Solana' },
                        { icon: '🛡️', title: 'Spending Limits', desc: 'Users set daily limits per merchant' },
                        { icon: '🔧', title: 'Easy Integration', desc: 'One-line code integration' },
                        { icon: '💰', title: 'Low Fees', desc: 'Only pay Solana transaction fees' }
                    ].map(feature => (
                        <div key={feature.title} style={{
                            background: 'white',
                            padding: '32px',
                            borderRadius: '16px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                            transition: 'transform 0.2s',
                            cursor: 'default'
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>{feature.icon}</div>
                            <h3 style={{ fontSize: '20px', marginBottom: '8px', fontWeight: '600' }}>
                                {feature.title}
                            </h3>
                            <p style={{ color: '#64748b', margin: 0 }}>{feature.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Demo Section */}
                <div style={{
                    background: 'white',
                    padding: '48px',
                    borderRadius: '24px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    maxWidth: '600px',
                    margin: '0 auto'
                }}>
                    <h2 style={{ fontSize: '32px', marginBottom: '16px' }}>
                        Try It Out
                    </h2>
                    <p style={{ color: '#64748b', marginBottom: '32px' }}>
                        Connect your wallet and make a test payment
                    </p>

                    <div style={{ marginBottom: '24px' }}>
                        <WalletMultiButton style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '14px 28px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }} />
                    </div>

                    {publicKey && (
                        <div>
                            {!paymentComplete ? (
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
                                            <span style={{ fontWeight: '500' }}>Premium Demo Product</span>
                                            <span style={{ fontWeight: '700', fontSize: '20px' }}>2.5 USDC</span>
                                        </div>
                                        <p style={{
                                            color: '#64748b',
                                            margin: 0,
                                            fontSize: '14px',
                                            textAlign: 'left'
                                        }}>
                                            Test payment on Solana Devnet
                                        </p>
                                    </div>

                                    <PayButton
                                        merchantAuthority={MERCHANT_AUTH}
                                        amountUsdc={2.5}
                                    />

                                    <p style={{
                                        marginTop: '16px',
                                        fontSize: '12px',
                                        color: '#94a3b8'
                                    }}>
                                        💡 This is a devnet transaction. No real funds required.
                                    </p>
                                </div>
                            ) : (
                                <div style={{
                                    background: '#ecfdf5',
                                    border: '2px solid #10b981',
                                    padding: '32px',
                                    borderRadius: '12px'
                                }}>
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                                    <h3 style={{ color: '#047857', marginBottom: '8px' }}>
                                        Payment Successful!
                                    </h3>
                                    <p style={{ color: '#065f46', margin: 0 }}>
                                        Your transaction has been confirmed on Solana
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* CTA Section */}
                <div style={{
                    marginTop: '80px',
                    padding: '48px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '24px',
                    color: 'white'
                }}>
                    <h2 style={{ fontSize: '36px', marginBottom: '16px' }}>
                        Ready to Accept Payments?
                    </h2>
                    <p style={{ fontSize: '18px', marginBottom: '32px', opacity: 0.9 }}>
                        Start accepting USDC payments in less than 5 minutes
                    </p>
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
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
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            View Documentation
                        </button>
                        <button style={{
                            background: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            padding: '14px 32px',
                            borderRadius: '12px',
                            border: '2px solid white',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'transform 0.2s'
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            Become a Merchant
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '24px',
                    marginTop: '60px'
                }}>
                    {[
                        { label: 'Transaction Time', value: '<1s' },
                        { label: 'Network Fee', value: '$0.00025' },
                        { label: 'Platform Fee', value: '0%' },
                        { label: 'Uptime', value: '99.99%' }
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
        </div>
    );
}