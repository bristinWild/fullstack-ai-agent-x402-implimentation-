# Swiftment Pay Button - NPM Package Setup & Publishing Guide

## Overview
This guide will help you create and publish `@swiftment/pay-button` as an npm package that users can install and use in their React applications.

## Project Structure

```
swiftment-button/
├── src/
│   ├── components/
│   │   └── PayButton.tsx
│   ├── index.ts
│   └── types.ts
├── package.json
├── tsconfig.json
├── .npmignore
├── README.md
└── LICENSE
```

## Step-by-Step Setup

### 1. Create the Project Directory

```bash
mkdir swiftment-button
cd swiftment-button
npm init -y
```

### 2. Install Dependencies

```bash
# Install peer dependencies (users will need these)
npm install --save-peer-dependencies \
  react \
  react-dom \
  @solana/wallet-adapter-react \
  @solana/web3.js \
  @coral-xyz/anchor

# Install dev dependencies
npm install --save-dev \
  typescript \
  @types/react \
  @types/react-dom \
  @types/node \
  tsup
```

### 3. Configure package.json

Update your `package.json` with the following configuration:

```json
{
  "name": "@swiftment/pay-button",
  "version": "1.0.0",
  "description": "A React component for Solana payments using Swiftment protocol",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "prepublishOnly": "npm run build"
  },
  "keywords": [
    "solana",
    "payment",
    "react",
    "web3",
    "crypto",
    "swiftment"
  ],
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/swiftment-button.git"
  },
  "peerDependencies": {
    "react": ">=17.0.0",
    "react-dom": ">=17.0.0",
    "@solana/wallet-adapter-react": "^0.15.0",
    "@solana/web3.js": "^1.98.0",
    "@coral-xyz/anchor": "^0.32.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.0.0"
  }
}
```

### 4. Create tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react",
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### 5. Create .npmignore

```
# Source files
src/
tsconfig.json

# Development files
*.log
.DS_Store
node_modules/
.vscode/
.idea/

# Test files
*.test.ts
*.test.tsx
__tests__/
```

### 6. Source Files

#### src/types.ts
```typescript
export interface SwiftmentPayButtonProps {
  merchantAuthority: string;
  amountUsdc: number;
  onSuccess?: (signature: string) => void;
  onError?: (error: Error) => void;
  buttonText?: string;
  buttonStyle?: React.CSSProperties;
  disabled?: boolean;
}
```

#### src/components/PayButton.tsx
```typescript
import React, { useState } from 'react';
import * as anchor from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { SwiftmentPayButtonProps } from '../types';

// You'll need to export these from your SDK
import { sdk, getProgram } from "../swiftment";

export function SwiftmentPayButton({
  merchantAuthority,
  amountUsdc,
  onSuccess,
  onError,
  buttonText = `Pay ${amountUsdc} USDC`,
  buttonStyle,
  disabled = false,
}: SwiftmentPayButtonProps) {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!publicKey || !signTransaction) {
      const error = new Error('Wallet not connected');
      onError?.(error);
      return;
    }

    try {
      setLoading(true);
      
      const provider = new anchor.AnchorProvider(
        connection,
        { publicKey, signTransaction } as any,
        {}
      );
      const program = getProgram(provider);
      const api = sdk(program);

      await api.ensureUserAndOptIn(
        publicKey,
        new anchor.web3.PublicKey(merchantAuthority)
      );
      
      const signature = await api.pay(
        publicKey,
        new anchor.web3.PublicKey(merchantAuthority),
        amountUsdc
      );

      onSuccess?.(signature);
    } catch (error) {
      console.error('Payment error:', error);
      onError?.(error as Error);
    } finally {
      setLoading(false);
    }
  };

  const defaultStyle: React.CSSProperties = {
    padding: '12px 24px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#512da8',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    transition: 'all 0.2s',
    ...buttonStyle,
  };

  return (
    <button
      onClick={handleClick}
      style={defaultStyle}
      disabled={disabled || loading || !publicKey}
    >
      {loading ? 'Processing...' : buttonText}
    </button>
  );
}
```

#### src/index.ts
```typescript
export { SwiftmentPayButton } from './components/PayButton';
export type { SwiftmentPayButtonProps } from './types';
```

### 7. Create README.md

```markdown
# @swiftment/pay-button

A React component for integrating Solana payments using the Swiftment protocol.

## Installation

```bash
npm install @swiftment/pay-button @solana/wallet-adapter-react @solana/web3.js @coral-xyz/anchor
```

## Usage

```tsx
import { SwiftmentPayButton } from '@swiftment/pay-button';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

function App() {
  return (
    <ConnectionProvider endpoint="https://api.devnet.solana.com">
      <WalletProvider wallets={[]}>
        <WalletModalProvider>
          <SwiftmentPayButton
            merchantAuthority="YOUR_MERCHANT_PUBLIC_KEY"
            amountUsdc={10}
            onSuccess={(signature) => {
              console.log('Payment successful!', signature);
            }}
            onError={(error) => {
              console.error('Payment failed:', error);
            }}
          />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `merchantAuthority` | `string` | Yes | The merchant's Solana public key |
| `amountUsdc` | `number` | Yes | Amount in USDC to pay |
| `onSuccess` | `(signature: string) => void` | No | Callback when payment succeeds |
| `onError` | `(error: Error) => void` | No | Callback when payment fails |
| `buttonText` | `string` | No | Custom button text |
| `buttonStyle` | `React.CSSProperties` | No | Custom button styles |
| `disabled` | `boolean` | No | Disable the button |

## Requirements

Your app must be wrapped with Solana wallet adapter providers:
- `ConnectionProvider`
- `WalletProvider`
- `WalletModalProvider` (recommended)

## License

MIT
```

### 8. Create LICENSE

```
MIT License

Copyright (c) 2025 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Publishing to NPM

### 1. Create an NPM Account
```bash
npm login
```

### 2. Build Your Package
```bash
npm run build
```

### 3. Test Locally Before Publishing
```bash
# In your swiftment-button directory
npm link

# In another project where you want to test
npm link @swiftment/pay-button
```

### 4. Publish to NPM
```bash
# For first time publishing
npm publish --access public

# For updates
npm version patch  # or minor, or major
npm publish
```

## Version Management

- **Patch** (1.0.0 → 1.0.1): Bug fixes
- **Minor** (1.0.0 → 1.1.0): New features, backward compatible
- **Major** (1.0.0 → 2.0.0): Breaking changes

```bash
npm version patch
npm version minor
npm version major
```

## Important Notes

1. **SDK Dependencies**: You need to extract your `sdk` and `getProgram` functions into this package or make them importable.

2. **Scoped Package**: The `@swiftment/` prefix means you need to publish with `--access public`.

3. **Testing**: Always test your package locally with `npm link` before publishing.

4. **Versioning**: Follow semantic versioning (semver).

5. **Documentation**: Keep your README updated with examples and API documentation.

## Next Steps

1. Set up your GitHub repository
2. Add CI/CD for automated publishing
3. Create example projects
4. Add unit tests
5. Set up a documentation website

## Support

For issues and questions, please open an issue on GitHub.