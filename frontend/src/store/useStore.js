import { create } from 'zustand';
import { authService, databaseService } from '../lib/appwrite';

const useStore = create((set, get) => ({
  // Authentication state
  user: null,
  isAuthenticated: false,
  authLoading: true,
  authError: null,

  // User profile data
  userProfile: null,
  profileLoading: false,
  profileError: null,

  // Query history
  queryHistory: [],
  queryHistoryLoading: false,
  queryHistoryError: null,

  // Current query state
  currentQuery: '',
  queryResponse: null,
  queryLoading: false,
  queryError: null,

  // Authentication actions
  login: async (email, password) => {
    set({ authLoading: true, authError: null });
    try {
      const session = await authService.login(email, password);
      const user = await authService.getCurrentUser();
      set({ 
        user,
        isAuthenticated: true,
        authLoading: false,
        authError: null
      });
      
      // Load user profile after login
      get().loadUserProfile(user.$id);
      get().loadQueryHistory(user.$id);
      
      return { success: true };
    } catch (error) {
      set({ 
        authLoading: false, 
        authError: error.message || 'Login failed',
        isAuthenticated: false,
        user: null
      });
      return { success: false, error: error.message };
    }
  },

  register: async (email, password, name) => {
    set({ authLoading: true, authError: null });
    try {
      // Create account first
      const user = await authService.createAccount(email, password, name);
      console.log('Account created:', user);
      
      // Auto-login after registration
      await authService.login(email, password);
      const currentUser = await authService.getCurrentUser();
      console.log('User logged in:', currentUser);
      
      // Create user profile with the user's ID
      try {
        const newProfile = await databaseService.createUserProfile(currentUser.$id, {
          walletAddresses: [],
          watchlistCollections: [],
          preferences: {}
        });
        console.log('Profile created:', newProfile);
      } catch (profileError) {
        console.error('Failed to create profile during registration:', profileError);
        // Don't fail the entire registration if profile creation fails
        // We'll create it later when needed
      }
      
      set({ 
        user: currentUser,
        isAuthenticated: true,
        authLoading: false,
        authError: null
      });
      
      // Load user profile (this will create it if it doesn't exist)
      get().loadUserProfile(currentUser.$id);
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      set({ 
        authLoading: false, 
        authError: error.message || 'Registration failed',
        isAuthenticated: false,
        user: null
      });
      return { success: false, error: error.message };
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        authLoading: false,
        authError: null,
        userProfile: null,
        queryHistory: [],
        currentQuery: '',
        queryResponse: null
      });
    }
  },

  checkAuth: async () => {
    set({ authLoading: true });
    try {
      const user = await authService.getCurrentUser();
      set({ 
        user,
        isAuthenticated: true,
        authLoading: false,
        authError: null
      });
      
      // Load user data
      get().loadUserProfile(user.$id);
      get().loadQueryHistory(user.$id);
      
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        authLoading: false,
        authError: null
      });
    }
  },

  // Profile management actions
  loadUserProfile: async (userId) => {
    set({ profileLoading: true, profileError: null });
    try {
      const profile = await databaseService.getUserProfile(userId);
      set({ 
        userProfile: profile,
        profileLoading: false,
        profileError: null
      });
    } catch (error) {
      // If profile doesn't exist (404), create it
      if (error.code === 404 || error.message.includes('Document not found')) {
        console.log('Profile not found, creating new profile for user:', userId);
        try {
          const newProfile = await databaseService.createUserProfile(userId, {
            walletAddresses: [],
            watchlistCollections: [],
            preferences: {}
          });
          set({ 
            userProfile: newProfile,
            profileLoading: false,
            profileError: null
          });
          console.log('New profile created successfully');
        } catch (createError) {
          console.error('Failed to create profile:', createError);
          set({ 
            profileLoading: false,
            profileError: createError.message || 'Failed to create profile'
          });
        }
      } else {
        console.error('Error loading profile:', error);
        set({ 
          profileLoading: false,
          profileError: error.message || 'Failed to load profile'
        });
      }
    }
  },

  updateUserProfile: async (data) => {
    const { user, userProfile } = get();
    if (!user || !userProfile) return { success: false, error: 'No user logged in' };
    
    set({ profileLoading: true, profileError: null });
    try {
      const updatedProfile = await databaseService.updateUserProfile(user.$id, data);
      set({ 
        userProfile: updatedProfile,
        profileLoading: false,
        profileError: null
      });
      return { success: true };
    } catch (error) {
      set({ 
        profileLoading: false,
        profileError: error.message || 'Failed to update profile'
      });
      return { success: false, error: error.message };
    }
  },

  addWalletAddress: async (address) => {
    const { userProfile, user } = get();
    if (!user) return { success: false, error: 'User not authenticated' };
    
    // If no profile exists, try to load it first (this will create it if needed)
    if (!userProfile) {
      console.log('No profile found, attempting to load/create profile');
      await get().loadUserProfile(user.$id);
      // Get the updated profile after loading
      const { userProfile: updatedProfile } = get();
      if (!updatedProfile) {
        return { success: false, error: 'Failed to create user profile' };
      }
    }
    
    const currentProfile = get().userProfile;
    const walletAddresses = [...(currentProfile.walletAddresses || [])];
    if (!walletAddresses.includes(address)) {
      walletAddresses.push(address);
      return get().updateUserProfile({ walletAddresses });
    }
    return { success: false, error: 'Wallet address already exists' };
  },

  removeWalletAddress: async (address) => {
    const { userProfile, user } = get();
    if (!user) return { success: false, error: 'User not authenticated' };
    
    // If no profile exists, try to load it first
    if (!userProfile) {
      await get().loadUserProfile(user.$id);
      const { userProfile: updatedProfile } = get();
      if (!updatedProfile) {
        return { success: false, error: 'Failed to load user profile' };
      }
    }
    
    const currentProfile = get().userProfile;
    const walletAddresses = (currentProfile.walletAddresses || []).filter(addr => addr !== address);
    return get().updateUserProfile({ walletAddresses });
  },

  addToWatchlist: async (collection) => {
    const { userProfile, user } = get();
    if (!user) return { success: false, error: 'User not authenticated' };
    
    // If no profile exists, try to load it first
    if (!userProfile) {
      await get().loadUserProfile(user.$id);
      const { userProfile: updatedProfile } = get();
      if (!updatedProfile) {
        return { success: false, error: 'Failed to load user profile' };
      }
    }
    
    const currentProfile = get().userProfile;
    const watchlistCollections = [...(currentProfile.watchlistCollections || [])];
    if (!watchlistCollections.includes(collection)) {
      watchlistCollections.push(collection);
      return get().updateUserProfile({ watchlistCollections });
    }
    return { success: false, error: 'Collection already in watchlist' };
  },

  removeFromWatchlist: async (collection) => {
    const { userProfile, user } = get();
    if (!user) return { success: false, error: 'User not authenticated' };
    
    // If no profile exists, try to load it first
    if (!userProfile) {
      await get().loadUserProfile(user.$id);
      const { userProfile: updatedProfile } = get();
      if (!updatedProfile) {
        return { success: false, error: 'Failed to load user profile' };
      }
    }
    
    const currentProfile = get().userProfile;
    const watchlistCollections = (currentProfile.watchlistCollections || []).filter(col => col !== collection);
    return get().updateUserProfile({ watchlistCollections });
  },

  // Query history actions
  loadQueryHistory: async (userId) => {
    set({ queryHistoryLoading: true, queryHistoryError: null });
    try {
      const history = await databaseService.getQueryHistory(userId);
      set({ 
        queryHistory: history.documents || [],
        queryHistoryLoading: false,
        queryHistoryError: null
      });
    } catch (error) {
      set({ 
        queryHistoryLoading: false,
        queryHistoryError: error.message || 'Failed to load query history'
      });
    }
  },

  // Smart query actions
  executeSmartQuery: async (query) => {
    const { user, userProfile } = get();
    if (!user) return { success: false, error: 'User not authenticated' };
    
    set({ 
      queryLoading: true, 
      queryError: null,
      currentQuery: query
    });
    
    try {
      const response = await fetch('http://localhost:8000/smart-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          user_id: user.$id,
          user_wallets: userProfile?.walletAddresses || [],
          user_collections: userProfile?.watchlistCollections || []
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Save to query history
      await databaseService.createQueryHistory(user.$id, query, data);
      
      // Reload query history
      get().loadQueryHistory(user.$id);
      
      set({ 
        queryResponse: data,
        queryLoading: false,
        queryError: null
      });
      
      return { success: true, data };
    } catch (error) {
      set({ 
        queryLoading: false,
        queryError: error.message || 'Query failed'
      });
      return { success: false, error: error.message };
    }
  },

  clearQueryResponse: () => {
    set({ 
      queryResponse: null,
      currentQuery: '',
      queryError: null
    });
  }
}));

export default useStore;
