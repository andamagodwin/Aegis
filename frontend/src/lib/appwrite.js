import { Client, Account, Databases, ID, Query } from 'appwrite';

// Appwrite Configuration
const client = new Client();

// TODO: Replace with your actual Appwrite project configuration
const APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '68825196001a741829c6'; // Replace with your actual project ID
const DATABASE_ID = '68849b29002ca8d6df15'; // Replace with your actual database ID

// Collection IDs - Replace with your actual collection IDs
export const COLLECTIONS = {
  USER_PROFILES: '68849c690037880d5b93',
  QUERY_HISTORY: '68849ecc001eb3ef734e'
};

client
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

// Export instances
export const account = new Account(client);
export const databases = new Databases(client);
export { ID };

// Helper functions for authentication
export const authService = {
  // Create account
  createAccount: (email, password, name) => {
    return account.create(ID.unique(), email, password, name);
  },

  // Login
  login: (email, password) => {
    return account.createEmailPasswordSession(email, password);
  },

  // Logout
  logout: () => {
    return account.deleteSession('current');
  },

  // Get current user
  getCurrentUser: () => {
    return account.get();
  },

  // Get current session
  getCurrentSession: () => {
    return account.getSession('current');
  }
};

// Helper functions for database operations
export const databaseService = {
  // User Profile operations
  createUserProfile: (userId, data) => {
    return databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.USER_PROFILES,
      userId,
      {
        userId,
        walletAddresses: data.walletAddresses || [],
        watchlistCollections: data.watchlistCollections || [],
        preferences: JSON.stringify(data.preferences || {})
      }
    );
  },

  getUserProfile: (userId) => {
    return databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.USER_PROFILES,
      userId
    ).then(doc => ({
      ...doc,
      preferences: doc.preferences ? JSON.parse(doc.preferences) : {}
    }));
  },

  updateUserProfile: (userId, data) => {
    const updateData = { ...data };
    if (data.preferences) {
      updateData.preferences = JSON.stringify(data.preferences);
    }
    return databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.USER_PROFILES,
      userId,
      updateData
    ).then(doc => ({
      ...doc,
      preferences: doc.preferences ? JSON.parse(doc.preferences) : {}
    }));
  },

  // Query History operations
  createQueryHistory: (userId, query, response) => {
    return databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.QUERY_HISTORY,
      ID.unique(),
      {
        userId,
        query,
        response: JSON.stringify(response),
        timestamp: new Date().toISOString()
      }
    );
  },

  getQueryHistory: (userId, limit = 50) => {
    return databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.QUERY_HISTORY,
      [
        Query.equal('userId', userId),
        Query.orderDesc('timestamp'),
        Query.limit(limit)
      ]
    );
  }
};

export default client;
