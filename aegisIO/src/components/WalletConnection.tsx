import React from 'react';
import { Wallet, Shield, Zap, ChevronRight } from 'lucide-react';
import { useConnect, useAccount, useDisconnect } from 'wagmi';
import { useAppStore } from '../store/useAppStore';

const WalletConnection: React.FC = () => {
  const { connectors, connect, isPending } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { setWalletAddress, setAuthenticated } = useAppStore();

  React.useEffect(() => {
    if (isConnected && address) {
      setWalletAddress(address);
      setAuthenticated(true);
    }
  }, [isConnected, address, setWalletAddress, setAuthenticated]);

  const handleConnect = (connector: typeof connectors[0]) => {
    connect({ connector });
  };

  const handleDisconnect = () => {
    disconnect();
    setWalletAddress(null);
    setAuthenticated(false);
  };

  if (isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-700">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Wallet Connected!</h2>
            <p className="text-gray-300">Your wallet is successfully connected to Aegis NFT Copilot</p>
          </div>

          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Connected Address:</span>
            </div>
            <div className="font-mono text-white text-sm break-all mt-1">
              {address}
            </div>
          </div>

          <div className="space-y-3">
            {/* <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <Zap className="w-5 h-5 mr-2" />
              Start Chatting
            </button> */}
            
            <button
              onClick={handleDisconnect}
              className="w-full bg-gray-600 hover:bg-gray-500 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Disconnect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-700">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Aegis NFT Copilot</h1>
          <p className="text-gray-300">Connect your wallet to start your NFT journey with AI-powered insights</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center space-x-3 text-gray-300">
            <Shield className="w-5 h-5 text-blue-400" />
            <span className="text-sm">Secure wallet connection</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-300">
            <Zap className="w-5 h-5 text-blue-400" />
            <span className="text-sm">Real-time NFT analytics</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-300">
            <ChevronRight className="w-5 h-5 text-blue-400" />
            <span className="text-sm">AI-powered recommendations</span>
          </div>
        </div>

        <div className="space-y-3">
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => handleConnect(connector)}
              disabled={isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-between"
            >
              <span>Connect with {connector.name}</span>
              {isPending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          By connecting your wallet, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default WalletConnection;
