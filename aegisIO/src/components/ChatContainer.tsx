import React, { useEffect, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { apiService } from '../services/api';
import { useAccount } from 'wagmi';
import Message from './Message';
import ChatInput from './ChatInput';

const ChatContainer: React.FC = () => {
  const {
    chats,
    currentChatId,
    isLoading,
    isSidebarOpen,
    walletAddress,
    addMessage,
    setLoading,
    toggleSidebar,
    createNewChat,
  } = useAppStore();

  const { address } = useAccount();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const currentChat = chats.find(chat => chat.id === currentChatId);
  const currentWalletAddress = address || walletAddress;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const analyzeQuery = (query: string) => {
    const lowerQuery = query.toLowerCase();
    
    // Wallet-related keywords
    const walletKeywords = ['wallet', 'my portfolio', 'my nfts', 'my assets', 'my holdings'];
    const isWalletQuery = walletKeywords.some(keyword => lowerQuery.includes(keyword));
    
    // Collection-related keywords
    const collectionKeywords = ['collection', 'floor price', 'stats', 'trending'];
    const isCollectionQuery = collectionKeywords.some(keyword => lowerQuery.includes(keyword));
    
    // NFT valuation keywords
    const valuationKeywords = ['valuation', 'price', 'worth', 'value'];
    const isValuationQuery = valuationKeywords.some(keyword => lowerQuery.includes(keyword));
    
    return {
      isWalletQuery,
      isCollectionQuery,
      isValuationQuery,
    };
  };

  const handleSendMessage = async (message: string) => {
    if (!currentChatId) {
      const newChatId = createNewChat();
      if (!newChatId) return;
    }

    const chatId = currentChatId || createNewChat();
    if (!chatId) return;

    // Add user message
    addMessage(chatId, {
      content: message,
      sender: 'user',
    });

    setLoading(true);

    try {
      // Analyze the query to determine the best approach
      const queryAnalysis = analyzeQuery(message);
      
      let messageType: 'wallet-analysis' | 'collection-stats' | 'nft-valuation' | 'text' = 'text';
      let metadata = {};

      if (queryAnalysis.isWalletQuery && currentWalletAddress) {
        messageType = 'wallet-analysis';
        metadata = { walletAddress: currentWalletAddress };
      } else if (queryAnalysis.isCollectionQuery) {
        messageType = 'collection-stats';
      } else if (queryAnalysis.isValuationQuery) {
        messageType = 'nft-valuation';
      }

      // Make API call
      const response = await apiService.smartQuery(
        message,
        currentWalletAddress || undefined
      );

      if (response.error) {
        throw new Error(response.error);
      }

      // Add agent response
      addMessage(chatId, {
        content: response.response,
        sender: 'agent',
        type: messageType,
        metadata,
      });

    } catch (error) {
      console.error('Error sending message:', error);
      addMessage(chatId, {
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        sender: 'agent',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900">
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-300 transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h2 className="text-lg font-semibold text-white">
            {currentChat?.title || 'Aegis NFT Copilot'}
          </h2>
        </div>
        
        {currentWalletAddress && (
          <div className="text-sm text-gray-400 font-mono">
            {currentWalletAddress.slice(0, 6)}...{currentWalletAddress.slice(-4)}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!currentChat || currentChat.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-gray-800 rounded-full p-6 mb-6">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">AI</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Welcome to Aegis NFT Copilot</h3>
            <p className="text-gray-400 mb-8 max-w-md">
              Your AI-powered assistant for NFT analysis, wallet insights, and investment recommendations.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
              <button
                onClick={() => handleSendMessage("Tell me about my wallet")}
                className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left"
              >
                <h4 className="font-semibold text-white mb-2">Wallet Analysis</h4>
                <p className="text-sm text-gray-400">Get insights about your NFT portfolio and wallet health</p>
              </button>
              <button
                onClick={() => handleSendMessage("What are the trending NFT collections?")}
                className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left"
              >
                <h4 className="font-semibold text-white mb-2">Market Trends</h4>
                <p className="text-sm text-gray-400">Discover trending collections and market movements</p>
              </button>
              <button
                onClick={() => handleSendMessage("Help me find NFTs to buy")}
                className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left"
              >
                <h4 className="font-semibold text-white mb-2">Investment Tips</h4>
                <p className="text-sm text-gray-400">Get personalized NFT investment recommendations</p>
              </button>
            </div>
          </div>
        ) : (
          <>
            {currentChat.messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default ChatContainer;
