import React, { useState, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { Send, Loader2, Mic, Paperclip } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  isLoading = false,
  placeholder = "Ask about NFTs, wallets, or collections..."
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (trimmedMessage && !isLoading) {
      onSendMessage(trimmedMessage);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="border-t border-gray-700 bg-gray-900 p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        {/* Additional Actions */}
        <div className="flex space-x-2">
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-300 transition-colors"
            title="Attach file"
          >
            <Paperclip size={20} />
          </button>
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-300 transition-colors"
            title="Voice input"
          >
            <Mic size={20} />
          </button>
        </div>

        {/* Input Field */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 pr-12 border border-gray-600 focus:border-blue-500 focus:outline-none resize-none max-h-30 min-h-[48px]"
            rows={1}
            disabled={isLoading}
          />
          
          {/* Send Button */}
          <button
            type="submit"
            disabled={!message.trim() || isLoading}
            className="absolute right-2 bottom-2 p-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </form>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mt-3">
        <button
          type="button"
          onClick={() => setMessage("Tell me about my wallet")}
          className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full transition-colors"
        >
          Analyze my wallet
        </button>
        <button
          type="button"
          onClick={() => setMessage("What are the trending NFT collections?")}
          className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full transition-colors"
        >
          Trending collections
        </button>
        <button
          type="button"
          onClick={() => setMessage("Help me find NFTs to buy")}
          className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full transition-colors"
        >
          Investment recommendations
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
