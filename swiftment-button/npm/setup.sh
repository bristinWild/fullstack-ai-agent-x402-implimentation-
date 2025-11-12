#!/bin/bash

# Swiftment Button Package - Quick Setup Script
# This script helps you set up and publish your npm package

echo "🚀 Swiftment Button Package Setup"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the swiftment-button directory."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔨 Building the package..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors above."
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Test locally:"
echo "   npm link"
echo "   # Then in your test project:"
echo "   npm link @swiftment/pay-button"
echo ""
echo "2. Update package.json with your info:"
echo "   - repository URL"
echo "   - author name"
echo "   - homepage URL"
echo ""
echo "3. Login to npm:"
echo "   npm login"
echo ""
echo "4. Publish to npm:"
echo "   npm publish --access public"
echo ""
echo "5. For updates:"
echo "   npm version patch  # for bug fixes"
echo "   npm version minor  # for new features"
echo "   npm version major  # for breaking changes"
echo "   npm publish"
echo ""
echo "📖 See SWIFTMENT_BUTTON_SETUP_GUIDE.md for detailed instructions"