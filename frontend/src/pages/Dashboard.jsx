import React, { useState } from 'react';
import { 
  UserCircleIcon, 
  WalletIcon, 
  EyeIcon, 
  ClockIcon, 
  ChatBubbleLeftRightIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import useStore from '../store/useStore';
import SmartQuery from '../components/dashboard/SmartQuery';
import WalletManager from '../components/dashboard/WalletManager';
import WatchlistManager from '../components/dashboard/WatchlistManager';
import QueryHistory from '../components/dashboard/QueryHistory';
import ProfileDebugger from '../components/debug/ProfileDebugger';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('query');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const { user, userProfile, logout } = useStore();

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await logout();
    }
  };

  const tabs = [
    {
      id: 'query',
      name: 'AI Assistant',
      icon: ChatBubbleLeftRightIcon,
      component: SmartQuery
    },
    {
      id: 'wallets',
      name: 'Wallets',
      icon: WalletIcon,
      component: WalletManager
    },
    {
      id: 'watchlist',
      name: 'Watchlist',
      icon: EyeIcon,
      component: WatchlistManager
    },
    {
      id: 'history',
      name: 'History',
      icon: ClockIcon,
      component: QueryHistory
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || SmartQuery;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            <MobileSidebar 
              user={user} 
              userProfile={userProfile} 
              tabs={tabs} 
              activeTab={activeTab} 
              setActiveTab={setActiveTab}
              setSidebarOpen={setSidebarOpen}
              onLogout={handleLogout}
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white">
        <Sidebar 
          user={user} 
          userProfile={userProfile} 
          tabs={tabs} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
        />
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Mobile header */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="text-gray-600 hover:text-gray-900"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">A</span>
              </div>
              <h1 className="text-lg font-semibold text-gray-900">Aegis</h1>
            </div>
            
            <div className="w-6" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <ProfileDebugger />
            <ActiveComponent />
          </div>
        </main>
      </div>
    </div>
  );
};

// Sidebar component for desktop
const Sidebar = ({ user, userProfile, tabs, activeTab, setActiveTab, onLogout }) => (
  <div className="flex flex-col h-full">
    {/* Logo */}
    <div className="flex items-center space-x-3 p-6 border-b border-gray-200">
      <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
        <span className="text-white text-lg font-bold">A</span>
      </div>
      <div>
        <h1 className="text-xl font-bold text-gray-900">Aegis</h1>
        <p className="text-sm text-gray-500">NFT Portfolio Assistant</p>
      </div>
    </div>

    {/* User info */}
    <div className="p-6 border-b border-gray-200">
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
          <UserCircleIcon className="h-6 w-6 text-gray-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user?.name || 'User'}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {user?.email}
          </p>
        </div>
      </div>
      
      {/* Quick stats */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-center">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-lg font-semibold text-blue-600">
            {userProfile?.walletAddresses?.length || 0}
          </p>
          <p className="text-xs text-blue-600">Wallets</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <p className="text-lg font-semibold text-purple-600">
            {userProfile?.watchlistCollections?.length || 0}
          </p>
          <p className="text-xs text-purple-600">Watchlist</p>
        </div>
      </div>
    </div>

    {/* Navigation */}
    <nav className="flex-1 p-6 space-y-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{tab.name}</span>
          </button>
        );
      })}
    </nav>

    {/* Logout */}
    <div className="p-6 border-t border-gray-200">
      <button
        onClick={onLogout}
        className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        <ArrowRightOnRectangleIcon className="h-5 w-5" />
        <span>Log out</span>
      </button>
    </div>
  </div>
);

// Mobile sidebar component
const MobileSidebar = ({ user, userProfile, tabs, activeTab, setActiveTab, setSidebarOpen, onLogout }) => {
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  return <Sidebar 
    user={user} 
    userProfile={userProfile} 
    tabs={tabs} 
    activeTab={activeTab} 
    setActiveTab={handleTabChange}
    onLogout={onLogout}
  />;
};

export default Dashboard;
