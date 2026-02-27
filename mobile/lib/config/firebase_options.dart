import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart' show defaultTargetPlatform, TargetPlatform, kIsWeb;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyDLavevOJKNTuVnpco6uCn3FIgNiKdgASg',
    appId: '1:491926924357:web:3a4f8109201c73d2d0072c',
    messagingSenderId: '491926924357',
    projectId: 'astrocricket-826c2',
    authDomain: 'astrocricket-826c2.firebaseapp.com',
    storageBucket: 'astrocricket-826c2.firebasestorage.app',
    measurementId: 'G-YS8WE319M6',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyDLavevOJKNTuVnpco6uCn3FIgNiKdgASg',
    appId: '1:491926924357:android:3a4f8109201c73d2d0072c',
    messagingSenderId: '491926924357',
    projectId: 'astrocricket-826c2',
    storageBucket: 'astrocricket-826c2.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyDLavevOJKNTuVnpco6uCn3FIgNiKdgASg',
    appId: '1:491926924357:ios:3a4f8109201c73d2d0072c',
    messagingSenderId: '491926924357',
    projectId: 'astrocricket-826c2',
    storageBucket: 'astrocricket-826c2.firebasestorage.app',
    iosBundleId: 'com.astrocric',
  );
}
