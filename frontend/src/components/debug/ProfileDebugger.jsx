import React, { useState } from 'react';
import useStore from '../../store/useStore';
import { databaseService } from '../../lib/appwrite';

const ProfileDebugger = () => {
  const { user, userProfile, loadUserProfile } = useStore();
  const [debugInfo, setDebugInfo] = useState('');

  const handleCreateProfile = async () => {
    if (!user) {
      setDebugInfo('No user logged in');
      return;
    }

    try {
      setDebugInfo('Creating profile...');
      const profile = await databaseService.createUserProfile(user.$id, {
        walletAddresses: [],
        watchlistCollections: [],
        preferences: {}
      });
      setDebugInfo(`Profile created successfully: ${JSON.stringify(profile, null, 2)}`);
      loadUserProfile(user.$id);
    } catch (error) {
      setDebugInfo(`Error creating profile: ${error.message}\n${JSON.stringify(error, null, 2)}`);
    }
  };

  const handleLoadProfile = async () => {
    if (!user) {
      setDebugInfo('No user logged in');
      return;
    }

    try {
      setDebugInfo('Loading profile...');
      await loadUserProfile(user.$id);
      setDebugInfo('Profile loaded successfully');
    } catch (error) {
      setDebugInfo(`Error loading profile: ${error.message}`);
    }
  };

  const handleCheckUser = () => {
    setDebugInfo(`Current user: ${JSON.stringify(user, null, 2)}\n\nCurrent profile: ${JSON.stringify(userProfile, null, 2)}`);
  };

  if (!user) {
    return (
      <div className="p-4 border border-red-300 rounded-lg bg-red-50">
        <p className="text-red-600">No user logged in</p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-blue-300 rounded-lg bg-blue-50 mb-4">
      <h3 className="text-lg font-semibold mb-4 text-blue-800">Profile Debugger</h3>
      
      <div className="space-y-2 mb-4">
        <button
          onClick={handleCheckUser}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
        >
          Check User & Profile
        </button>
        
        <button
          onClick={handleLoadProfile}
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 mr-2"
        >
          Load Profile
        </button>
        
        <button
          onClick={handleCreateProfile}
          className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Create Profile
        </button>
      </div>

      {debugInfo && (
        <div className="bg-gray-100 p-3 rounded border">
          <h4 className="font-semibold mb-2">Debug Info:</h4>
          <pre className="text-xs text-gray-700 whitespace-pre-wrap">{debugInfo}</pre>
        </div>
      )}
    </div>
  );
};

export default ProfileDebugger;
