import React from 'react';
import { Bot, User, Clock, Wallet, BarChart3, DollarSign } from 'lucide-react';
import type { Message as MessageType } from '../store/useAppStore';

interface MessageProps {
  message: MessageType;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  
  const getMessageIcon = () => {
    if (isUser) return <User size={16} />;
    
    switch (message.type) {
      case 'wallet-analysis':
        return <Wallet size={16} />;
      case 'collection-stats':
        return <BarChart3 size={16} />;
      case 'nft-valuation':
        return <DollarSign size={16} />;
      default:
        return <Bot size={16} />;
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 text-gray-300'
          }`}>
            {getMessageIcon()}
          </div>
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`rounded-2xl px-4 py-3 max-w-full ${
            isUser
              ? 'bg-blue-600 text-white rounded-br-md'
              : 'bg-gray-800 text-gray-100 rounded-bl-md'
          }`}>
            {/* Message metadata */}
            {message.metadata && !isUser && (
              <div className="mb-2 pb-2 border-b border-gray-600">
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <Clock size={12} />
                  <span>
                    {message.type === 'wallet-analysis' && message.metadata.walletAddress && 
                      `Analyzing wallet: ${message.metadata.walletAddress.slice(0, 6)}...${message.metadata.walletAddress.slice(-4)}`
                    }
                    {message.type === 'collection-stats' && message.metadata.collectionId &&
                      `Collection: ${message.metadata.collectionId}`
                    }
                    {message.type === 'nft-valuation' && message.metadata.tokenId &&
                      `NFT #${message.metadata.tokenId}`
                    }
                  </span>
                </div>
              </div>
            )}
            
            {/* Message text */}
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
            
            {/* Timestamp */}
            <div className={`text-xs mt-2 ${
              isUser ? 'text-blue-200' : 'text-gray-500'
            }`}>
              {formatTime(message.timestamp)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;
