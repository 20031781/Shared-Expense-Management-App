# Quick Start - Split Expenses Mobile App

## 🚀 Get Started in 5 Minutes

### 1. Prerequisites

Make sure you have:
- ✅ Node.js 18+ installed
- ✅ npm or yarn installed
- ✅ Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### 2. Install Dependencies

```bash
cd mobile
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

**For quick testing**, edit `.env`:
```env
# Use ngrok or your local IP
EXPO_PUBLIC_API_URL=http://192.168.1.100:5000/api

# Temporary Google OAuth (will work for development)
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=your-ios-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=your-android-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=your-web-id.apps.googleusercontent.com
```

### 4. Start the App

```bash
npm start
```

### 5. Open on Your Phone

1. Open Expo Go app
2. Scan the QR code from your terminal
3. Wait for the app to load
4. Done! 🎉

## 📱 Testing Without Google OAuth

If you don't have Google OAuth configured yet, you can:

1. **Skip Authentication** (for development):
   - Comment out auth check in `App.tsx`
   - Go directly to main screens

2. **Use Test Credentials**:
   - Backend should have a test endpoint

## 🔧 Troubleshooting

### Cannot Connect to Backend

```bash
# Find your local IP
# On Mac/Linux:
ifconfig | grep "inet " | grep -v 127.0.0.1

# On Windows:
ipconfig

# Update .env with your IP
EXPO_PUBLIC_API_URL=http://YOUR_IP:5000/api
```

### Expo Go Shows Error

```bash
# Clear cache and restart
expo start -c
```

### Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

## 🎨 What You Can Do

After setup, you can:
- ✅ View lists
- ✅ Create new expense list
- ✅ Add expenses
- ✅ Upload receipt photos
- ✅ Invite members
- ✅ Track reimbursements

## 🔥 Hot Reload

The app automatically reloads when you save files. Edit code and see changes instantly!

## 📚 Next Steps

1. **Configure Google OAuth** - See `README.md` for detailed setup
2. **Build for Production** - See `README.md` for EAS Build instructions
3. **Customize UI** - Edit components in `src/components/`
4. **Add Features** - Extend screens in `src/screens/`

## 💡 Tips

- Shake your device to open developer menu
- Press `r` in terminal to reload
- Press `m` to toggle menu
- Use `console.log()` for debugging - logs appear in terminal

## 📞 Need Help?

Check these files:
- `README.md` - Full documentation
- `../backend/README.md` - Backend setup
- `../TROUBLESHOOTING.md` - Common issues

Happy coding! 🚀
