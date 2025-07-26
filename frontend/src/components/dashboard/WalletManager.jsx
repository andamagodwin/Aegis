import React, { useState } from 'react';
import { PlusIcon, TrashIcon, WalletIcon } from '@heroicons/react/24/outline';
import useStore from '../../store/useStore';

const WalletManager = () => {
  const [newWallet, setNewWallet] = useState('');
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  const {
    userProfile,
    addWalletAddress,
    removeWalletAddress,
    profileLoading
  } = useStore();

  const validateEthereumAddress = (address) => {
    // Basic Ethereum address validation
    const ethRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethRegex.test(address);
  };

  const handleAddWallet = async (e) => {
    e.preventDefault();
    setError('');
    
    const trimmedAddress = newWallet.trim();
    
    if (!trimmedAddress) {
      setError('Please enter a wallet address');
      return;
    }
    
    if (!validateEthereumAddress(trimmedAddress)) {
      setError('Please enter a valid Ethereum address (0x...)');
      return;
    }
    
    setIsAdding(true);
    
    try {
      const result = await addWalletAddress(trimmedAddress);
      if (result.success) {
        setNewWallet('');
        setError('');
      } else {
        setError(result.error || 'Failed to add wallet address');
      }
    } catch (err) {
      setError('Failed to add wallet address');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveWallet = async (address) => {
    if (window.confirm('Are you sure you want to remove this wallet address?')) {
      try {
        const result = await removeWalletAddress(address);
        if (!result.success) {
          setError(result.error || 'Failed to remove wallet address');
        }
      } catch (err) {
        setError('Failed to remove wallet address');
      }
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const walletAddresses = userProfile?.walletAddresses || [];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <WalletIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Wallet Addresses</h2>
            <p className="text-sm text-gray-500">
              {walletAddresses.length} wallet{walletAddresses.length !== 1 ? 's' : ''} connected
            </p>
          </div>
        </div>
      </div>

      {/* Add Wallet Form */}
      <form onSubmit={handleAddWallet} className="mb-6">
        <div className="flex space-x-3">
          <div className="flex-1">
            <input
              type="text"
              value={newWallet}
              onChange={(e) => setNewWallet(e.target.value)}
              placeholder="Enter Ethereum address (0x...)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              disabled={isAdding || profileLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isAdding || profileLoading || !newWallet.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isAdding ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Adding...</span>
              </>
            ) : (
              <>
                <PlusIcon className="h-4 w-4" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
        
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </form>

      {/* Wallet List */}
      <div className="space-y-3">
        {walletAddresses.length === 0 ? (
          <div className="text-center py-8">
            <WalletIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">No wallet addresses</h3>
            <p className="text-sm text-gray-500">
              Add your first Ethereum wallet address to start tracking your NFTs
            </p>
          </div>
        ) : (
          walletAddresses.map((address, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                  <WalletIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {formatAddress(address)}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">
                    {address}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => handleRemoveWallet(address)}
                disabled={profileLoading}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Remove wallet address"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          How wallet addresses are used:
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• AI queries will include data from all connected wallets</li>
          <li>• Portfolio analysis considers all your NFT holdings</li>
          <li>• Your wallet data is never stored on our servers</li>
          <li>• Only public blockchain data is accessed</li>
        </ul>
      </div>
    </div>
  );
};

export default WalletManager;
