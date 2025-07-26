import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import useStore from '../../store/useStore';

const SmartQuery = () => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  const {
    executeSmartQuery,
    queryLoading,
    queryError,
    queryResponse,
    currentQuery,
    clearQueryResponse
  } = useStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [queryResponse, queryLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || queryLoading) return;
    
    const query = inputValue.trim();
    setInputValue('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    await executeSmartQuery(query);
  };

  const handleTextareaChange = (e) => {
    setInputValue(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const getActionIcon = (actionType) => {
    // You can expand this with more specific icons based on action types
    return <ChatBubbleLeftRightIcon className="h-5 w-5" />;
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
            <p className="text-sm text-gray-500">Ask me anything about your NFTs</p>
          </div>
        </div>
        {(queryResponse || currentQuery) && (
          <button
            onClick={clearQueryResponse}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            Clear Chat
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!currentQuery && !queryResponse && (
          <div className="text-center py-12">
            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Welcome to your AI NFT Assistant
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Ask me questions about your NFT portfolio, market trends, or get recommendations based on your wallet addresses and watchlist.
            </p>
            <div className="mt-6 text-sm text-gray-400">
              <p className="mb-2">Example queries:</p>
              <ul className="space-y-1">
                <li>"What's the floor price of my watched collections?"</li>
                <li>"Show me the most valuable NFTs in my wallet"</li>
                <li>"What are the trending collections similar to mine?"</li>
              </ul>
            </div>
          </div>
        )}

        {/* User Query */}
        {currentQuery && (
          <div className="flex justify-end">
            <div className="max-w-xs lg:max-w-md bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-3">
              <p className="text-sm">{currentQuery}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {queryLoading && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-600">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* AI Response */}
        {queryResponse && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md">
              <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{queryResponse.response}</p>
              </div>
              
              {/* Response Details */}
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  {getActionIcon(queryResponse.action_taken)}
                  <span>Action: {queryResponse.action_taken}</span>
                </div>
                <div className="text-xs text-gray-500">
                  <span>Source: {queryResponse.data_source}</span>
                </div>
                {queryResponse.reasoning && (
                  <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer hover:text-gray-700">Show reasoning</summary>
                    <p className="mt-1 pl-2 border-l-2 border-gray-200">{queryResponse.reasoning}</p>
                  </details>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {queryError && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md bg-red-50 border border-red-200 rounded-2xl rounded-bl-md px-4 py-3">
              <p className="text-sm text-red-600">
                Sorry, I encountered an error: {queryError}
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your NFT portfolio..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
              style={{ minHeight: '48px', maxHeight: '120px' }}
              disabled={queryLoading}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || queryLoading}
              className="absolute right-2 bottom-2 p-2 text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
        </form>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default SmartQuery;
