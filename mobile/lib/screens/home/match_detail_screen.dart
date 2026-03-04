import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/match.dart';
import '../../services/match_service.dart';
import '../../config/theme_constants.dart';

class MatchDetailScreen extends StatefulWidget {
  final int matchId;

  const MatchDetailScreen({Key? key, required this.matchId}) : super(key: key);

  @override
  State<MatchDetailScreen> createState() => _MatchDetailScreenState();
}

class _MatchDetailScreenState extends State<MatchDetailScreen> with SingleTickerProviderStateMixin {
  final MatchService _matchService = MatchService();
  late Future<Match> _matchFuture;
  late Future<Map<String, dynamic>> _scorecardFuture;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _matchFuture = _matchService.getMatchDetails(widget.matchId);
    _scorecardFuture = _matchService.getMatchScorecard(widget.matchId);
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.warmWhite,
      appBar: AppBar(
        title: const Text(
          'MATCH CENTER',
          style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.5, fontSize: 18),
        ),
        backgroundColor: AppTheme.deepBlue,
        foregroundColor: Colors.white,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppTheme.primaryGold,
          indicatorWeight: 3,
          labelColor: AppTheme.primaryGold,
          unselectedLabelColor: Colors.white70,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1),
          tabs: const [
            Tab(text: 'SCORECARD'),
            Tab(text: 'INFO'),
          ],
        ),
      ),
      body: FutureBuilder<Match>(
        future: _matchFuture,
        builder: (context, matchSnapshot) {
          if (matchSnapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (matchSnapshot.hasError) {
            return Center(child: Text('Error: ${matchSnapshot.error}'));
          }

          final match = matchSnapshot.data!;

          return Column(
            children: [
              _buildMatchHeader(match),
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildScorecardTab(),
                    _buildInfoTab(match),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildMatchHeader(Match match) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      decoration: const BoxDecoration(
        color: AppTheme.deepBlue,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(32)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  match.matchType.toUpperCase(),
                  style: const TextStyle(color: AppTheme.primaryGold, fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 1.5),
                ),
              ),
              const SizedBox(width: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  match.status.toUpperCase(),
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 1.5),
                ),
              ),
            ],
          ),
          const SizedBox(height: 32),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              Expanded(child: _buildTeamInfo(match.team1, match.team1FlagUrl, match.team1Score)),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  'VS',
                  style: TextStyle(color: Colors.white24, fontSize: 32, fontWeight: FontWeight.w900),
                ),
              ),
              Expanded(child: _buildTeamInfo(match.team2, match.team2FlagUrl, match.team2Score)),
            ],
          ),
          if (match.result != null) ...[
            const SizedBox(height: 32),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.08),
                borderRadius: BorderRadius.circular(15),
                border: Border.all(color: Colors.white.withOpacity(0.1)),
              ),
              child: Text(
                match.result!,
                style: const TextStyle(color: Colors.white, fontStyle: FontStyle.italic, fontWeight: FontWeight.w500),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTeamInfo(String name, String? flagUrl, String? score) {
    return Column(
      children: [
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            color: Colors.white,
            shape: BoxShape.circle,
            border: Border.all(color: AppTheme.primaryGold.withOpacity(0.3), width: 2),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 12, offset: const Offset(0, 4)),
            ],
          ),
          child: flagUrl != null
              ? ClipOval(
                  child: Image.network(
                    flagUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => const Icon(Icons.sports_cricket_rounded, color: AppTheme.deepBlue, size: 28),
                  ),
                )
              : const Icon(Icons.sports_cricket_rounded, color: AppTheme.deepBlue, size: 28),
        ),
        const SizedBox(height: 12),
        Text(
          name,
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13),
          textAlign: TextAlign.center,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        if (score != null) ...[
          const SizedBox(height: 6),
          Text(
            score,
            style: const TextStyle(color: AppTheme.primaryGold, fontSize: 18, fontWeight: FontWeight.w900),
          ),
        ],
      ],
    );
  }

  Widget _buildScorecardTab() {
    return FutureBuilder<Map<String, dynamic>>(
      future: _scorecardFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        
        if (snapshot.hasError) {
           // It's possible scorecard is not available
           return Center(
             child: Column(
               mainAxisAlignment: MainAxisAlignment.center,
               children: [
                 const Icon(Icons.description_outlined, size: 48, color: Colors.grey),
                 const SizedBox(height: 16),
                 const Text('Detailed scorecard not available yet'),
                 if (snapshot.error.toString().contains('404'))
                    const Text('For live matches, please wait for data sync.', style: TextStyle(color: Colors.grey)),
               ],
             ),
           );
        }

        final data = snapshot.data;
        if (data == null || data['scorecard'] == null) {
           return const Center(child: Text('No scorecard data'));
        }

        final List<dynamic> scorecard = data['scorecard'];

        return ListView.builder(
          itemCount: scorecard.length,
          itemBuilder: (context, index) {
            final inning = scorecard[index];
            return _buildInningCard(inning);
          },
        );
      },
    );
  }

  Widget _buildInningCard(Map<String, dynamic> inning) {
    final title = inning['inning'] ?? 'Inning';
    final batting = inning['batting'] as List<dynamic>? ?? [];
    final bowling = inning['bowling'] as List<dynamic>? ?? [];

    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.primaryGold.withOpacity(0.15)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: ExpansionTile(
        title: Text(
          title.toUpperCase(),
          style: const TextStyle(fontWeight: FontWeight.w900, color: AppTheme.deepBlue, fontSize: 13, letterSpacing: 1),
        ),
        iconColor: AppTheme.primaryGold,
        collapsedIconColor: AppTheme.primaryGold,
        initiallyExpanded: true,
        children: [
          if (batting.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(color: AppTheme.softBlue, borderRadius: BorderRadius.circular(6)),
                child: const Text('BATTING', style: TextStyle(fontWeight: FontWeight.w900, color: AppTheme.deepBlue, fontSize: 10, letterSpacing: 1)),
              ),
            ),
            _buildBattingTable(batting),
          ],
          if (bowling.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(color: AppTheme.softBlue, borderRadius: BorderRadius.circular(6)),
                child: const Text('BOWLING', style: TextStyle(fontWeight: FontWeight.w900, color: AppTheme.deepBlue, fontSize: 10, letterSpacing: 1)),
              ),
            ),
            _buildBowlingTable(bowling),
            const SizedBox(height: 16),
          ],
        ],
      ),
    );
  }

  Widget _buildBattingTable(List<dynamic> batting) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        columnSpacing: 24,
        headingRowHeight: 45,
        headingTextStyle: const TextStyle(fontWeight: FontWeight.w900, color: AppTheme.textSecondary, fontSize: 11, letterSpacing: 0.5),
        columns: const [
          DataColumn(label: Text('BATTER')),
          DataColumn(label: Text('R', style: TextStyle(color: AppTheme.deepBlue))),
          DataColumn(label: Text('B')),
          DataColumn(label: Text('4s')),
          DataColumn(label: Text('6s')),
          DataColumn(label: Text('SR')),
        ],
        rows: batting.map((b) {
          final name = b['batsman']?['name'] ?? 'Unknown';
          final dismissal = b['dismissal-text'] ?? '';
          
          return DataRow(cells: [
            DataCell(
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(name, style: const TextStyle(fontWeight: FontWeight.w800, color: AppTheme.deepBlue, fontSize: 13)),
                  if (dismissal.isNotEmpty)
                    Text(dismissal, style: const TextStyle(fontSize: 9, color: AppTheme.textSecondary, fontWeight: FontWeight.w500)),
                ],
              )
            ),
            DataCell(Text(b['r'].toString(), style: const TextStyle(fontWeight: FontWeight.w900, color: AppTheme.deepBlue, fontSize: 14))),
            DataCell(Text(b['b'].toString(), style: const TextStyle(fontSize: 13))),
            DataCell(Text(b['4s'].toString(), style: const TextStyle(fontSize: 13))),
            DataCell(Text(b['6s'].toString(), style: const TextStyle(fontSize: 13))),
            DataCell(Text(b['sr'].toString(), style: const TextStyle(fontSize: 13))),
          ]);
        }).toList(),
      ),
    );
  }

  Widget _buildBowlingTable(List<dynamic> bowling) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        columnSpacing: 24,
        headingRowHeight: 45,
        headingTextStyle: const TextStyle(fontWeight: FontWeight.w900, color: AppTheme.textSecondary, fontSize: 11, letterSpacing: 0.5),
        columns: const [
          DataColumn(label: Text('BOWLER')),
          DataColumn(label: Text('O')),
          DataColumn(label: Text('M')),
          DataColumn(label: Text('R')),
          DataColumn(label: Text('W', style: TextStyle(color: AppTheme.deepBlue))),
          DataColumn(label: Text('ECO')),
        ],
        rows: bowling.map((b) {
          final name = b['bowler']?['name'] ?? 'Unknown';
          return DataRow(cells: [
            DataCell(Text(name, style: const TextStyle(fontWeight: FontWeight.w800, color: AppTheme.deepBlue, fontSize: 13))),
            DataCell(Text(b['o'].toString(), style: const TextStyle(fontSize: 13))),
            DataCell(Text(b['m'].toString(), style: const TextStyle(fontSize: 13))),
            DataCell(Text(b['r'].toString(), style: const TextStyle(fontSize: 13))),
            DataCell(Text(b['w'].toString(), style: const TextStyle(fontWeight: FontWeight.w900, color: AppTheme.deepBlue, fontSize: 14))),
            DataCell(Text(b['eco'].toString(), style: const TextStyle(fontSize: 13))),
          ]);
        }).toList(),
      ),
    );
  }

  Widget _buildInfoTab(Match match) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        _buildInfoRow(Icons.location_on_rounded, 'VENUE', match.venue),
        const SizedBox(height: 16),
        _buildInfoRow(Icons.calendar_today_rounded, 'DATE & TIME', DateFormat('EEEE, MMM dd, yyyy • hh:mm a').format(match.matchDate.toLocal())),
        const SizedBox(height: 16),
        _buildInfoRow(Icons.analytics_rounded, 'MATCH STATUS', match.status.toUpperCase()),
      ],
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.primaryGold.withOpacity(0.1)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: AppTheme.softBlue, borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: AppTheme.deepBlue, size: 20),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
                const SizedBox(height: 4),
                Text(value, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppTheme.deepBlue)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
