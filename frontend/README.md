# Aegis - NFT Portfolio Assistant Frontend

A React frontend application for the Aegis NFT Portfolio Assistant, featuring AI-powered NFT portfolio analysis with Appwrite authentication.

## Features

- **Authentication System**: Complete login/register flow with Appwrite
- **AI Chat Interface**: Chat-like interface to interact with your NFT analysis API
- **Wallet Management**: Add/remove Ethereum wallet addresses for portfolio tracking
- **Collection Watchlist**: Track specific NFT collections you're interested in
- **Query History**: View and replay past AI conversations
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Data Sync**: Persistent user data with Appwrite

## Tech Stack

- **React 18** with TypeScript support
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Appwrite** for authentication and data storage
- **Heroicons** for UI icons
- **React Router** for navigation

## Prerequisites

- Node.js 16+ and npm
- An Appwrite project set up
- FastAPI backend running on `http://localhost:8000`

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Appwrite

1. Create an Appwrite project at [https://cloud.appwrite.io](https://cloud.appwrite.io)
2. Create a database in your project
3. Create two collections:

#### Collection: `user-profiles`
- **Collection ID**: `user-profiles`
- **Attributes**:
  - `userId` (string, required)
  - `walletAddresses` (string[], optional)
  - `watchlistCollections` (string[], optional)
  - `preferences` (object, optional)

#### Collection: `query-history`
- **Collection ID**: `query-history`
- **Attributes**:
  - `userId` (string, required)
  - `query` (string, required)
  - `response` (string, required)
  - `timestamp` (datetime, required)

4. Update the configuration in `src/lib/appwrite.js`:
   ```javascript
   const APPWRITE_PROJECT_ID = 'your-actual-project-id';
   const DATABASE_ID = 'your-actual-database-id';
   ```

### 3. FastAPI Backend Setup

Ensure your FastAPI backend is running on `http://localhost:8000` with the `/smart-query` endpoint that accepts:

```json
{
  "query": "string",
  "user_id": "string (optional)",
  "user_wallets": ["array of wallet addresses"],
  "user_collections": ["array of collection names"]
}
```

And returns:
```json
{
  "response": "string",
  "action_taken": "string",
  "data_source": "string", 
  "reasoning": "string"
}
```

### 4. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
src/
├── lib/
│   └── appwrite.js          # Appwrite configuration and helpers
├── store/
│   └── useStore.js          # Zustand store for global state
├── components/
│   ├── auth/
│   │   ├── Login.jsx        # Login form component
│   │   ├── Register.jsx     # Registration form component
│   │   └── AuthGuard.jsx    # Route protection component
│   └── dashboard/
│       ├── SmartQuery.jsx   # AI chat interface
│       ├── WalletManager.jsx # Wallet address management
│       ├── WatchlistManager.jsx # Collection watchlist
│       └── QueryHistory.jsx # Query history viewer
├── pages/
│   └── Dashboard.jsx        # Main dashboard layout
└── App.tsx                  # Main app component with routing
```

## Key Features Explained

### Authentication Flow
- Users can register with email/password
- Automatic login after registration
- Persistent sessions with Appwrite
- Protected routes with AuthGuard component

### AI Assistant
- Chat-like interface for natural language queries
- Real-time communication with FastAPI backend
- Contextual responses based on user's wallets and watchlist
- Query history automatically saved to Appwrite

### Wallet Management
- Add/remove Ethereum wallet addresses
- Address validation (0x format)
- Addresses are sent to AI for portfolio analysis
- No private keys stored - only public addresses

### Collection Watchlist
- Track NFT collections of interest
- Quick-add buttons for popular collections
- Used by AI for personalized recommendations
- Persistent storage in Appwrite

### Query History
- All AI conversations automatically saved
- Expandable history items with full response details
- Shows AI reasoning and data sources
- Helps provide context for future queries

## Environment Variables

You can optionally create a `.env` file for configuration:

```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
VITE_DATABASE_ID=your-database-id
VITE_API_BASE_URL=http://localhost:8000
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### State Management

The app uses Zustand for state management with the following stores:

- **Authentication state**: User login status, profile data
- **UI state**: Loading states, errors, current selections
- **API state**: Query responses, history, caching

### Styling

- Tailwind CSS with custom configuration
- Responsive design (mobile-first)
- Dark mode ready (can be implemented)
- Consistent color scheme and spacing

## Deployment

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Deploy to Netlify/Vercel

1. Connect your repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables for Appwrite configuration

## Troubleshooting

### Common Issues

1. **Appwrite connection errors**: Verify project ID and endpoint URL
2. **CORS issues**: Ensure your domain is added to Appwrite platform settings
3. **API connection issues**: Verify FastAPI backend is running on correct port
4. **Build errors**: Check all dependencies are installed correctly

### Getting Help

- Check browser console for error messages
- Verify Appwrite project configuration
- Ensure backend API is running and accessible
- Check network tab for failed requests

## License

This project is part of the Aegis NFT Portfolio Assistant system.
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
