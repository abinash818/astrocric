import 'package:firebase_auth/firebase_auth.dart' as firebase;
import 'package:google_sign_in/google_sign_in.dart';
import '../models/user.dart';
import './api_service.dart';

class AuthService {
  final firebase.FirebaseAuth _auth = firebase.FirebaseAuth.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    serverClientId: '491926924357-mppf1ucn9cga82hjv0t4nbgo83r8q3c4.apps.googleusercontent.com',
  );
  final ApiService _apiService = ApiService();

  Stream<firebase.User?> get userChanges => _auth.authStateChanges();

  Future<User?> getProfile() async {
    try {
      final response = await _apiService.get('/auth/profile');
      return User.fromJson(response.data);
    } catch (e) {
      print('AuthService Error: $e');
      rethrow;
    }
  }

  Future<void> syncWithBackend(firebase.User firebaseUser) async {
    final idToken = await firebaseUser.getIdToken();
    if (idToken == null) throw Exception('Could not get ID token');

    print('AuthService: Syncing with backend for ${firebaseUser.email}');
    final response = await _apiService.post('/auth/sync', {
      'idToken': idToken,
      'email': firebaseUser.email,
      'name': firebaseUser.displayName,
      'uid': firebaseUser.uid,
      'photoURL': firebaseUser.photoURL,
    });

    final token = response.data['token'];
    if (token != null) {
      await _apiService.setToken(token);
    }
  }

  Future<firebase.UserCredential?> loginWithEmail(String email, String password) async {
    return await _auth.signInWithEmailAndPassword(
      email: email,
      password: password,
    );
  }

  Future<firebase.UserCredential?> signupWithEmail(String email, String password) async {
    return await _auth.createUserWithEmailAndPassword(
      email: email,
      password: password,
    );
  }

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

  Future<void> resetPassword(String email) async {
    await _auth.sendPasswordResetEmail(email: email);
  }

  Future<void> logout() async {
    try {
      await _googleSignIn.signOut();
      await _auth.signOut();
      await _apiService.clearToken();
    } catch (e) {
      print('Logout Error: $e');
    }
  }
}
