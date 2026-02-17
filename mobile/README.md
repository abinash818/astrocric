# Astrocric Mobile App

Flutter mobile application for Astrocric cricket prediction platform.

## Setup

1. Install Flutter SDK: https://flutter.dev/docs/get-started/install
2. Run `flutter pub get` to install dependencies
3. Configure environment variables in `lib/config/constants.dart`
4. Run `flutter run` to start the app

## Build for Android

```bash
flutter build apk --release
```

## Features

- OTP-based authentication
- Browse upcoming, live, and finished matches
- Purchase cricket predictions
- PhonePe payment integration
- View purchased predictions
- User profile management

## Project Structure

```
lib/
├── main.dart
├── app.dart
├── config/
├── models/
├── services/
├── providers/
├── screens/
└── widgets/
```
