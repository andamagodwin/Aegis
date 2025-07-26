import { Client, Account, Databases } from 'appwrite';

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || 'your-project-id');

export const account = new Account(client);
export const databases = new Databases(client);

export { client };

// Database and collection IDs (you'll need to create these in Appwrite)
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'aegis-db';
export const USERS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID || 'users';
export const CHATS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_CHATS_COLLECTION_ID || 'chats';
