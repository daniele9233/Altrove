import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Dimensions, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../src/theme';
import { api } from '../src/api';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W = SCREEN_W - 80;

// ---- Supercompensation Curve (visual educational diagram) ----
function SupercompensationCurve() {
  const W = SCREEN_W - 64;
  const H = 140;

  // Points describing the supercompensation curve
  // Baseline → dip (fatigue) → recovery → supercompensation peak → return
  const curvePoints = [
    { x: 0, y: 0.5 },      // baseline
    { x: 0.08, y: 0.5 },    // pre-stimulus
    { x: 0.12, y: 0.3 },    // stimulus applied
    { x: 0.18, y: 0.15 },   // fatigue trough
    { x: 0.28, y: 0.35 },   // recovery start
    { x: 0.4, y: 0.5 },     // back to baseline
    { x: 0.52, y: 0.65 },   // supercompensation rising
    { x: 0.62, y: 0.78 },   // peak supercompensation
    { x: 0.72, y: 0.72 },   // starting to decline
    { x: 0.85, y: 0.55 },   // returning
    { x: 1.0, y: 0.5 },     // back to baseline
  ];

  const toX = (pct: number) => pct * W;
  const toY = (pct: number) => H - pct * H;

  // Phase labels
  const phases = [
    { x: 0.15, label: 'STIMOLO', color: '#ef4444', icon: 'flash' },
    { x: 0.30, label: 'RECUPERO', color: '#eab308', icon: 'refresh' },
    { x: 0.62, label: 'SUPER-\nCOMPENSAZIONE', color: '#22c55e', icon: 'trending-up' },
  ];

  return (
    <View style={{ height: H + 50, marginBottom: SPACING.md }}>
      {/* Baseline dashed line */}
      <View style={{
        position: 'absolute', left: 0, right: 0,
        top: toY(0.5), height: 1,
        borderWidth: 1, borderColor: COLORS.textMuted, borderStyle: 'dashed', opacity: 0.4,
      }} />
      <Text style={{
        position: 'absolute', right: 0, top: toY(0.5) - 14,
        fontSize: 8, color: COLORS.textMuted,
      }}>Livello base</Text>

      {/* Supercompensation zone highlight */}
      <View style={{
        position: 'absolute',
        left: toX(0.4), top: toY(0.78),
        width: toX(0.45), height: toY(0.5) - toY(0.78),
        backgroundColor: '#22c55e08', borderRadius: 4,
        borderWidth: 1, borderColor: '#22c55e20', borderStyle: 'dashed',
      }} />

      {/* Fatigue zone highlight */}
      <View style={{
        position: 'absolute',
        left: toX(0.08), top: toY(0.5),
        width: toX(0.32), height: toY(0.15) - toY(0.5),
        backgroundColor: '#ef444408', borderRadius: 4,
      }} />

      {/* Curve line segments */}
      {curvePoints.map((point, i) => {
        if (i === 0) return null;
        const prev = curvePoints[i - 1];
        const x1 = toX(prev.x), y1 = toY(prev.y);
        const x2 = toX(point.x), y2 = toY(point.y);
        const dx = x2 - x1, dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        // Color based on phase
        let color = COLORS.lime;
        if (point.y < 0.5 && prev.y <= 0.5 && point.x < 0.4) color = '#ef4444';
        else if (point.y >= 0.5 && point.x < 0.42) color = '#eab308';
        else if (point.y > 0.5) color = '#22c55e';

        return (
          <View key={`line-${i}`} style={{
            position: 'absolute', left: x1, top: y1,
            width: length, height: 3,
            backgroundColor: color,
            transform: [{ rotate: `${angle}deg` }], transformOrigin: 'left center',
          }} />
        );
      })}

      {/* Peak marker */}
      <View style={{
        position: 'absolute',
        left: toX(0.62) - 5, top: toY(0.78) - 5,
        width: 10, height: 10, borderRadius: 5,
        backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#fff',
      }} />
      <Text style={{
        position: 'absolute', left: toX(0.62) - 20, top: toY(0.78) - 22,
        fontSize: 9, color: '#22c55e', fontWeight: '900', width: 40, textAlign: 'center',
      }}>PICCO</Text>

      {/* Stimulus arrow */}
      <View style={{
        position: 'absolute', left: toX(0.10), top: toY(0.5) - 2,
        width: 2, height: toY(0.15) - toY(0.5) + 4,
        backgroundColor: '#ef4444',
      }} />
      <Ionicons name="flash" size={14} color="#ef4444" style={{
        position: 'absolute', left: toX(0.10) - 6, top: toY(0.5) - 16,
      }} />

      {/* Phase labels at bottom */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row' }}>
        {phases.map((p, i) => (
          <View key={i} style={{
            position: 'absolute', left: toX(p.x) - 30,
            width: 65, alignItems: 'center',
          }}>
            <View style={{
              width: 20, height: 20, borderRadius: 10,
              backgroundColor: p.color + '20', alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name={p.icon as any} size={10} color={p.color} />
            </View>
            <Text style={{ fontSize: 7, color: p.color, fontWeight: '800', textAlign: 'center', marginTop: 2 }}>
              {p.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---- Maturation Progress Bar ----
function MaturationBar({ pct, status }: { pct: number; status: string }) {
  const color = status === 'active' ? '#22c55e' : status === 'consolidating' ? '#22c55e' : '#3b82f6';
  const bgColor = status === 'active' ? '#22c55e15' : status === 'consolidating' ? '#22c55e10' : '#3b82f610';
  return (
    <View style={{ height: 6, backgroundColor: bgColor, borderRadius: 3, overflow: 'hidden' }}>
      <View style={{
        height: 6, width: `${Math.min(pct, 100)}%`,
        backgroundColor: color, borderRadius: 3,
      }} />
    </View>
  );
}

// ---- Projection Chart (future fitness line) ----
function ProjectionChart({ projection }: { projection: any[] }) {
  if (!projection || projection.length < 2) return null;

  const CHART_H = 160;
  const PAD_L = 30;
  const chartW = SCREEN_W - 64 - PAD_L - 10;
  const stepX = chartW / (projection.length - 1);

  const allVals = projection.flatMap(p => [p.fitness, p.fatigue, p.form]);
  const maxV = Math.max(...allVals, 1) * 1.2;
  const minV = Math.min(...allVals, 0) - 2;
  const range = maxV - minV || 1;

  const toY = (v: number) => CHART_H - ((v - minV) / range) * CHART_H;

  const drawLine = (data: any[], key: string, color: string, width: number, dashed: boolean) => {
    return data.map((point: any, i: number) => {
      if (i === 0) return null;
      const prev = data[i - 1];
      const x1 = PAD_L + (i - 1) * stepX;
      const x2 = PAD_L + i * stepX;
      const y1 = toY(prev[key]);
      const y2 = toY(point[key]);
      const dx = x2 - x1, dy = y2 - y1;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      return (
        <View key={`${key}-${i}`} style={{
          position: 'absolute', left: x1, top: y1,
          width: length, height: width,
          backgroundColor: color,
          transform: [{ rotate: `${angle}deg` }], transformOrigin: 'left center',
          opacity: dashed ? 0.6 : 1,
        }} />
      );
    });
  };

  // Zero line
  const zeroY = toY(0);

  // Day labels
  const dayLabels = projection.filter((_, i) => i % 2 === 0 || i === projection.length - 1);

  return (
    <View style={{ height: CHART_H + 25 }}>
      {/* Zero line */}
      {zeroY >= 0 && zeroY <= CHART_H && (
        <View style={{
          position: 'absolute', left: PAD_L, right: 10,
          top: zeroY, height: 1,
          borderWidth: 1, borderColor: COLORS.cardBorder, borderStyle: 'dashed', opacity: 0.5,
        }} />
      )}

      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((pct, i) => (
        <View key={`grid-${i}`} style={{
          position: 'absolute', left: PAD_L, right: 10,
          top: pct * CHART_H, height: 1,
          backgroundColor: COLORS.cardBorder, opacity: 0.2,
        }} />
      ))}

      {/* Form area (green if positive, red if negative) */}
      {projection.map((point, i) => {
        const x = PAD_L + i * stepX;
        const yForm = toY(point.form);
        const y0 = toY(0);
        const h = Math.abs(yForm - y0);
        const top = Math.min(yForm, y0);
        return (
          <View key={`form-area-${i}`} style={{
            position: 'absolute', left: x - stepX / 2, top,
            width: stepX, height: h,
            backgroundColor: point.form >= 0 ? '#22c55e10' : '#ef444410',
          }} />
        );
      })}

      {/* Fitness line (orange, dashed = future) */}
      {drawLine(projection, 'fitness', '#f97316', 2.5, true)}

      {/* Fatigue line (grey, dashed) */}
      {drawLine(projection, 'fatigue', '#9ca3af', 1.5, true)}

      {/* Form line (green/red) */}
      {projection.map((point, i) => {
        if (i === 0) return null;
        const prev = projection[i - 1];
        const x1 = PAD_L + (i - 1) * stepX;
        const x2 = PAD_L + i * stepX;
        const y1 = toY(prev.form);
        const y2 = toY(point.form);
        const dx = x2 - x1, dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const color = point.form >= 0 ? '#22c55e' : '#ef4444';
        return (
          <View key={`form-${i}`} style={{
            position: 'absolute', left: x1, top: y1,
            width: length, height: 2,
            backgroundColor: color,
            transform: [{ rotate: `${angle}deg` }], transformOrigin: 'left center',
          }} />
        );
      })}

      {/* Today marker */}
      <View style={{
        position: 'absolute', left: PAD_L, top: 0,
        width: 1, height: CHART_H,
        backgroundColor: COLORS.lime, opacity: 0.5,
      }} />
      <Text style={{
        position: 'absolute', left: PAD_L - 8, top: -12,
        fontSize: 7, color: COLORS.lime, fontWeight: '800',
      }}>OGGI</Text>

      {/* X-axis labels */}
      <View style={{ position: 'absolute', top: CHART_H + 4, left: PAD_L }}>
        {projection.map((p, i) => {
          if (i % 3 !== 0 && i !== projection.length - 1) return null;
          return (
            <Text key={`xl-${i}`} style={{
              position: 'absolute', left: i * stepX - 10,
              fontSize: 8, color: COLORS.textMuted, width: 22, textAlign: 'center',
            }}>{i === 0 ? 'Oggi' : `+${p.day_offset}g`}</Text>
          );
        })}
      </View>

      {/* Y-axis labels */}
      <Text style={{ position: 'absolute', left: 0, top: 0, fontSize: 7, color: COLORS.textMuted }}>
        {Math.round(maxV)}
      </Text>
      <Text style={{ position: 'absolute', left: 0, top: CHART_H - 8, fontSize: 7, color: COLORS.textMuted }}>
        {Math.round(minV)}
      </Text>
    </View>
  );
}

// ---- Main Screen ----
export default function SupercompensazioneScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [data, setData] = useState<any>(null);

  const loadData = async () => {
    try {
      setError(false);
      const result = await api.getSupercompensation();
      setData(result);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.lime} />
        </View>
      </SafeAreaView>
    );
  }

  const maturation = data?.maturation ?? [];
  const projection = data?.projection ?? [];
  const goldenDay = data?.golden_day;
  const trainingRoi = data?.training_roi ?? [];
  const summary = data?.summary ?? {};

  const MONTH_NAMES = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
  };

  const formatDateLong = (dateStr: string) => {
    if (!dateStr) return '';
    const days = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
    const d = new Date(dateStr + 'T00:00:00');
    return `${days[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={COLORS.lime} />
        }
      >
        {/* Back button + Title */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>SUPERCOMPENSAZIONE</Text>
            <Text style={styles.pageSubtitle}>La scienza dietro i tuoi progressi</Text>
          </View>
          <Ionicons name="flask" size={24} color={COLORS.lime} />
        </View>

        {/* ====== INTRO: What is Supercompensation ====== */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#22c55e15', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="school" size={18} color="#22c55e" />
            </View>
            <Text style={styles.cardTitle}>Come funziona?</Text>
          </View>

          <Text style={styles.introText}>
            Quando ti alleni, il tuo corpo subisce uno <Text style={styles.highlight}>stress controllato</Text>.
            Nelle ore e giorni successivi, non si limita a tornare al livello precedente:
            si ricostruisce <Text style={styles.highlightGreen}>più forte di prima</Text>.
          </Text>

          <Text style={[styles.introText, { marginTop: SPACING.sm }]}>
            Questo fenomeno si chiama <Text style={styles.highlightGreen}>supercompensazione</Text>.
            I cambiamenti strutturali — nuovi mitocondri, capillari più densi, enzimi più efficienti —
            richiedono dai <Text style={styles.highlight}>10 ai 21 giorni</Text> per manifestarsi come performance.
          </Text>

          {/* Visual curve */}
          <View style={{ marginTop: SPACING.lg }}>
            <SupercompensationCurve />
          </View>

          {/* 3 adaptation types */}
          <View style={{ gap: SPACING.sm, marginTop: SPACING.sm }}>
            {[
              { icon: '⚡', title: 'Neuromuscolare', days: '3-7 giorni', desc: 'Sprint, salite, velocità. Il sistema nervoso si adatta rapidamente.', color: '#f59e0b' },
              { icon: '🔥', title: 'Metabolico', days: '7-14 giorni', desc: 'Soglia, ripetute, fartlek. Enzimi e mitocondri diventano più efficienti.', color: '#f97316' },
              { icon: '🧬', title: 'Strutturale', days: '14-21 giorni', desc: 'Lunghi, base aerobica. Nuovi capillari e mitocondri vengono costruiti.', color: '#ef4444' },
            ].map((adapt, i) => (
              <View key={i} style={{
                flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
                backgroundColor: adapt.color + '08', borderRadius: BORDER_RADIUS.sm,
                padding: SPACING.sm, borderLeftWidth: 3, borderLeftColor: adapt.color,
              }}>
                <Text style={{ fontSize: 24 }}>{adapt.icon}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                    <Text style={{ fontSize: 12, color: adapt.color, fontWeight: '800' }}>{adapt.title}</Text>
                    <View style={{ backgroundColor: adapt.color + '20', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                      <Text style={{ fontSize: 9, color: adapt.color, fontWeight: '700' }}>{adapt.days}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 10, color: COLORS.textSecondary, marginTop: 2 }}>{adapt.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ====== GRAFICO DEL FUTURO (Progress Projection) ====== */}
        {projection.length > 0 && (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#3b82f615', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="analytics" size={18} color="#3b82f6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Grafico del Futuro</Text>
                <Text style={{ fontSize: 10, color: COLORS.textMuted }}>Come evolverà la tua forma nei prossimi 14 giorni</Text>
              </View>
            </View>

            <ProjectionChart projection={projection} />

            {/* Legend */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: SPACING.lg, marginTop: SPACING.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 14, height: 3, borderRadius: 1.5, backgroundColor: '#f97316' }} />
                <Text style={{ fontSize: 9, color: COLORS.textMuted }}>Condizione</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 14, height: 3, borderRadius: 1.5, backgroundColor: '#9ca3af' }} />
                <Text style={{ fontSize: 9, color: COLORS.textMuted }}>Affaticamento</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 14, height: 3, borderRadius: 1.5, backgroundColor: '#22c55e' }} />
                <Text style={{ fontSize: 9, color: COLORS.textMuted }}>Forma</Text>
              </View>
            </View>

            {/* Interpretation message */}
            {projection.length > 1 && (
              <View style={{
                marginTop: SPACING.md, backgroundColor: '#3b82f608',
                borderRadius: BORDER_RADIUS.sm, padding: SPACING.sm,
                borderLeftWidth: 3, borderLeftColor: '#3b82f6',
              }}>
                <Text style={{ fontSize: 10, color: COLORS.textSecondary, lineHeight: 16 }}>
                  {projection[projection.length - 1].form > projection[0].form
                    ? `📈 Senza nuovi allenamenti, la tua forma migliorerà grazie al recupero. Tra 14 giorni la forma sarà a ${projection[projection.length - 1].form}.`
                    : `📉 La condizione fisica sta calando naturalmente. Mantieni gli allenamenti per sostenere il livello attuale.`
                  }
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ====== BARRA DI MATURAZIONE (Ripening Bar) ====== */}
        {maturation.length > 0 && (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#22c55e15', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="leaf" size={18} color="#22c55e" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Barra di Maturazione</Text>
                <Text style={{ fontSize: 10, color: COLORS.textMuted }}>Ogni allenamento è un seme che deve crescere</Text>
              </View>
            </View>

            {/* Summary badges */}
            <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md }}>
              <View style={[styles.summaryBadge, { backgroundColor: '#3b82f610' }]}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#3b82f6' }}>{summary.processing}</Text>
                <Text style={{ fontSize: 8, color: '#3b82f6', fontWeight: '700' }}>🟦 IN LAVORO</Text>
              </View>
              <View style={[styles.summaryBadge, { backgroundColor: '#22c55e10' }]}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#22c55e' }}>{summary.consolidating}</Text>
                <Text style={{ fontSize: 8, color: '#22c55e', fontWeight: '700' }}>🟩 CONSOLID.</Text>
              </View>
              <View style={[styles.summaryBadge, { backgroundColor: '#22c55e10' }]}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#22c55e' }}>{summary.active}</Text>
                <Text style={{ fontSize: 8, color: '#22c55e', fontWeight: '700' }}>💎 ATTIVI</Text>
              </View>
            </View>

            {/* Maturation list */}
            {maturation.slice(0, 10).map((m: any, i: number) => (
              <View key={i} style={{
                paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder + '30',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <Text style={{ fontSize: 18 }}>{m.status_emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                      <Text style={{ fontSize: 12, color: COLORS.text, fontWeight: '700' }}>{m.run_type_label}</Text>
                      {m.distance_km > 0 && (
                        <Text style={{ fontSize: 10, color: COLORS.textMuted }}>{m.distance_km} km</Text>
                      )}
                    </View>
                    <Text style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 1 }}>
                      {formatDate(m.date)} • {m.pace ? `${m.pace}/km` : `${m.duration_min} min`}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', width: 70 }}>
                    <Text style={{
                      fontSize: 14, fontWeight: '900',
                      color: m.status === 'active' ? '#22c55e' : m.status === 'consolidating' ? '#22c55e' : '#3b82f6',
                    }}>{m.pct}%</Text>
                    <Text style={{ fontSize: 8, color: COLORS.textMuted }}>{m.status_label}</Text>
                  </View>
                </View>
                <View style={{ marginTop: 4 }}>
                  <MaturationBar pct={m.pct} status={m.status} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
                  <Text style={{ fontSize: 8, color: COLORS.textMuted }}>
                    {m.benefit}
                  </Text>
                  <Text style={{ fontSize: 8, color: COLORS.textMuted }}>
                    {m.status === 'active' ? '✓ Attivo ora' : `Picco: ${formatDate(m.benefit_date)}`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ====== GOLDEN DAY (Invest & Cash Out) ====== */}
        {goldenDay && (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#fbbf2415', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="star" size={18} color="#fbbf24" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Invest & Cash Out</Text>
                <Text style={{ fontSize: 10, color: COLORS.textMuted }}>Il momento perfetto per dare il massimo</Text>
              </View>
            </View>

            {/* Golden Day gauge */}
            <View style={{
              alignItems: 'center', backgroundColor: '#fbbf2408',
              borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl,
              borderWidth: 1, borderColor: '#fbbf2420',
            }}>
              {/* Circular indicator */}
              <View style={{
                width: 100, height: 100, borderRadius: 50,
                borderWidth: 4, borderColor: '#fbbf24',
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: '#fbbf2410',
              }}>
                <Text style={{ fontSize: 28, fontWeight: '900', color: '#fbbf24' }}>
                  {goldenDay.days_until}
                </Text>
                <Text style={{ fontSize: 9, color: '#fbbf24', fontWeight: '700' }}>GIORNI</Text>
              </View>

              <Text style={{
                fontSize: 14, color: COLORS.text, fontWeight: '800', textAlign: 'center',
                marginTop: SPACING.md, lineHeight: 20,
              }}>
                Il tuo Golden Day è{'\n'}
                <Text style={{ color: '#fbbf24', fontSize: 16 }}>{formatDateLong(goldenDay.date)}</Text>
              </Text>

              <Text style={{
                fontSize: 11, color: COLORS.textSecondary, textAlign: 'center',
                marginTop: SPACING.sm, lineHeight: 18, paddingHorizontal: SPACING.md,
              }}>
                Hai accumulato <Text style={{ color: COLORS.lime, fontWeight: '800' }}>{goldenDay.km_accumulated} km</Text> di potenziale
                negli ultimi 21 giorni.{'\n'}
                Il tuo corpo trasformerà questo sforzo in massima potenza
                tra <Text style={{ color: '#fbbf24', fontWeight: '800' }}>{goldenDay.days_until} giorni</Text>.
              </Text>

              <Text style={{
                fontSize: 10, color: '#fbbf24', fontWeight: '700', marginTop: SPACING.md,
                textAlign: 'center',
              }}>
                ⭐ Segna il calendario per il tuo Personal Best!
              </Text>
            </View>
          </View>
        )}

        {/* ====== TRAINING ROI (Portafoglio Investimento Biologico) ====== */}
        {trainingRoi.length > 0 && (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#8b5cf615', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="wallet" size={18} color="#8b5cf6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Portafoglio Biologico</Text>
                <Text style={{ fontSize: 10, color: COLORS.textMuted }}>Il rendimento dei tuoi investimenti negli ultimi 21 giorni</Text>
              </View>
            </View>

            {/* ROI Table */}
            <View style={{ borderTopWidth: 1, borderTopColor: COLORS.cardBorder }}>
              {/* Header */}
              <View style={{ flexDirection: 'row', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder }}>
                <Text style={{ flex: 2, fontSize: 9, color: COLORS.textMuted, fontWeight: '700' }}>INVESTIMENTO</Text>
                <Text style={{ flex: 1, fontSize: 9, color: COLORS.textMuted, fontWeight: '700', textAlign: 'center' }}>ATTIVITÀ</Text>
                <Text style={{ flex: 1.5, fontSize: 9, color: COLORS.textMuted, fontWeight: '700', textAlign: 'center' }}>MATURAZIONE</Text>
                <Text style={{ flex: 2, fontSize: 9, color: COLORS.textMuted, fontWeight: '700', textAlign: 'right' }}>RENDIMENTO</Text>
              </View>

              {/* Rows */}
              {trainingRoi.map((roi: any, i: number) => {
                const colors = { neuromuscular: '#f59e0b', metabolic: '#f97316', structural: '#ef4444' };
                const color = colors[roi.category as keyof typeof colors] || COLORS.textMuted;
                return (
                  <View key={i} style={{
                    flexDirection: 'row', paddingVertical: SPACING.sm, alignItems: 'center',
                    borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder + '30',
                  }}>
                    <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontSize: 16 }}>{roi.icon}</Text>
                      <View>
                        <Text style={{ fontSize: 11, color: color, fontWeight: '700' }}>{roi.label}</Text>
                        <Text style={{ fontSize: 8, color: COLORS.textMuted }}>{roi.km} km</Text>
                      </View>
                    </View>
                    <Text style={{ flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '800', textAlign: 'center' }}>
                      {roi.runs}
                    </Text>
                    <View style={{ flex: 1.5, alignItems: 'center' }}>
                      <View style={{
                        backgroundColor: color + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
                      }}>
                        <Text style={{ fontSize: 9, color: color, fontWeight: '700' }}>{roi.timeline}</Text>
                      </View>
                    </View>
                    <Text style={{ flex: 2, fontSize: 9, color: COLORS.textSecondary, textAlign: 'right', fontWeight: '600' }}>
                      {roi.benefit}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Summary insight */}
            <View style={{
              marginTop: SPACING.md, backgroundColor: '#8b5cf608',
              borderRadius: BORDER_RADIUS.sm, padding: SPACING.sm,
              borderLeftWidth: 3, borderLeftColor: '#8b5cf6',
            }}>
              <Text style={{ fontSize: 10, color: COLORS.textSecondary, lineHeight: 16 }}>
                {(() => {
                  const total = trainingRoi.reduce((s: number, r: any) => s + r.runs, 0);
                  const maxCat = trainingRoi.reduce((max: any, r: any) => r.runs > max.runs ? r : max, trainingRoi[0]);
                  if (total === 0) return '🏃 Nessun allenamento negli ultimi 21 giorni. Inizia ad investire nel tuo corpo!';
                  return `📊 ${total} allenamenti investiti. Il tuo portafoglio è sbilanciato verso il settore ${maxCat?.label?.toLowerCase() || 'generico'}. ${
                    maxCat?.category === 'structural' ? 'Ottimo per costruire una base solida!' :
                    maxCat?.category === 'metabolic' ? 'Stai lavorando bene sulla soglia e l\'efficienza!' :
                    'Stai costruendo potenza e velocità!'
                  }`;
                })()}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.card,
    alignItems: 'center', justifyContent: 'center',
  },
  pageTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 1,
  },
  pageSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 1,
  },

  card: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cardTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
    color: COLORS.text,
  },

  introText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  highlight: {
    color: COLORS.lime,
    fontWeight: '700',
  },
  highlightGreen: {
    color: '#22c55e',
    fontWeight: '700',
  },

  summaryBadge: {
    flex: 1, alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
});
