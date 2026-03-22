import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../src/theme';
import { api } from '../src/api';

function StatCard({ icon, value, label, sub, color }: {
  icon: string; value: string; label: string; sub?: string; color: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={[styles.statSub, { color }]}>{sub}</Text> : null}
    </View>
  );
}

function ProgressRing({ pct, label, color }: { pct: number; label: string; color: string }) {
  const clampedPct = Math.min(100, Math.max(0, pct));
  return (
    <View style={styles.ringContainer}>
      <View style={styles.ringOuter}>
        <View style={[styles.ringTrack, { borderColor: color + '20' }]} />
        <View style={[styles.ringFill, {
          borderColor: color,
          borderTopColor: clampedPct >= 25 ? color : 'transparent',
          borderRightColor: clampedPct >= 50 ? color : 'transparent',
          borderBottomColor: clampedPct >= 75 ? color : 'transparent',
          borderLeftColor: clampedPct >= 1 ? color : 'transparent',
          transform: [{ rotate: '-90deg' }],
        }]} />
        <View style={styles.ringInner}>
          <Text style={[styles.ringPct, { color }]}>{clampedPct}%</Text>
        </View>
      </View>
      <Text style={styles.ringLabel}>{label}</Text>
    </View>
  );
}

export default function WeeklyReportScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState(false);

  useFocusEffect(
    useCallback(() => { loadData(); }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      setError(false);
      const result = await api.getWeeklyReport();
      setData(result);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.lime} />
          <Text style={styles.loadingText}>Generando il report...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.errorText}>Errore nel caricamento</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
            <Text style={styles.retryText}>RIPROVA</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const kmColor = data.km_pct >= 90 ? '#4ade80' : data.km_pct >= 70 ? COLORS.lime : data.km_pct >= 50 ? '#facc15' : '#f97316';
  const adhColor = data.adherence_pct >= 80 ? '#4ade80' : data.adherence_pct >= 60 ? COLORS.lime : data.adherence_pct >= 40 ? '#facc15' : '#f97316';
  const vdotColor = data.vdot_change > 0 ? '#4ade80' : data.vdot_change < 0 ? '#f97316' : COLORS.textSecondary;

  // Trend bars (current + previous weeks)
  const allWeeksKm = [...(data.prev_weeks || []).map((w: any) => w.km).reverse(), data.actual_km];
  const maxWeekKm = Math.max(...allWeeksKm, 1);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>WEEKLY REPORT</Text>
          <Text style={styles.pageSubtitle}>
            Settimana {data.week_number} • {data.phase}
          </Text>
        </View>
        <View style={styles.raceBadge}>
          <Text style={styles.raceCountdown}>{data.days_to_race}</Text>
          <Text style={styles.raceLabel}>giorni</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }}
            tintColor={COLORS.lime} />
        }
      >
        {/* Progress Rings */}
        <View style={styles.card}>
          <View style={styles.ringsRow}>
            <ProgressRing pct={data.km_pct} label="KM Target" color={kmColor} />
            <ProgressRing pct={data.adherence_pct} label="Aderenza" color={adhColor} />
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard icon="🏃" value={`${data.actual_km}`} label="KM" sub={`/ ${data.target_km}`} color={kmColor} />
          <StatCard icon="📅" value={`${data.actual_runs}`} label="Corse" sub={`${data.completed_sessions}/${data.total_sessions} piano`} color={COLORS.blue} />
          <StatCard icon="⏱️" value={data.avg_pace || '—'} label="Passo" sub="medio" color={COLORS.textSecondary} />
          <StatCard icon="❤️" value={data.avg_hr ? `${data.avg_hr}` : '—'} label="FC media" sub="bpm" color="#e63946" />
        </View>

        {/* VDOT */}
        {data.vdot && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="speedometer" size={20} color={COLORS.lime} />
              <Text style={styles.cardTitle}>VDOT</Text>
            </View>
            <View style={styles.vdotRow}>
              <Text style={styles.vdotValue}>{data.vdot}</Text>
              {data.vdot_change !== null && data.vdot_change !== undefined && data.vdot_change !== 0 && (
                <View style={[styles.vdotChangeBadge, { backgroundColor: vdotColor + '20' }]}>
                  <Ionicons
                    name={data.vdot_change > 0 ? 'trending-up' : 'trending-down'}
                    size={16} color={vdotColor}
                  />
                  <Text style={[styles.vdotChangeText, { color: vdotColor }]}>
                    {data.vdot_change > 0 ? '+' : ''}{data.vdot_change}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Trend — last 5 weeks bar chart */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="trending-up" size={20} color={COLORS.blue} />
            <Text style={styles.cardTitle}>TREND VOLUME</Text>
          </View>
          <View style={styles.trendBars}>
            {allWeeksKm.map((km: number, i: number) => {
              const isCurrentWeek = i === allWeeksKm.length - 1;
              const barH = Math.max(8, (km / maxWeekKm) * 100);
              const barColor = isCurrentWeek ? COLORS.lime : COLORS.blue + '80';
              const weekLabel = isCurrentWeek ? 'Questa' : `-${allWeeksKm.length - 1 - i}`;
              return (
                <View key={i} style={styles.trendBarCol}>
                  <Text style={[styles.trendBarValue, isCurrentWeek && { color: COLORS.lime, fontWeight: '800' }]}>
                    {Math.round(km)}
                  </Text>
                  <View style={styles.trendBarTrack}>
                    <View style={[styles.trendBar, { height: barH, backgroundColor: barColor }]} />
                  </View>
                  <Text style={[styles.trendBarLabel, isCurrentWeek && { color: COLORS.lime }]}>
                    {weekLabel}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Run Details */}
        {data.run_details && data.run_details.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="list" size={20} color={COLORS.orange} />
              <Text style={styles.cardTitle}>CORSE DELLA SETTIMANA</Text>
            </View>
            {data.run_details.map((r: any, i: number) => {
              const dayName = (() => {
                try {
                  const d = new Date(r.date);
                  return ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'][d.getDay()];
                } catch { return ''; }
              })();
              return (
                <View key={i} style={styles.runRow}>
                  <View style={styles.runDayBadge}>
                    <Text style={styles.runDayText}>{dayName}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.runTitle}>
                      {r.distance_km} km • {r.avg_pace}/km
                    </Text>
                    <Text style={styles.runSub}>
                      {r.duration_minutes} min {r.avg_hr ? `• FC ${r.avg_hr} bpm` : ''}
                    </Text>
                  </View>
                  <Text style={styles.runType}>{r.run_type || ''}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* AI Analysis */}
        {data.ai_analysis ? (
          <View style={[styles.card, { borderColor: COLORS.lime + '40' }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="sparkles" size={20} color={COLORS.lime} />
              <Text style={styles.cardTitle}>ANALISI AI COACH</Text>
            </View>
            <Text style={styles.aiText}>{data.ai_analysis}</Text>
            <Text style={styles.aiSource}>Claude AI • Analisi personalizzata</Text>
          </View>
        ) : null}

        {/* Next Week Preview */}
        {(data.next_week_km > 0 || data.next_week_sessions?.length > 0) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="arrow-forward-circle" size={20} color={COLORS.lime} />
              <Text style={styles.cardTitle}>PROSSIMA SETTIMANA</Text>
            </View>
            <View style={styles.nextWeekRow}>
              <View style={styles.nextWeekInfo}>
                <Text style={styles.nextPhase}>{data.next_week_phase}</Text>
                <Text style={styles.nextKm}>{data.next_week_km} km target</Text>
              </View>
            </View>
            {data.next_week_sessions && data.next_week_sessions.length > 0 && (
              <View style={styles.nextSessions}>
                {data.next_week_sessions.map((s: string, i: number) => (
                  <View key={i} style={styles.nextSessionRow}>
                    <View style={styles.nextSessionDot} />
                    <Text style={styles.nextSessionText}>{s}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Report History */}
        {data.report_history && data.report_history.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="time" size={20} color={COLORS.textMuted} />
              <Text style={styles.cardTitle}>STORICO REPORT</Text>
            </View>
            {data.report_history.slice(0, 6).map((h: any, i: number) => (
              <View key={i} style={styles.historyRow}>
                <Text style={styles.historyDate}>{h.date || ''}</Text>
                <Text style={styles.historyKm}>{h.actual_km || 0} km</Text>
                <View style={[styles.historyPctBadge, {
                  backgroundColor: (h.km_pct >= 90 ? '#4ade80' : h.km_pct >= 70 ? COLORS.lime : '#facc15') + '20',
                }]}>
                  <Text style={[styles.historyPctText, {
                    color: h.km_pct >= 90 ? '#4ade80' : h.km_pct >= 70 ? COLORS.lime : '#facc15',
                  }]}>{h.km_pct || 0}%</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  loadingText: { color: COLORS.textMuted, fontSize: FONT_SIZES.sm, marginTop: SPACING.sm },
  errorText: { color: COLORS.textMuted, fontSize: FONT_SIZES.body },
  retryBtn: { backgroundColor: COLORS.lime, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm },
  retryText: { color: COLORS.bg, fontWeight: '800', fontSize: FONT_SIZES.sm },
  scrollContent: { paddingBottom: SPACING.xxl },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  pageTitle: { fontSize: FONT_SIZES.xxl, color: COLORS.text, fontWeight: '900', letterSpacing: 1 },
  pageSubtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginTop: 2 },
  raceBadge: {
    alignItems: 'center', backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  raceCountdown: { fontSize: FONT_SIZES.xl, color: COLORS.lime, fontWeight: '900' },
  raceLabel: { fontSize: 9, color: COLORS.textMuted, letterSpacing: 1 },

  card: {
    marginHorizontal: SPACING.xl, marginBottom: SPACING.lg,
    backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  cardTitle: { fontSize: FONT_SIZES.sm, color: COLORS.text, fontWeight: '700', letterSpacing: 2 },

  // Progress Rings
  ringsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: SPACING.sm },
  ringContainer: { alignItems: 'center' },
  ringOuter: { width: 100, height: 100, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  ringTrack: {
    position: 'absolute', width: 90, height: 90, borderRadius: 45,
    borderWidth: 8, top: 5, left: 5,
  },
  ringFill: {
    position: 'absolute', width: 90, height: 90, borderRadius: 45,
    borderWidth: 8, top: 5, left: 5,
  },
  ringInner: { alignItems: 'center' },
  ringPct: { fontSize: 22, fontWeight: '900' },
  ringLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: SPACING.xs },

  // Stats grid
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    marginHorizontal: SPACING.xl, marginBottom: SPACING.lg, gap: SPACING.sm,
  },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md, padding: SPACING.md,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  statValue: { fontSize: FONT_SIZES.xxl, fontWeight: '900', marginTop: 4 },
  statLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  statSub: { fontSize: FONT_SIZES.xs, fontWeight: '600', marginTop: 1 },

  // VDOT
  vdotRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  vdotValue: { fontSize: 48, color: COLORS.lime, fontWeight: '900' },
  vdotChangeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: BORDER_RADIUS.sm,
  },
  vdotChangeText: { fontSize: FONT_SIZES.body, fontWeight: '800' },

  // Trend bars
  trendBars: {
    flexDirection: 'row', justifyContent: 'space-around',
    alignItems: 'flex-end', height: 140, marginTop: SPACING.sm,
  },
  trendBarCol: { alignItems: 'center', flex: 1 },
  trendBarValue: { fontSize: 10, color: COLORS.textSecondary, marginBottom: 4 },
  trendBarTrack: { height: 100, justifyContent: 'flex-end', alignItems: 'center' },
  trendBar: { width: 28, borderRadius: 6 },
  trendBarLabel: { fontSize: 9, color: COLORS.textMuted, marginTop: 4 },

  // Run details
  runRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder,
  },
  runDayBadge: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.lime + '15', alignItems: 'center', justifyContent: 'center',
  },
  runDayText: { fontSize: FONT_SIZES.xs, color: COLORS.lime, fontWeight: '800' },
  runTitle: { fontSize: FONT_SIZES.body, color: COLORS.text, fontWeight: '700' },
  runSub: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  runType: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },

  // AI Analysis
  aiText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 22 },
  aiSource: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: SPACING.md, fontStyle: 'italic' },

  // Next week
  nextWeekRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  nextWeekInfo: {},
  nextPhase: { fontSize: FONT_SIZES.lg, color: COLORS.lime, fontWeight: '800' },
  nextKm: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  nextSessions: { marginTop: SPACING.md },
  nextSessionRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
  nextSessionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.lime },
  nextSessionText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },

  // History
  historyRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder,
  },
  historyDate: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, width: 80 },
  historyKm: { fontSize: FONT_SIZES.sm, color: COLORS.text, fontWeight: '700', flex: 1 },
  historyPctBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.sm },
  historyPctText: { fontSize: FONT_SIZES.xs, fontWeight: '800' },
});
