# Split Expenses - Mobile App

React Native + Expo mobile application for managing shared expenses.

## Features

- Google OAuth Authentication
- Create and manage expense lists
- Add expenses with photo receipts
- Invite members via email or WhatsApp
- Track reimbursements
- Offline support (coming soon)
- Push notifications

## Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (for testing)

## Setup

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and configure:
- `EXPO_PUBLIC_API_URL` - Your backend API URL
- Google OAuth Client IDs (get from Google Cloud Console)

### 3. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Sign-In API
4. Create OAuth 2.0 credentials:
   - **iOS**: iOS client ID
   - **Android**: Android client ID (use SHA-1 from Expo)
   - **Web**: Web client ID

To get Android SHA-1 for Expo:
```bash
expo credentials:manager -p android
```

### 4. Start Development Server

```bash
npm start
```

This will start Expo Dev Tools. You can:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app

## Project Structure

```
mobile/
├── src/
│   ├── components/      # Reusable UI components
│   ├── screens/         # Screen components
│   ├── services/        # API and business logic
│   ├── store/           # Zustand state management
│   ├── navigation/      # Navigation configuration
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript types
│   └── utils/           # Utility functions
├── App.tsx              # Main app entry point
├── app.json             # Expo configuration
└── package.json         # Dependencies
```

## Development

### Run on iOS Simulator

```bash
npm run ios
```

Requires Xcode on macOS.

### Run on Android Emulator

```bash
npm run android
```

Requires Android Studio.

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Building for Production

### 1. Configure EAS (Expo Application Services)

```bash
npm install -g eas-cli
eas login
eas build:configure
```

### 2. Build Android APK

```bash
eas build --platform android --profile preview
```

### 3. Build iOS IPA

```bash
eas build --platform ios --profile preview
```

Requires Apple Developer account ($99/year).

## Backend API

The app connects to the backend API. Make sure:
1. Backend is running (see `../backend/README.md`)
2. Backend URL is correctly set in `.env`
3. Backend is accessible from your device (use ngrok for local testing)

### Using ngrok for Local Testing

```bash
# In another terminal
ngrok http 5000

# Copy the https URL to .env
EXPO_PUBLIC_API_URL=https://your-id.ngrok.io/api
```

## Troubleshooting

### Cannot connect to API

- Check backend is running
- Verify API URL in `.env`
- For local testing, use your computer's IP or ngrok
- Check firewall settings

### Google Sign-In not working

- Verify Client IDs in `.env`
- Check OAuth consent screen is configured
- For Android, verify SHA-1 certificate
- For iOS, verify bundle identifier

### Module resolution errors

```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
expo start -c
```

## Testing on Real Device

### Using Expo Go (Easiest)

1. Install Expo Go from App Store/Play Store
2. Run `npm start`
3. Scan QR code with Expo Go

### Using Development Build

For features not supported by Expo Go (like custom native code):

```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

## Features Roadmap

- [x] Authentication with Google
- [x] Lists management
- [x] Expenses CRUD
- [x] Photo receipts
- [x] Member invitations
- [ ] Offline support with SQLite
- [ ] Push notifications
- [ ] Expense validation workflow
- [ ] Reimbursements view
- [ ] Profile settings
- [ ] Dark mode
- [ ] Multi-language support

## Tech Stack

- **Framework**: React Native + Expo
- **Language**: TypeScript
- **Navigation**: React Navigation
- **State Management**: Zustand
- **API Client**: Axios
- **Data Fetching**: React Query
- **Storage**: Expo SecureStore + AsyncStorage
- **Authentication**: Expo Auth Session (Google OAuth)
- **UI Components**: Custom components
- **Icons**: @expo/vector-icons

## License

See LICENSE.md in project root
