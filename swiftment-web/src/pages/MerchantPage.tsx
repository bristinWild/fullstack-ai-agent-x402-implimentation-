import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Link } from 'react-router-dom';
import { PublicKey } from '@solana/web3.js';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FiCopy, FiExternalLink, FiDollarSign, FiCreditCard, FiUsers, FiSettings } from 'react-icons/fi';

// Mock data for transactions
const mockTransactions = [
  { id: 1, amount: 25.50, status: 'completed', date: '2023-11-10', customer: '0x3f...1a4b' },
  { id: 2, amount: 42.99, status: 'pending', date: '2023-11-09', customer: '0x7d...9c2e' },
  { id: 3, amount: 15.75, status: 'completed', date: '2023-11-08', customer: '0x2a...5f7d' },
];

const MerchantPage = () => {
  const { publicKey } = useWallet();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [merchantAddress, setMerchantAddress] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('sk_test_51NlY...');
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (publicKey) {
      setMerchantAddress(publicKey.toString());
    }
  }, [publicKey]);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!publicKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
              <FiCreditCard className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Merchant Dashboard</h1>
            <p className="text-gray-600 mb-6">Connect your wallet to manage your merchant account</p>
            <div className="flex justify-center">
              <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center">
                <FiUsers className="mr-2" /> Connect Wallet
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate total revenue from mock transactions
  const totalRevenue = mockTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const completedTransactions = mockTransactions.filter(tx => tx.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-blue-600">Swiftment</Link>
              <nav className="ml-10 flex space-x-8">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3 py-2 text-sm font-medium ${activeTab === 'dashboard' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`px-3 py-2 text-sm font-medium ${activeTab === 'transactions' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Transactions
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-3 py-2 text-sm font-medium ${activeTab === 'settings' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Settings
                </button>
              </nav>
            </div>
            <div className="flex items-center">
              <div className="relative mr-4">
                <div className="flex items-center bg-gray-100 rounded-lg px-3 py-1.5">
                  <span className="text-sm text-gray-600 mr-2">Test Mode</span>
                  <div className="w-10 h-5 bg-blue-500 rounded-full flex items-center px-1">
                    <div className="w-3 h-3 bg-white rounded-full transform translate-x-4"></div>
                  </div>
                </div>
              </div>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center">
                <FiDollarSign className="mr-2" />
                Withdraw Funds
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 mt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <FiDollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">${totalRevenue.toFixed(2)}</div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        <span>12%</span>
                        <span className="sr-only"> from last month</span>
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <FiCreditCard className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Transactions</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{mockTransactions.length}</div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        <span>8.2%</span>
                        <span className="sr-only"> from last month</span>
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <FiUsers className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Customers</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">24</div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        <span>4.3%</span>
                        <span className="sr-only"> from last month</span>
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                  <FiSettings className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Conversion Rate</dt>
                    <dd>
                      <div className="text-2xl font-semibold text-gray-900">3.2%</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Transactions</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Your most recent payment activity</p>
            </div>
            <div className="bg-white overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">View</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mockTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        tx_{transaction.id.toString().padStart(6, '0')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.customer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${transaction.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href="#" className="text-blue-600 hover:text-blue-900">View</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* API Integration Section */}
        {activeTab === 'settings' && (
          <div className="mt-8">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">API Integration</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Your merchant API key and integration details</p>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="mb-6">
                  <label htmlFor="merchant-address" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Merchant Address
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      id="merchant-address"
                      readOnly
                      value={merchantAddress}
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 bg-gray-50 text-gray-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <CopyToClipboard text={merchantAddress} onCopy={handleCopy}>
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded-r-md"
                      >
                        {copied ? 'Copied!' : <FiCopy className="h-4 w-4" />}
                      </button>
                    </CopyToClipboard>
                  </div>
                </div>

                <div>
                  <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type={showApiKey ? "text" : "password"}
                      id="api-key"
                      readOnly
                      value={apiKey}
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 bg-gray-50 text-gray-900 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <div className="flex -ml-px">
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {showApiKey ? 'Hide' : 'Show'}
                      </button>
                      <CopyToClipboard text={apiKey} onCopy={handleCopy}>
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded-r-md"
                        >
                          {copied ? 'Copied!' : <FiCopy className="h-4 w-4" />}
                        </button>
                      </CopyToClipboard>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Keep your API key secure and never share it in client-side code.
                  </p>
                </div>

                <div className="mt-8 border-t border-gray-200 pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Integration Example</h4>
                  <div className="bg-gray-800 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-green-400 text-sm">
                      <code>
                        {`// Initialize Swiftment in your application
import { Swiftment } from '@swiftment/sdk';

const swiftment = new Swiftment({
  merchantId: '${merchantAddress}',
  apiKey: '${apiKey}',
  environment: 'test' // or 'production'
});

// Create a payment
const payment = await swiftment.payments.create({
  amount: 10.99,
  currency: 'USD',
  description: 'Example Payment'
});`}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MerchantPage;
