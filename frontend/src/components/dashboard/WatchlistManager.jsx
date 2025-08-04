import React, { useState } from 'react';
import { PlusIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import useStore from '../../store/useStore';

const WatchlistManager = () => {
  const [newCollection, setNewCollection] = useState('');
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  const {
    userProfile,
    addToWatchlist,
    removeFromWatchlist,
    profileLoading
  } = useStore();

  const handleAddCollection = async (e) => {
    e.preventDefault();
    setError('');
    
    const trimmedCollection = newCollection.trim();
    
    if (!trimmedCollection) {
      setError('Please enter a collection name');
      return;
    }
    
    setIsAdding(true);
    
    try {
      const result = await addToWatchlist(trimmedCollection);
      if (result.success) {
        setNewCollection('');
        setError('');
      } else {
        setError(result.error || 'Failed to add collection to watchlist');
      }
    } catch (err) {
      setError('Failed to add collection to watchlist');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveCollection = async (collection) => {
    if (window.confirm(`Are you sure you want to remove "${collection}" from your watchlist?`)) {
      try {
        const result = await removeFromWatchlist(collection);
        if (!result.success) {
          setError(result.error || 'Failed to remove collection from watchlist');
        }
      } catch (err) {
        setError('Failed to remove collection from watchlist');
      }
    }
  };

  const watchlistCollections = userProfile?.watchlistCollections || [];

  // Popular collections for suggestions
  const popularCollections = [
    'Bored Ape Yacht Club',
    'CryptoPunks',
    'Azuki',
    'Doodles',
    'Clone X',
    'Moonbirds',
    'Otherdeeds for Otherside',
    'Art Blocks Curated',
    'World of Women',
    'Cool Cats NFT'
  ];

  const suggestedCollections = popularCollections.filter(
    collection => !watchlistCollections.includes(collection)
  ).slice(0, 5);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <EyeIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Collection Watchlist</h2>
            <p className="text-sm text-gray-500">
              {watchlistCollections.length} collection{watchlistCollections.length !== 1 ? 's' : ''} watched
            </p>
          </div>
        </div>
      </div>

      {/* Add Collection Form */}
      <form onSubmit={handleAddCollection} className="mb-6">
        <div className="flex space-x-3">
          <div className="flex-1">
            <input
              type="text"
              value={newCollection}
              onChange={(e) => setNewCollection(e.target.value)}
              placeholder="Enter NFT collection name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              disabled={isAdding || profileLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isAdding || profileLoading || !newCollection.trim()}
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

      {/* Quick Add Suggestions */}
      {/* {suggestedCollections.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Popular collections:</h3>
          <div className="flex flex-wrap gap-2">
            {suggestedCollections.map((collection) => (
              <button
                key={collection}
                onClick={() => setNewCollection(collection)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                disabled={isAdding || profileLoading}
              >
                + {collection}
              </button>
            ))}
          </div>
        </div>
      )} */}

      {/* Watchlist */}
      <div className="space-y-3">
        {watchlistCollections.length === 0 ? (
          <div className="text-center py-8">
            <EyeIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">No collections in watchlist</h3>
            <p className="text-sm text-gray-500">
              Add NFT collections to track their performance and get personalized insights
            </p>
          </div>
        ) : (
          watchlistCollections.map((collection, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                  <EyeIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {collection}
                  </p>
                  <p className="text-xs text-gray-500">
                    NFT Collection
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => handleRemoveCollection(collection)}
                disabled={profileLoading}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Remove from watchlist"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <h4 className="text-sm font-medium text-purple-900 mb-2">
          How watchlist collections are used:
        </h4>
        <ul className="text-sm text-purple-700 space-y-1">
          <li>• Get AI insights about collections you're interested in</li>
          <li>• Receive personalized recommendations based on your watchlist</li>
          <li>• Track floor prices and market trends</li>
          <li>• Compare similar collections to find opportunities</li>
        </ul>
      </div>
    </div>
  );
};

export default WatchlistManager;
