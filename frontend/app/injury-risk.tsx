import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../src/theme';
import { api } from '../src/api';

const RISK_COLORS = {
  low: '#4ade80',
  medium: '#facc15',
  high: '#f97316',
  critical: '#ef4444',
};

function RiskGauge({ score, label }: { score: number; label: string }) {
  const color = score <= 30 ? RISK_COLORS.low
    : score <= 55 ? RISK_COLORS.medium
    : score <= 75 ? RISK_COLORS.high
    : RISK_COLORS.critical;
  const riskLabel = score <= 30 ? 'BASSO'
    : score <= 55 ? 'MODERATO'
    : score <= 75 ? 'ALTO'
    : 'CRITICO';

  return (
    <View style={styles.gaugeContainer}>
      <View style={styles.gaugeTrack}>
        <View style={[styles.gaugeFill, { width: `${Math.min(100, score)}%`, backgroundColor: color }]} />
      </View>
      <View style={styles.gaugeLabels}>
        <Text style={[styles.gaugeScore, { color }]}>{score}/100</Text>
        <Text style={[styles.gaugeRisk, { color }]}>{riskLabel}</Text>
      </View>
      <Text style={styles.gaugeLabel}>{label}</Text>
    </View>
  );
}

export default function InjuryRiskScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<any>(null);

  useFocusEffect(
    useCallback(() => { loadData(); }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      setError(false);
      const result = await api.getInjuryRisk();
      setData(result);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.lime} />
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

  const { overall_score, factors, alerts, recommendations, weekly_load_history } = data;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.pageTitle}>INJURY RISK</Text>
          <Text style={styles.pageSubtitle}>Analisi predittiva infortunio</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Overall Risk Score */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="shield-checkmark" size={22} color={
              overall_score <= 30 ? RISK_COLORS.low
              : overall_score <= 55 ? RISK_COLORS.medium
              : overall_score <= 75 ? RISK_COLORS.high
              : RISK_COLORS.critical
            } />
            <Text style={styles.cardTitle}>RISCHIO COMPLESSIVO</Text>
          </View>
          <RiskGauge score={overall_score} label="Score basato su carico, intensità e storico infortuni" />
        </View>

        {/* Risk Factors */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="analytics" size={20} color={COLORS.blue} />
            <Text style={styles.cardTitle}>FATTORI DI RISCHIO</Text>
          </View>
          {factors && factors.map((f: any, i: number) => (
            <View key={i} style={styles.factorRow}>
              <View style={styles.factorInfo}>
                <Text style={styles.factorName}>{f.name}</Text>
                <Text style={styles.factorDesc}>{f.description}</Text>
              </View>
              <View style={[styles.factorBadge, {
                backgroundColor: (f.score <= 30 ? RISK_COLORS.low
                  : f.score <= 55 ? RISK_COLORS.medium
                  : f.score <= 75 ? RISK_COLORS.high
                  : RISK_COLORS.critical) + '20'
              }]}>
                <Text style={[styles.factorScore, {
                  color: f.score <= 30 ? RISK_COLORS.low
                    : f.score <= 55 ? RISK_COLORS.medium
                    : f.score <= 75 ? RISK_COLORS.high
                    : RISK_COLORS.critical
                }]}>{f.score}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Alerts */}
        {alerts && alerts.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="warning" size={20} color={COLORS.orange} />
              <Text style={styles.cardTitle}>AVVISI</Text>
            </View>
            {alerts.map((a: any, i: number) => (
              <View key={i} style={[styles.alertRow, {
                borderLeftColor: a.level === 'critical' ? RISK_COLORS.critical
                  : a.level === 'high' ? RISK_COLORS.high
                  : a.level === 'medium' ? RISK_COLORS.medium
                  : RISK_COLORS.low
              }]}>
                <Ionicons
                  name={a.level === 'critical' ? 'alert-circle' : a.level === 'high' ? 'warning' : 'information-circle'}
                  size={18}
                  color={a.level === 'critical' ? RISK_COLORS.critical
                    : a.level === 'high' ? RISK_COLORS.high
                    : RISK_COLORS.medium}
                />
                <Text style={styles.alertText}>{a.message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Weekly Load History Bar Chart */}
        {weekly_load_history && weekly_load_history.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="bar-chart" size={20} color={COLORS.lime} />
              <Text style={styles.cardTitle}>CARICO SETTIMANALE</Text>
            </View>
            <View style={styles.loadChart}>
              {weekly_load_history.slice(-8).map((w: any, i: number) => {
                const maxKm = Math.max(...weekly_load_history.slice(-8).map((x: any) => x.km || 1));
                const barH = Math.max(8, ((w.km || 0) / maxKm) * 120);
                const isOverload = w.increase_pct && w.increase_pct > 20;
                return (
                  <View key={i} style={styles.loadBarCol}>
                    <Text style={[styles.loadBarValue, isOverload && { color: RISK_COLORS.high }]}>
                      {Math.round(w.km)}
                    </Text>
                    <View style={styles.loadBarTrack}>
                      <View style={[styles.loadBar, {
                        height: barH,
                        backgroundColor: isOverload ? RISK_COLORS.high : COLORS.lime,
                      }]} />
                    </View>
                    <Text style={styles.loadBarLabel}>
                      {w.week_label || ''}
                    </Text>
                    {w.increase_pct !== undefined && w.increase_pct !== null && (
                      <Text style={[styles.loadPct, {
                        color: w.increase_pct > 20 ? RISK_COLORS.high
                          : w.increase_pct > 10 ? RISK_COLORS.medium
                          : RISK_COLORS.low
                      }]}>
                        {w.increase_pct > 0 ? '+' : ''}{Math.round(w.increase_pct)}%
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
            <Text style={styles.chartNote}>Barre arancioni = aumento &gt;20% (rischio sovraccarico)</Text>
          </View>
        )}

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="bulb" size={20} color={COLORS.lime} />
              <Text style={styles.cardTitle}>RACCOMANDAZIONI</Text>
            </View>
            {recommendations.map((r: string, i: number) => (
              <View key={i} style={styles.recRow}>
                <Text style={styles.recBullet}>•</Text>
                <Text style={styles.recText}>{r}</Text>
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

  card: {
    marginHorizontal: SPACING.xl, marginBottom: SPACING.lg,
    backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  cardTitle: { fontSize: FONT_SIZES.sm, color: COLORS.text, fontWeight: '700', letterSpacing: 2 },

  gaugeContainer: { marginTop: SPACING.sm },
  gaugeTrack: {
    height: 12, backgroundColor: COLORS.cardBorder, borderRadius: 6, overflow: 'hidden',
  },
  gaugeFill: { height: 12, borderRadius: 6 },
  gaugeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.sm },
  gaugeScore: { fontSize: FONT_SIZES.xxl, fontWeight: '900' },
  gaugeRisk: { fontSize: FONT_SIZES.body, fontWeight: '800', alignSelf: 'flex-end' },
  gaugeLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: SPACING.xs, fontStyle: 'italic' },

  factorRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder,
  },
  factorInfo: { flex: 1, marginRight: SPACING.md },
  factorName: { fontSize: FONT_SIZES.body, color: COLORS.text, fontWeight: '700' },
  factorDesc: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  factorBadge: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
  },
  factorScore: { fontSize: FONT_SIZES.body, fontWeight: '900' },

  alertRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    paddingVertical: SPACING.md, paddingLeft: SPACING.md,
    borderLeftWidth: 3, marginBottom: SPACING.xs,
  },
  alertText: { fontSize: FONT_SIZES.sm, color: COLORS.text, flex: 1, lineHeight: 20 },

  loadChart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 170, marginTop: SPACING.sm },
  loadBarCol: { alignItems: 'center', flex: 1 },
  loadBarValue: { fontSize: 9, color: COLORS.textSecondary, marginBottom: 2 },
  loadBarTrack: { height: 130, justifyContent: 'flex-end', alignItems: 'center' },
  loadBar: { width: 22, borderRadius: 4 },
  loadBarLabel: { fontSize: 7, color: COLORS.textMuted, marginTop: 3, textAlign: 'center' },
  loadPct: { fontSize: 8, fontWeight: '700', marginTop: 1 },
  chartNote: { fontSize: 9, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.sm, fontStyle: 'italic' },

  recRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  recBullet: { color: COLORS.lime, fontSize: FONT_SIZES.body, fontWeight: '700' },
  recText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, flex: 1, lineHeight: 20 },
});
