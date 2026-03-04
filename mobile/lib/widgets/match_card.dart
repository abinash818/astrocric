import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/match.dart';
import '../screens/analysis/analysis_detail_screen.dart';
import '../config/theme_constants.dart';
import '../screens/home/match_detail_screen.dart';

class MatchCard extends StatelessWidget {
  final Match match;

  const MatchCard({Key? key, required this.match}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryGold.withOpacity(0.08),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: InkWell(
        onTap: () {
          print('MatchCard clicked: ${match.id} (Analysis: ${match.hasAnalysis})');
          if (match.hasAnalysis) {
            Navigator.push(
              context,
              AppTheme.smoothRoute(AnalysisDetailScreen(matchId: match.id)),
            );
          } else {
            Navigator.push(
              context,
              AppTheme.smoothRoute(MatchDetailScreen(matchId: match.id)),
            );
          }
        },
        borderRadius: BorderRadius.circular(24),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: AppTheme.deepBlue.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      match.matchType.toUpperCase(),
                      style: const TextStyle(
                        color: AppTheme.deepBlue,
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                  _buildStatusBadge(),
                ],
              ),
              const SizedBox(height: 16),
              
              // Teams
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  Expanded(
                    child: _buildTeam(match.team1, match.team1FlagUrl, match.team1Score),
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      'VS',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey,
                      ),
                    ),
                  ),
                  Expanded(
                    child: _buildTeam(match.team2, match.team2FlagUrl, match.team2Score),
                  ),
                ],
              ),
              
              const SizedBox(height: 20),
              Divider(color: AppTheme.primaryGold.withOpacity(0.1)),
              const SizedBox(height: 12),
              
              Row(
                children: [
                  const Icon(Icons.calendar_today_rounded, size: 14, color: AppTheme.textSecondary),
                  const SizedBox(width: 6),
                  Text(
                    DateFormat('MMM dd, yyyy • hh:mm a').format(match.matchDate.toLocal()),
                    style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary, fontWeight: FontWeight.w500),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Icons.location_on_rounded, size: 14, color: AppTheme.textSecondary),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      match.venue,
                      style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary, fontWeight: FontWeight.w500),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              
              if (match.hasAnalysis) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [AppTheme.primaryGold.withOpacity(0.2), AppTheme.primaryGold.withOpacity(0.05)],
                    ),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.primaryGold.withOpacity(0.3)),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.auto_awesome, size: 16, color: AppTheme.darkGold),
                      SizedBox(width: 8),
                      Text(
                        'ANALYSIS READY',
                        style: TextStyle(
                          color: AppTheme.darkGold,
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTeam(String teamName, String? flagUrl, String? score) {
    return Column(
      children: [
        Container(
          width: 54,
          height: 54,
          decoration: BoxDecoration(
            color: Colors.white,
            shape: BoxShape.circle,
            border: Border.all(color: AppTheme.primaryGold.withOpacity(0.2)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: flagUrl != null
              ? ClipOval(
                  child: Image.network(
                    flagUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return const Icon(Icons.sports_cricket_rounded, size: 24, color: AppTheme.deepBlue);
                    },
                  ),
                )
              : const Icon(Icons.sports_cricket_rounded, size: 24, color: AppTheme.deepBlue),
        ),
        const SizedBox(height: 10),
        Text(
          teamName,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w800,
            color: AppTheme.deepBlue,
          ),
          textAlign: TextAlign.center,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        if (score != null) ...[
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: AppTheme.softBlue,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              score,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w900,
                color: AppTheme.deepBlue,
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildStatusBadge() {
    Color color;
    String text;

    switch (match.status) {
      case 'live':
        color = Colors.redAccent;
        text = 'LIVE';
        break;
      case 'finished':
        color = AppTheme.textSecondary;
        text = 'FINISHED';
        break;
      default:
        color = AppTheme.darkGold;
        text = 'UPCOMING';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (match.status == 'live') ...[
            Container(
              width: 6,
              height: 6,
              decoration: const BoxDecoration(color: Colors.redAccent, shape: BoxShape.circle),
            ),
            const SizedBox(width: 6),
          ],
          Text(
            text,
            style: TextStyle(
              color: color,
              fontSize: 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 1,
            ),
          ),
        ],
      ),
    );
  }
}
