import React from 'react';
import { MessageSquare, Plus, Trash2, Settings, LogOut, Wallet } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useAccount, useDisconnect } from 'wagmi';

const Sidebar: React.FC = () => {
  const {
    chats,
    currentChatId,
    isSidebarOpen,
    user,
    walletAddress,
    createNewChat,
    setCurrentChat,
    deleteChat,
    logout,
  } = useAppStore();

  const { address } = useAccount();
  const { disconnect } = useDisconnect();

  const handleNewChat = () => {
    createNewChat();
  };

  const handleChatSelect = (chatId: string) => {
    setCurrentChat(chatId);
  };

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this chat?')) {
      deleteChat(chatId);
    }
  };

  const handleLogout = () => {
    disconnect();
    logout();
  };

  if (!isSidebarOpen) {
    return null;
  }

  return (
    <div className="flex flex-col h-full w-64 bg-gray-900 text-white border-r border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-blue-400">Aegis NFT</h1>
          <button
            onClick={handleNewChat}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
            title="New Chat"
          >
            <Plus size={16} />
          </button>
        </div>
        
        {/* User/Wallet Info */}
        <div className="space-y-2">
          {user && (
            <div className="text-sm text-gray-300">
              <span className="font-medium">{user.name || user.email}</span>
            </div>
          )}
          {(address || walletAddress) && (
            <div className="flex items-center space-x-2 text-xs text-green-400">
              <Wallet size={12} />
              <span className="font-mono">
                {(address || walletAddress)?.slice(0, 6)}...{(address || walletAddress)?.slice(-4)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {chats.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No chats yet</p>
            <p className="text-xs">Start a new conversation</p>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleChatSelect(chat.id)}
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                currentChatId === chat.id
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <MessageSquare size={14} />
                  <span className="text-sm font-medium truncate">
                    {chat.title}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {chat.messages.length} messages
                </div>
              </div>
              <button
                onClick={(e) => handleDeleteChat(chat.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-600 transition-all"
                title="Delete chat"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 space-y-2">
        <button className="w-full flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-300">
          <Settings size={16} />
          <span className="text-sm">Settings</span>
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-2 p-2 rounded-lg hover:bg-red-600 transition-colors text-gray-300"
        >
          <LogOut size={16} />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
