# Box Cricket Live - Match Management App

A real-time cricket match scoring and management application for Box Cricket and Turf matches.

## Features

- ✅ Live match scoring with real-time updates
- ✅ Support for both Tennis and Leather ball matches  
- ✅ Team & Player management with Joker support
- ✅ Detailed player statistics (runs, balls, strike rate)
- ✅ Bowler statistics (overs, wickets, economy)
- ✅ **Cross-device live sharing** (with Firebase)
- ✅ Mobile-first responsive design
- ✅ Works offline with localStorage

## Quick Start

### Local Development (No sharing)

```sh
# Install dependencies
bun install
# or
npm install

# Start development server
bun run dev
# or
npm run dev
```

Visit `http://localhost:8080` to use the app locally.

## Enable Real-time Sharing (Optional)

To enable cross-device real-time match sharing:

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Firestore Database** (Start in production mode)
4. Go to Project Settings → General → Your apps
5. Add a Web app and copy the config

### 2. Add Firebase Config

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Configure Firestore Rules

In Firebase Console → Firestore Database → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /matches/{matchId} {
      allow read: if true;  // Anyone can read shared matches
      allow write: if true; // Anyone can update (for umpire scoring)
    }
  }
}
```

### 4. Restart Dev Server

```sh
bun run dev
```

Now when you click **Share** in a live match:
- ✅ Match syncs to Firebase
- ✅ Share link works on any device
- ✅ Real-time updates for all viewers
- ✅ **Completely FREE** (Firebase free tier is generous)

## How It Works

**Without Firebase**: 
- Matches stored in browser localStorage
- Share links only work on same device

**With Firebase**:
- Matches stored in both localStorage AND Firestore
- Share links work on any device globally
- All viewers see real-time score updates

## Build for Production

```sh
bun run build
# or
npm run build
```
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
