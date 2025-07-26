import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email?: string;
  walletAddress?: string;
  name?: string;
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  type?: 'text' | 'wallet-analysis' | 'collection-stats' | 'nft-valuation';
  metadata?: {
    walletAddress?: string;
    collectionId?: string;
    tokenId?: string;
  };
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface AppState {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  
  // Wallet state
  walletAddress: string | null;
  isWalletConnected: boolean;
  
  // Chat state
  chats: Chat[];
  currentChatId: string | null;
  isLoading: boolean;
  
  // UI state
  isSidebarOpen: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setWalletAddress: (address: string | null) => void;
  setAuthenticated: (isAuth: boolean) => void;
  createNewChat: () => string;
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  setCurrentChat: (chatId: string | null) => void;
  deleteChat: (chatId: string) => void;
  setLoading: (loading: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      walletAddress: null,
      isWalletConnected: false,
      chats: [],
      currentChatId: null,
      isLoading: false,
      isSidebarOpen: true,
      
      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setWalletAddress: (address) => set({ 
        walletAddress: address, 
        isWalletConnected: !!address 
      }),
      
      setAuthenticated: (isAuth) => set({ isAuthenticated: isAuth }),
      
      createNewChat: () => {
        const newChat: Chat = {
          id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: 'New Chat',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set((state) => ({
          chats: [newChat, ...state.chats],
          currentChatId: newChat.id,
        }));
        
        return newChat.id;
      },
      
      addMessage: (chatId, messageData) => {
        const message: Message = {
          ...messageData,
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
        };
        
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: [...chat.messages, message],
                  updatedAt: new Date(),
                  title: chat.messages.length === 0 
                    ? messageData.content.slice(0, 50) + (messageData.content.length > 50 ? '...' : '')
                    : chat.title,
                }
              : chat
          ),
        }));
      },
      
      setCurrentChat: (chatId) => set({ currentChatId: chatId }),
      
      deleteChat: (chatId) => {
        set((state) => ({
          chats: state.chats.filter((chat) => chat.id !== chatId),
          currentChatId: state.currentChatId === chatId ? null : state.currentChatId,
        }));
      },
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
      
      logout: () => set({
        user: null,
        isAuthenticated: false,
        walletAddress: null,
        isWalletConnected: false,
        chats: [],
        currentChatId: null,
      }),
    }),
    {
      name: 'aegis-app-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        walletAddress: state.walletAddress,
        isWalletConnected: state.isWalletConnected,
        chats: state.chats,
        currentChatId: state.currentChatId,
      }),
    }
  )
);
