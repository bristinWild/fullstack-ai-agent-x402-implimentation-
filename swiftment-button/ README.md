# @swiftment/pay-button

A React component for integrating Solana payments using the Swiftment protocol. This button makes it easy to accept USDC payments on Solana with just a few lines of code.

## 🚀 Installation

```bash
npm install @swiftment/pay-button @solana/wallet-adapter-react @solana/web3.js @coral-xyz/anchor
```

or with yarn:

```bash
yarn add @swiftment/pay-button @solana/wallet-adapter-react @solana/web3.js @coral-xyz/anchor
```

## 📋 Prerequisites

Your React application must be wrapped with Solana wallet adapter providers. Install the following packages:

```bash
npm install @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets
```

## 🎯 Basic Usage

```tsx
import React from 'react';
import { SwiftmentPayButton } from '@swiftment/pay-button';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

function App() {
  const wallets = [new PhantomWalletAdapter()];
  
  return (
    <ConnectionProvider endpoint="https://api.devnet.solana.com">
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <SwiftmentPayButton
            merchantAuthority="YOUR_MERCHANT_PUBLIC_KEY"
            amountUsdc={10}
            onSuccess={(signature) => {
              console.log('Payment successful!', signature);
              alert(`Payment successful! Signature: ${signature}`);
            }}
            onError={(error) => {
              console.error('Payment failed:', error);
              alert(`Payment failed: ${error.message}`);
            }}
          />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
```

## 🎨 Advanced Usage

### Custom Styling

```tsx
<SwiftmentPayButton
  merchantAuthority="YOUR_MERCHANT_PUBLIC_KEY"
  amountUsdc={25}
  buttonText="Buy Premium Plan"
  buttonStyle={{
    backgroundColor: '#ff6b6b',
    borderRadius: '8px',
    padding: '16px 32px',
    fontSize: '18px',
    fontWeight: 'bold',
  }}
  className="custom-pay-button"
/>
```

### With Error Handling

```tsx
function PaymentComponent() {
  const [paymentStatus, setPaymentStatus] = useState('idle');

  return (
    <div>
      <SwiftmentPayButton
        merchantAuthority="YOUR_MERCHANT_PUBLIC_KEY"
        amountUsdc={100}
        onSuccess={(signature) => {
          setPaymentStatus('success');
          // Verify payment on your backend
          fetch('/api/verify-payment', {
            method: 'POST',
            body: JSON.stringify({ signature }),
          });
        }}
        onError={(error) => {
          setPaymentStatus('error');
          // Log error to your error tracking service
          console.error('Payment error:', error);
        }}
      />
      {paymentStatus === 'success' && <p>✅ Payment successful!</p>}
      {paymentStatus === 'error' && <p>❌ Payment failed. Please try again.</p>}
    </div>
  );
}
```

## 📖 API Reference

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `merchantAuthority` | `string` | ✅ Yes | - | The merchant's Solana public key (base58 encoded) |
| `amountUsdc` | `number` | ✅ Yes | - | Amount to pay in USDC |
| `onSuccess` | `(signature: string) => void` | No | - | Callback when payment succeeds |
| `onError` | `(error: Error) => void` | No | - | Callback when payment fails |
| `buttonText` | `string` | No | `"Pay {amount} USDC"` | Custom button text |
| `buttonStyle` | `React.CSSProperties` | No | - | Custom inline styles |
| `className` | `string` | No | `''` | Custom CSS class name |
| `disabled` | `boolean` | No | `false` | Disable the button |

## 🔧 Setup Requirements

### 1. Wallet Adapter Setup

Your app must include Solana wallet adapter providers:

```tsx
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';

const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
];

function App() {
  return (
    <ConnectionProvider endpoint={YOUR_RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {/* Your app content */}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
```

### 2. RPC Endpoints

For production, use a reliable RPC endpoint:

- **Devnet**: `https://api.devnet.solana.com`
- **Mainnet**: Use services like [Helius](https://helius.dev), [QuickNode](https://quicknode.com), or [Alchemy](https://alchemy.com)

## 🌐 Network Configuration

```tsx
// For Devnet (testing)
<ConnectionProvider endpoint="https://api.devnet.solana.com">

// For Mainnet (production)
<ConnectionProvider endpoint="YOUR_MAINNET_RPC_URL">
```

## 💡 Example Projects

### E-commerce Checkout

```tsx
function CheckoutButton({ orderId, total }) {
  return (
    <SwiftmentPayButton
      merchantAuthority="YOUR_MERCHANT_KEY"
      amountUsdc={total}
      buttonText={`Pay $${total} USDC`}
      onSuccess={async (signature) => {
        // Update order status
        await fetch('/api/orders/confirm', {
          method: 'POST',
          body: JSON.stringify({ orderId, signature }),
        });
      }}
    />
  );
}
```

### Subscription Payment

```tsx
function SubscribeButton({ plan }) {
  return (
    <SwiftmentPayButton
      merchantAuthority="YOUR_MERCHANT_KEY"
      amountUsdc={plan.price}
      buttonText={`Subscribe to ${plan.name}`}
      onSuccess={(signature) => {
        // Activate subscription
        activateSubscription(plan.id, signature);
      }}
    />
  );
}
```

## 🛠️ Development

To contribute or modify this package:

```bash
# Clone the repository
git clone https://github.com/yourusername/swiftment-button.git
cd swiftment-button

# Install dependencies
npm install

# Build the package
npm run build

# Watch mode for development
npm run dev
```

## 📝 Testing Locally

Before publishing, test your package locally:

```bash
# In the swiftment-button directory
npm link

# In your test project
npm link @swiftment/pay-button
```

## 🐛 Troubleshooting

### Wallet Not Connected Error

Make sure your app is wrapped with `WalletProvider` and the user has connected their wallet.

### Transaction Failed

- Check that the merchant authority is correct
- Ensure the user has sufficient USDC balance
- Verify you're using the correct network (devnet/mainnet)

### TypeScript Errors

Make sure you have the required type definitions installed:

```bash
npm install --save-dev @types/react @types/react-dom
```

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📄 License

MIT © Swiftment Team

## 🔗 Links

- [GitHub Repository](https://github.com/yourusername/swiftment-button)
- [Documentation](https://docs.swiftment.io)
- [Issue Tracker](https://github.com/yourusername/swiftment-button/issues)

## 💬 Support

For questions and support:
- Open an issue on [GitHub](https://github.com/yourusername/swiftment-button/issues)
- Join our [Discord community](https://discord.gg/swiftment)
- Email: bristin.borah.7@gmail.com