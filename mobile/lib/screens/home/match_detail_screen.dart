import 'package:flutter/material.dart';
import '../../models/match.dart';
import '../../services/match_service.dart';

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
    print('MatchDetailScreen initialized for match ${widget.matchId}');
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
      appBar: AppBar(
        title: const Text('Match Center'),
        backgroundColor: Colors.blue.shade700,
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: const [
            Tab(text: 'Scorecard'),
            Tab(text: 'Info'),
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
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.shade700,
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(match.matchType, style: const TextStyle(color: Colors.white70)),
              Text(match.status.toUpperCase(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildTeamInfo(match.team1, match.team1FlagUrl, match.team1Score),
              const Text('VS', style: TextStyle(color: Colors.white54, fontSize: 18, fontWeight: FontWeight.bold)),
              _buildTeamInfo(match.team2, match.team2FlagUrl, match.team2Score),
            ],
          ),
          if (match.result != null) ...[
            const SizedBox(height: 16),
            Text(
              match.result!,
              style: const TextStyle(color: Colors.white, fontStyle: FontStyle.italic),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTeamInfo(String name, String? flagUrl, String? score) {
    return Column(
      children: [
        CircleAvatar(
          backgroundColor: Colors.white,
          radius: 24,
          backgroundImage: flagUrl != null ? NetworkImage(flagUrl) : null,
          child: flagUrl == null ? const Icon(Icons.sports_cricket, color: Colors.blue) : null,
        ),
        const SizedBox(height: 8),
        Text(
          name,
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
          textAlign: TextAlign.center,
        ),
        if (score != null) ...[
          const SizedBox(height: 4),
          Text(
            score,
            style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
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

    return Card(
      margin: const EdgeInsets.all(8),
      child: ExpansionTile(
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        initiallyExpanded: true,
        children: [
          if (batting.isNotEmpty) ...[
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Align(alignment: Alignment.centerLeft, child: Text('Batting', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey))),
            ),
            _buildBattingTable(batting),
          ],
          if (bowling.isNotEmpty) ...[
             const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Align(alignment: Alignment.centerLeft, child: Text('Bowling', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey))),
            ),
             _buildBowlingTable(bowling),
          ],
        ],
      ),
    );
  }

  Widget _buildBattingTable(List<dynamic> batting) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        columnSpacing: 20,
        headingRowHeight: 40,
        columns: const [
          DataColumn(label: Text('Batter')),
          DataColumn(label: Text('R', style: TextStyle(fontWeight: FontWeight.bold))),
          DataColumn(label: Text('B')),
          DataColumn(label: Text('4s')),
          DataColumn(label: Text('6s')),
          DataColumn(label: Text('SR')),
        ],
        rows: batting.map((b) {
          final name = b['batsman']?['name'] ?? 'Unknown';
          final dismissal = b['dismissal-text'] ?? '';
          final isOut = dismissal != 'not out';
          
          return DataRow(cells: [
            DataCell(
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
                  if (dismissal.isNotEmpty)
                    Text(dismissal, style: const TextStyle(fontSize: 10, color: Colors.grey)),
                ],
              )
            ),
            DataCell(Text(b['r'].toString(), style: const TextStyle(fontWeight: FontWeight.bold))),
            DataCell(Text(b['b'].toString())),
            DataCell(Text(b['4s'].toString())),
            DataCell(Text(b['6s'].toString())),
            DataCell(Text(b['sr'].toString())),
          ]);
        }).toList(),
      ),
    );
  }

  Widget _buildBowlingTable(List<dynamic> bowling) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        columnSpacing: 20,
        headingRowHeight: 40,
        columns: const [
          DataColumn(label: Text('Bowler')),
          DataColumn(label: Text('O')),
          DataColumn(label: Text('M')),
          DataColumn(label: Text('R')),
          DataColumn(label: Text('W', style: TextStyle(fontWeight: FontWeight.bold))),
          DataColumn(label: Text('ECO')),
        ],
        rows: bowling.map((b) {
          final name = b['bowler']?['name'] ?? 'Unknown';
          return DataRow(cells: [
            DataCell(Text(name, style: const TextStyle(fontWeight: FontWeight.bold))),
            DataCell(Text(b['o'].toString())),
            DataCell(Text(b['m'].toString())),
            DataCell(Text(b['r'].toString())),
            DataCell(Text(b['w'].toString(), style: const TextStyle(fontWeight: FontWeight.bold))),
            DataCell(Text(b['eco'].toString())),
          ]);
        }).toList(),
      ),
    );
  }

  Widget _buildInfoTab(Match match) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildInfoRow(Icons.location_on, 'Venue', match.venue),
        const Divider(),
        _buildInfoRow(Icons.calendar_today, 'Date', match.matchDate.toLocal().toString().split('.')[0]),
        const Divider(),
        _buildInfoRow(Icons.info_outline, 'Status', match.status),
      ],
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: Colors.grey, size: 20),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
                const SizedBox(height: 4),
                Text(value, style: const TextStyle(fontSize: 16)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
