# Firebase Configuration (Optional - for Real-time Sharing)

To enable real-time match sharing across devices:

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Firestore Database
3. Create a `.env` file in the project root with your Firebase config:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Without Firebase**: App works locally with localStorage only (no cross-device sharing)
**With Firebase**: Share match links that work across any device in real-time
