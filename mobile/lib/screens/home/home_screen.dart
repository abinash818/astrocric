import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/match.dart';
import '../../services/match_service.dart';
import '../../widgets/match_card.dart';
import '../auth/login_screen.dart';
import '../analysis/my_analysis_screen.dart';
import '../payment/recharge_screen.dart';
import '../../config/theme_constants.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final MatchService _matchService = MatchService();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);

    return Scaffold(
      backgroundColor: AppTheme.warmWhite,
      appBar: AppBar(
        title: Row(
          children: [
            Image.asset('assets/images/logo.png', height: 40),
            const SizedBox(width: 12),
            const Text(
              'S&B ASTRO',
              style: TextStyle(
                fontWeight: FontWeight.w900,
                letterSpacing: 2,
                fontSize: 20,
              ),
            ),
          ],
        ),
        backgroundColor: AppTheme.deepBlue,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.account_circle_rounded, color: AppTheme.primaryGold, size: 28),
            onPressed: () => _showProfileMenu(context, authProvider),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppTheme.primaryGold,
          indicatorWeight: 3,
          labelColor: AppTheme.primaryGold,
          unselectedLabelColor: Colors.white70,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1),
          tabs: const [
            Tab(text: 'UPCOMING'),
            Tab(text: 'LIVE'),
            Tab(text: 'FINISHED'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _MatchListView(
            future: _matchService.getUpcomingMatches(),
            emptyMessage: 'No upcoming matches',
          ),
          _MatchListView(
            future: _matchService.getLiveMatches(),
            emptyMessage: 'No live matches',
          ),
          _MatchListView(
            future: _matchService.getFinishedMatches(),
            emptyMessage: 'No finished matches',
          ),
        ],
      ),
    );
  }

  void _showProfileMenu(BuildContext context, AuthProvider authProvider) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 24),
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: AppTheme.softBlue, shape: BoxShape.circle),
                child: const Icon(Icons.person_rounded, color: AppTheme.deepBlue),
              ),
              title: Text(
                authProvider.user?.name ?? 'User',
                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: AppTheme.deepBlue),
              ),
              subtitle: Text(authProvider.user?.phone ?? '', style: const TextStyle(color: AppTheme.textSecondary)),
            ),
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Divider(),
            ),
            _buildProfileItem(
              icon: Icons.account_balance_wallet_rounded,
              title: 'Astro Coins',
              trailing: Text(
                '🪙 ${authProvider.user?.walletBalance.toStringAsFixed(0) ?? '0'}',
                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: AppTheme.primaryGold),
              ),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, AppTheme.smoothRoute(const RechargeScreen()));
              },
            ),
            _buildProfileItem(
              icon: Icons.history_rounded,
              title: 'My Analysis',
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, AppTheme.smoothRoute(const MyAnalysisScreen()));
              },
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Colors.red.shade50, shape: BoxShape.circle),
                child: const Icon(Icons.logout_rounded, color: Colors.red),
              ),
              title: const Text('Logout', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
              onTap: () async {
                await authProvider.logout();
                Navigator.of(context).pushAndRemoveUntil(
                  AppTheme.smoothRoute(const LoginScreen()),
                  (route) => false,
                );
              },
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileItem({required IconData icon, required String title, Widget? trailing, required VoidCallback onTap}) {
    return ListTile(
      leading: Icon(icon, color: AppTheme.deepBlue),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600, color: AppTheme.deepBlue)),
      trailing: trailing ?? const Icon(Icons.chevron_right_rounded, color: AppTheme.textSecondary),
      onTap: onTap,
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
}

class _MatchListView extends StatelessWidget {
  final Future<List<Match>> future;
  final String emptyMessage;

  const _MatchListView({
    required this.future,
    required this.emptyMessage,
  });

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Match>>(
      future: future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (snapshot.hasError) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48, color: Colors.red),
                const SizedBox(height: 16),
                Text('Error: ${snapshot.error}'),
              ],
            ),
          );
        }

        final matches = snapshot.data ?? [];

        if (matches.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.sports_cricket, size: 48, color: Colors.grey),
                const SizedBox(height: 16),
                Text(emptyMessage),
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () async {
            // Refresh logic
          },
          child: ListView.builder(
            padding: const EdgeInsets.all(8),
            itemCount: matches.length,
            itemBuilder: (context, index) {
              return MatchCard(match: matches[index]);
            },
          ),
        );
      },
    );
  }
}
