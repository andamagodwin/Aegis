import React, { useState } from 'react';
import { 
  ClockIcon, 
  ChatBubbleLeftRightIcon, 
  ChevronDownIcon, 
  ChevronUpIcon 
} from '@heroicons/react/24/outline';
import useStore from '../../store/useStore';

const QueryHistory = () => {
  const [expandedItems, setExpandedItems] = useState(new Set());
  
  const { queryHistory, queryHistoryLoading, queryHistoryError } = useStore();

  const toggleExpanded = (index) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24 * 7) {
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const parseResponse = (responseString) => {
    try {
      return JSON.parse(responseString);
    } catch {
      return { response: responseString };
    }
  };

  if (queryHistoryLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-8 w-8 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center">
            <ClockIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Query History</h2>
            <p className="text-sm text-gray-500">Loading your past conversations...</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (queryHistoryError) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="h-8 w-8 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center">
            <ClockIcon className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Query History</h2>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">Failed to load query history: {queryHistoryError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center">
            <ClockIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Query History</h2>
            <p className="text-sm text-gray-500">
              {queryHistory.length} conversation{queryHistory.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {queryHistory.length === 0 ? (
          <div className="text-center py-8">
            <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">No conversations yet</h3>
            <p className="text-sm text-gray-500">
              Start asking questions to see your query history here
            </p>
          </div>
        ) : (
          queryHistory.map((item, index) => {
            const isExpanded = expandedItems.has(index);
            const response = parseResponse(item.response);
            
            return (
              <div
                key={item.$id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Query Header */}
                <button
                  onClick={() => toggleExpanded(index)}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.query}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTimestamp(item.timestamp)}
                    </p>
                  </div>
                  
                  <div className="ml-4 flex-shrink-0">
                    {isExpanded ? (
                      <ChevronUpIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 py-4 border-t border-gray-200 bg-white">
                    {/* User Query */}
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        Your Question
                      </h4>
                      <p className="text-sm text-gray-900 bg-blue-50 rounded-lg p-3">
                        {item.query}
                      </p>
                    </div>

                    {/* AI Response */}
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        AI Response
                      </h4>
                      <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
                        {response.response || 'No response available'}
                      </p>
                    </div>

                    {/* Response Metadata */}
                    {response.action_taken && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="font-medium text-gray-500">Action Taken:</span>
                          <p className="text-gray-700 mt-1">{response.action_taken}</p>
                        </div>
                        
                        {response.data_source && (
                          <div>
                            <span className="font-medium text-gray-500">Data Source:</span>
                            <p className="text-gray-700 mt-1">{response.data_source}</p>
                          </div>
                        )}
                        
                        {response.reasoning && (
                          <div className="md:col-span-2">
                            <details className="group">
                              <summary className="font-medium text-gray-500 cursor-pointer hover:text-gray-700">
                                AI Reasoning (click to expand)
                              </summary>
                              <p className="text-gray-700 mt-2 pl-4 border-l-2 border-gray-200">
                                {response.reasoning}
                              </p>
                            </details>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Info */}
      {queryHistory.length > 0 && (
        <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
          <p className="text-sm text-indigo-700">
            <span className="font-medium">💡 Tip:</span> Your query history helps the AI provide better context-aware responses over time.
          </p>
        </div>
      )}
    </div>
  );
};

export default QueryHistory;
