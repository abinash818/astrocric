import 'package:firebase_auth/firebase_auth.dart' as firebase;
import 'package:google_sign_in/google_sign_in.dart';
import '../models/user.dart';
import 'api_service.dart';

class AuthService {
  final firebase.FirebaseAuth _auth = firebase.FirebaseAuth.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn();
  final ApiService _apiService = ApiService();

  // Stream of auth changes
  Stream<firebase.User?> get userChanges => _auth.authStateChanges();

  // Email/Password Signup
  Future<firebase.UserCredential> signupWithEmail(String email, String password) async {
    return await _auth.createUserWithEmailAndPassword(
      email: email,
      password: password,
    );
  }

  // Email/Password Login
  Future<firebase.UserCredential> loginWithEmail(String email, String password) async {
    return await _auth.signInWithEmailAndPassword(
      email: email,
      password: password,
    );
  }

  // Google Login
  Future<firebase.UserCredential?> loginWithGoogle() async {
    final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
    if (googleUser == null) return null;

    final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
    final firebase.AuthCredential credential = firebase.GoogleAuthProvider.credential(
      accessToken: googleAuth.accessToken,
      idToken: googleAuth.idToken,
    );

    return await _auth.signInWithCredential(credential);
  }

  // Password Reset
  Future<void> resetPassword(String email) async {
    await _auth.sendPasswordResetEmail(email: email);
  }

  // Profile Fetch (keeps compatibility with existing model)
  Future<User> getProfile() async {
    final firebaseUser = _auth.currentUser;
    if (firebaseUser == null) throw Exception('No user logged in');
    
    // In a real app, we might also fetch extra data from our backend
    // For now, mapping Firebase user to our local User model
    return User(
      id: firebaseUser.uid,
      email: firebaseUser.email ?? '',
      name: firebaseUser.displayName ?? '',
      phone: firebaseUser.phoneNumber ?? '',
    );
  }

  Future<void> logout() async {
    await _googleSignIn.signOut();
    await _auth.signOut();
    await _apiService.clearToken();
  }
}
