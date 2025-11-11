# 🚀 Swiftment Pay Button

Accept USDC payments on Solana with built-in spending limits and fraud protection.

## ✨ Features

- ✅ One-line integration
- ✅ User spending limits
- ✅ Automatic USDC handling
- ✅ Solana devnet/mainnet support
- ✅ Customizable themes & sizes
- ✅ TypeScript support

## 📦 Installation

```bash
npm install @swiftment/pay-button @solana/wallet-adapter-react @solana/web3.js
```

Or with yarn:

```bash
yarn add @swiftment/pay-button @solana/wallet-adapter-react @solana/web3.js
```

## 🎯 Quick Start

### 1. Wrap your app with Solana Wallet Provider

```tsx
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import '@solana/wallet-adapter-react-ui/styles.css';

function App() {
  const wallets = [new PhantomWalletAdapter()];
  
  return (
    <ConnectionProvider endpoint="https://api.devnet.solana.com">
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <YourApp />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
```

### 2. Add the Pay Button

```tsx
import { SwiftmentPayButton } from '@swiftment/pay-button';

function ProductPage() {
  return (
    <SwiftmentPayButton
      merchantAddress="YOUR_MERCHANT_WALLET_ADDRESS"
      amount={29.99}
      label="Buy Now - $29.99"
      description="Premium Subscription"
      onSuccess={(signature) => {
        console.log('Payment successful!', signature);
        // Redirect user or show success message
      }}
      onError={(error) => {
        console.error('Payment failed:', error);
      }}
    />
  );
}
```

## 🎨 Customization

### Themes

```tsx
// Gradient theme (default)
<SwiftmentPayButton
  merchantAddress="YOUR_ADDRESS"
  amount={10}
  theme="gradient"
/>

// Light theme
<SwiftmentPayButton
  merchantAddress="YOUR_ADDRESS"
  amount={10}
  theme="light"
/>

// Dark theme
<SwiftmentPayButton
  merchantAddress="YOUR_ADDRESS"
  amount={10}
  theme="dark"
/>
```

### Sizes

```tsx
// Small
<SwiftmentPayButton merchantAddress="YOUR_ADDRESS" amount={10} size="small" />

// Medium (default)
<SwiftmentPayButton merchantAddress="YOUR_ADDRESS" amount={10} size="medium" />

// Large
<SwiftmentPayButton merchantAddress="YOUR_ADDRESS" amount={10} size="large" />
```

### Custom Styling

```tsx
<SwiftmentPayButton
  merchantAddress="YOUR_ADDRESS"
  amount={10}
  className="my-custom-class"
  style={{
    background: '#ff6b6b',
    borderRadius: '8px',
    padding: '16px 32px'
  }}
/>
```

## 🔧 Advanced Usage

### With Custom RPC

```tsx
<SwiftmentPayButton
  merchantAddress="YOUR_ADDRESS"
  amount={10}
  rpcUrl="https://your-custom-rpc.com"
/>
```

### With Callbacks

```tsx
<SwiftmentPayButton
  merchantAddress="YOUR_ADDRESS"
  amount={49.99}
  onSuccess={(signature) => {
    // Track conversion
    analytics.track('purchase_completed', { signature });
    
    // Grant access to product
    grantProductAccess(userId);
    
    // Show success modal
    showSuccessModal();
  }}
  onError={(error) => {
    // Log error
    console.error('Payment error:', error);
    
    // Show error message
    showErrorNotification(error.message);
  }}
/>
```

## 📝 Full Example: E-commerce Product Page

```tsx
import { SwiftmentPayButton } from '@swiftment/pay-button';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

function ProductPage() {
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  
  const handleSuccess = (signature: string) => {
    setPurchaseComplete(true);
    
    // Send transaction to your backend
    fetch('/api/verify-payment', {
      method: 'POST',
      body: JSON.stringify({ signature }),
      headers: { 'Content-Type': 'application/json' }
    });
  };

  return (
    <div className="product-page">
      <h1>Premium Course - $99</h1>
      <p>Learn Solana development from scratch</p>
      
      <div style={{ marginBottom: '20px' }}>
        <WalletMultiButton />
      </div>
      
      {purchaseComplete ? (
        <div>
          <h2>✅ Purchase Complete!</h2>
          <p>Check your email for access details.</p>
        </div>
      ) : (
        <SwiftmentPayButton
          merchantAddress="YOUR_MERCHANT_ADDRESS"
          amount={99}
          label="Enroll Now - $99 USDC"
          description="One-time payment, lifetime access"
          theme="gradient"
          size="large"
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
```

## 🌐 Integration Methods

### Option 1: React Component (Recommended)
```tsx
import { SwiftmentPayButton } from '@swiftment/pay-button';

<SwiftmentPayButton merchantAddress="YOUR_ADDRESS" amount={10} />
```

### Option 2: Next.js

```tsx
// app/checkout/page.tsx
'use client';

import { SwiftmentPayButton } from '@swiftment/pay-button';
import dynamic from 'next/dynamic';

const DynamicPayButton = dynamic(
  () => import('@swiftment/pay-button').then(mod => mod.SwiftmentPayButton),
  { ssr: false }
);

export default function CheckoutPage() {
  return <DynamicPayButton merchantAddress="YOUR_ADDRESS" amount={10} />;
}
```

### Option 3: Vanilla JS/HTML (Coming Soon)

```html
<script src="https://unpkg.com/@swiftment/pay-button"></script>
<div id="swiftment-button"></div>
<script>
  SwiftmentPayButton.render('#swiftment-button', {
    merchantAddress: 'YOUR_ADDRESS',
    amount: 10
  });
</script>
```

## 🔐 Security

- User spending limits enforced on-chain
- No private keys ever leave the user's wallet
- All transactions require user approval
- Open-source and auditable

## 🛠 API Reference

### SwiftmentPayButtonProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `merchantAddress` | `string` | ✅ | - | Your merchant wallet address |
| `amount` | `number` | ✅ | - | Payment amount in USDC |
| `label` | `string` | ❌ | "Pay with Swiftment" | Button text |
| `description` | `string` | ❌ | - | Payment description |
| `programId` | `string` | ❌ | Default program | Custom program ID |
| `rpcUrl` | `string` | ❌ | Devnet RPC | Custom RPC endpoint |
| `onSuccess` | `(signature: string) => void` | ❌ | - | Success callback |
| `onError` | `(error: Error) => void` | ❌ | - | Error callback |
| `className` | `string` | ❌ | - | Custom CSS class |
| `style` | `CSSProperties` | ❌ | - | Inline styles |
| `theme` | `'light' \| 'dark' \| 'gradient'` | ❌ | 'gradient' | Button theme |
| `size` | `'small' \| 'medium' \| 'large'` | ❌ | 'medium' | Button size |

## 📄 License

MIT

## 🤝 Support

- [Documentation](https://swiftment.dev/docs)
- [Discord Community](https://discord.gg/swiftment)
- [GitHub Issues](https://github.com/swiftment/pay-button/issues)

## 🌟 Examples

Check out our example implementations:
- [Next.js E-commerce](https://github.com/swiftment/examples/nextjs-ecommerce)
- [React SaaS](https://github.com/swiftment/examples/react-saas)
- [WordPress Plugin](https://github.com/swiftment/examples/wordpress-plugin)

---

Made with ❤️ by the Swiftment team