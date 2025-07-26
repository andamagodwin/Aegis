
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './lib/wagmi';
import { useAppStore } from './store/useAppStore';
import WalletConnection from './components/WalletConnection';
import Sidebar from './components/Sidebar';
import ChatContainer from './components/ChatContainer';
import './App.css';

const queryClient = new QueryClient();

function AppContent() {
  const { isAuthenticated, isSidebarOpen } = useAppStore();

  if (!isAuthenticated) {
    return <WalletConnection />;
  }

  return (
    <div className="flex h-screen bg-gray-950">
      {isSidebarOpen && <Sidebar />}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatContainer />
      </div>
    </div>
  );
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
