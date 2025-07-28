import React, { useState } from 'react';
import { 
  UserCircleIcon, 
  WalletIcon, 
  EyeIcon, 
  ClockIcon, 
  ChatBubbleLeftRightIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import useStore from '../store/useStore';
import SmartQuery from '../components/dashboard/SmartQuery';
import WalletManager from '../components/dashboard/WalletManager';
import WatchlistManager from '../components/dashboard/WatchlistManager';
import QueryHistory from '../components/dashboard/QueryHistory';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('query');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
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
      component: SmartQuery,
      description: 'Ask AI about your NFTs'
    },
    {
      id: 'wallets',
      name: 'Wallets',
      icon: WalletIcon,
      component: WalletManager,
      description: 'Manage wallet addresses'
    },
    {
      id: 'watchlist',
      name: 'Watchlist',
      icon: EyeIcon,
      component: WatchlistManager,
      description: 'Track NFT collections'
    },
    {
      id: 'history',
      name: 'History',
      icon: ClockIcon,
      component: QueryHistory,
      description: 'View past conversations'
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || SmartQuery;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" 
            onClick={() => setSidebarOpen(false)} 
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl">
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
      <div className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white transition-all duration-300 ease-in-out z-30 ${
        sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
      }`}>
        <Sidebar 
          user={user} 
          userProfile={userProfile} 
          tabs={tabs} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main content */}
      <div className={`lg:flex lg:flex-col lg:flex-1 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
      }`}>
        {/* Mobile header */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="text-gray-600 hover:text-gray-900 p-1 rounded-md hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" />
              <span className="sr-only">Open sidebar</span>
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
        <main className="flex-1">
          <div className="h-full">
            <div className="h-screen">
              <ActiveComponent />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// Enhanced Sidebar component for desktop
const Sidebar = ({ user, userProfile, tabs, activeTab, setActiveTab, onLogout, collapsed, onToggleCollapse }) => (
  <div className="flex flex-col h-full bg-white">
    {/* Logo and Collapse Toggle */}
    <div className={`flex items-center p-4 border-b border-gray-200 ${collapsed ? 'justify-center' : 'justify-between'}`}>
      {!collapsed && (
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Aegis</h1>
            <p className="text-xs text-gray-500">NFT Portfolio Assistant</p>
          </div>
        </div>
      )}
      
      {collapsed && (
        <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-sm font-bold">A</span>
        </div>
      )}
      
      <button
        onClick={onToggleCollapse}
        className={`p-1 rounded-md hover:bg-gray-100 transition-colors ${collapsed ? 'mt-4' : ''}`}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRightIcon className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronLeftIcon className="h-5 w-5 text-gray-500" />
        )}
      </button>
    </div>

    {/* User info */}
    <div className={`p-4 border-b border-gray-200 ${collapsed ? 'flex justify-center' : ''}`}>
      {!collapsed ? (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
            <UserCircleIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </div>
      ) : (
        <div className="h-10 w-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
          <UserCircleIcon className="h-6 w-6 text-blue-600" />
        </div>
      )}
      
      {/* User stats - only shown when expanded */}
      {!collapsed && (
        <div className="mt-4 grid grid-cols-2 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-lg font-semibold text-gray-900">
              {userProfile?.walletAddresses?.length || 0}
            </p>
            <p className="text-xs text-gray-500">Wallets</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-lg font-semibold text-gray-900">
              {userProfile?.watchlistCollections?.length || 0}
            </p>
            <p className="text-xs text-gray-500">Collections</p>
          </div>
        </div>
      )}
    </div>

    {/* Navigation */}
    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center ${
              collapsed ? 'justify-center p-3' : 'px-4 py-3'
            } rounded-lg transition-all duration-200 group ${
              isActive
                ? 'bg-blue-50 text-blue-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
            title={collapsed ? tab.name : undefined}
            aria-label={tab.name}
          >
            <Icon className={`${collapsed ? 'h-6 w-6' : 'h-5 w-5'} ${
              isActive 
                ? 'text-blue-600' 
                : 'text-gray-500 group-hover:text-gray-700'
            }`} />
            {!collapsed && (
              <div className="ml-3 text-left">
                <p className="text-sm font-medium">{tab.name}</p>
                <p className="text-xs text-gray-500">{tab.description}</p>
              </div>
            )}
          </button>
        );
      })}
    </nav>

    {/* Bottom section */}
    <div className="mt-auto p-4 border-t border-gray-200 space-y-2">
      {!collapsed && (
        <button
          className="w-full flex items-center px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors group"
          onClick={() => setActiveTab('settings')}
        >
          <Cog6ToothIcon className="h-5 w-5 text-gray-500 group-hover:text-gray-700" />
          <span className="ml-3 text-sm font-medium">Settings</span>
        </button>
      )}
      {collapsed && (
        <button
          className="w-full flex items-center justify-center p-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          title="Settings"
          onClick={() => setActiveTab('settings')}
        >
          <Cog6ToothIcon className="h-6 w-6 text-gray-500" />
        </button>
      )}
      
      {!collapsed && (
        <button
          className="w-full flex items-center px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors group"
          onClick={() => setActiveTab('help')}
        >
          <QuestionMarkCircleIcon className="h-5 w-5 text-gray-500 group-hover:text-gray-700" />
          <span className="ml-3 text-sm font-medium">Help & Support</span>
        </button>
      )}
      {collapsed && (
        <button
          className="w-full flex items-center justify-center p-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          title="Help"
          onClick={() => setActiveTab('help')}
        >
          <QuestionMarkCircleIcon className="h-6 w-6 text-gray-500" />
        </button>
      )}
      
      <button
        onClick={onLogout}
        className={`w-full flex items-center ${
          collapsed ? 'justify-center p-3' : 'px-4 py-3'
        } rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-2`}
        title={collapsed ? 'Logout' : undefined}
      >
        <ArrowRightOnRectangleIcon className={`${collapsed ? 'h-6 w-6' : 'h-5 w-5'}`} />
        {!collapsed && <span className="ml-3 text-sm font-medium">Logout</span>}
      </button>
    </div>
  </div>
);

// Enhanced Mobile Sidebar component
const MobileSidebar = ({ user, userProfile, tabs, activeTab, setActiveTab, setSidebarOpen, onLogout }) => (
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
        <div className="h-10 w-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
          <UserCircleIcon className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user?.name || 'User'}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {user?.email || 'user@example.com'}
          </p>
        </div>
      </div>
      
      {/* User stats */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-center">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-lg font-semibold text-gray-900">
            {userProfile?.walletAddresses?.length || 0}
          </p>
          <p className="text-xs text-gray-500">Wallets</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-lg font-semibold text-gray-900">
            {userProfile?.watchlistCollections?.length || 0}
          </p>
          <p className="text-xs text-gray-500">Collections</p>
        </div>
      </div>
    </div>

    {/* Navigation */}
    <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
            <div className="ml-3 text-left">
              <p className="text-sm font-medium">{tab.name}</p>
              <p className="text-xs text-gray-500">{tab.description}</p>
            </div>
          </button>
        );
      })}
    </nav>

    {/* Bottom section */}
    <div className="p-6 border-t border-gray-200 space-y-3">
      <button
        className="w-full flex items-center px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        onClick={() => {
          setActiveTab('settings');
          setSidebarOpen(false);
        }}
      >
        <Cog6ToothIcon className="h-5 w-5 text-gray-500" />
        <span className="ml-3 text-sm font-medium">Settings</span>
      </button>
      
      <button
        className="w-full flex items-center px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        onClick={() => {
          setActiveTab('help');
          setSidebarOpen(false);
        }}
      >
        <QuestionMarkCircleIcon className="h-5 w-5 text-gray-500" />
        <span className="ml-3 text-sm font-medium">Help & Support</span>
      </button>
      
      <button
        onClick={onLogout}
        className="w-full flex items-center px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-2"
      >
        <ArrowRightOnRectangleIcon className="h-5 w-5" />
        <span className="ml-3 text-sm font-medium">Logout</span>
      </button>
    </div>
  </div>
);

export default Dashboard;