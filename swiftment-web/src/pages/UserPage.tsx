import { useWallet } from '@solana/wallet-adapter-react';
import { Link } from 'react-router-dom';

const UserPage = () => {
  const { publicKey } = useWallet();

  if (!publicKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold mb-4">User Dashboard</h1>
          <p className="mb-6 text-gray-600">Please connect your wallet to access your dashboard</p>
          <div className="flex justify-center">
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-colors">
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">User Dashboard</h1>
          <div className="flex space-x-4">
            <Link 
              to="/" 
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-gray-500 text-sm font-medium">Total Spent</h3>
            <p className="text-3xl font-bold mt-2">$0.00</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-gray-500 text-sm font-medium">Total Transactions</h3>
            <p className="text-3xl font-bold mt-2">0</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-gray-500 text-sm font-medium">Wallet Address</h3>
            <p className="text-sm font-mono mt-2 text-gray-600 break-all">{publicKey.toString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Your Transactions</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-500 text-center py-8">No transactions yet</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPage;
