/**
 * Aegis Frontend Configuration
 * 
 * Instructions:
 * 1. Copy this file to src/lib/config.js (optional)
 * 2. Update the values with your actual Appwrite configuration
 * 3. Import and use these values in appwrite.js instead of hardcoded values
 */

// Appwrite Configuration
export const APPWRITE_CONFIG = {
  endpoint: 'https://cloud.appwrite.io/v1',
  projectId: 'YOUR_PROJECT_ID', // Replace with your actual project ID
  databaseId: 'YOUR_DATABASE_ID', // Replace with your actual database ID
};

// Collection IDs
export const COLLECTIONS = {
  USER_PROFILES: 'user-profiles',
  QUERY_HISTORY: 'query-history'
};

// API Configuration
export const API_CONFIG = {
  baseUrl: 'https://aegis.andama.me',
  endpoints: {
    smartQuery: '/smart-query'
  }
};

// App Configuration
export const APP_CONFIG = {
  name: 'Aegis',
  description: 'NFT Portfolio Assistant',
  version: '1.0.0'
};

/**
 * Example usage in appwrite.js:
 * 
 * import { APPWRITE_CONFIG, COLLECTIONS } from './config';
 * 
 * client
 *   .setEndpoint(APPWRITE_CONFIG.endpoint)
 *   .setProject(APPWRITE_CONFIG.projectId);
 */
