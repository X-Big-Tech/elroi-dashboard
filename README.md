# Elroi - Data Analytics Dashboard

Elroi is a data analytics dashboard that allows users to connect various services and view their data in one centralized location.

## Features

- 🔐 Authentication with Supabase
- 📊 Data visualization and analytics
- 🔄 Connect multiple accounts (Google, Spotify, Discord, etc.)
- 🛡️ Data sharing controls for privacy

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd elroi
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file in the root of your project with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_TWITCH_CLIENT_ID=your_twitch_client_id
```

4. Set up the database
Run the SQL migration script in the Supabase SQL editor:
```sql
-- See supabase/migrations/20240503000000_create_oauth_tables.sql
```

5. Start the development server
```bash
npm run dev
```

## Authentication with Supabase

This project uses [Supabase Authentication](https://supabase.com/docs/guides/auth) for user management.

### Features

- Email/password authentication
- Email confirmation
- Password reset
- Protected routes

### Setting up Supabase Auth

1. Create a Supabase account and project at [supabase.com](https://supabase.com)
2. Enable Email Auth in the Authentication settings
3. Copy your Supabase URL and anon key to your `.env` file

## OAuth Provider Connections

Elroi allows users to connect various third-party services to collect and visualize their data.

### Supported Providers

- Google (Gmail, YouTube)
- Twitch
- Discord
- Spotify
- PlayStation Network

### Setting up OAuth Providers

1. Go to Authentication > Providers in your Supabase dashboard
2. Enable and configure the providers you want to use
3. For each provider, set the redirect URL to:
   ```
   https://your-app-url.com/dashboard?tab=connections
   ```
4. For Twitch, you'll need to get a Client ID from the [Twitch Developer Console](https://dev.twitch.tv/console/apps) and add it to your `.env` file

### Data Collection

When a user connects a provider, Elroi will:

1. Store the OAuth connection details in the `oauth_connections` table
2. Fetch data from the provider's API
3. Store the raw data in the `provider_data` table
4. Extract specific data points for analytics in the `provider_data_points` table

## Project Structure

- `/src` - Source code
  - `/components` - React components
  - `/services` - Service modules including authentication
  - `/lib` - Utility functions and libraries
- `/supabase` - Supabase configuration and migrations
  - `/migrations` - SQL migration scripts

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build 