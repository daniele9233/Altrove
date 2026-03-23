import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../src/theme';
import { api } from '../src/api';

const TEST_TYPES = [
  { key: '6km_time_trial', label: '6km Time Trial' },
  { key: '10km_time_trial', label: '10km Time Trial' },
  { key: '15km_time_trial', label: '15km Time Trial' },
  { key: 'cooper_test', label: 'Test di Cooper' },
];

const FEASIBILITY_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  raggiungibile: { icon: 'checkmark-circle', color: '#22c55e', label: 'Raggiungibile' },
  ambizioso: { icon: 'flame', color: COLORS.orange, label: 'Ambizioso' },
  molto_ambizioso: { icon: 'warning', color: '#ef4444', label: 'Molto Ambizioso' },
};

interface AdaptResult {
  adapted: boolean;
  old_vdot: number | null;
  measured_vdot: number;
  training_vdot: number;
  vdot_change: number;
  old_paces: Record<string, string>;
  new_paces: Record<string, string>;
  weeks_updated: number;
  volume_adjustment_pct: number;
  feasibility: string;
  feasibility_detail: string;
  message: string;
}

export default function AddTestScreen() {
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [testType, setTestType] = useState('6km_time_trial');
  const [distance, setDistance] = useState('6');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [avgHr, setAvgHr] = useState('');
  const [maxHr, setMaxHr] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [adaptResult, setAdaptResult] = useState<AdaptResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSave = async () => {
    if (!distance || !minutes) {
      Alert.alert('Errore', 'Inserisci distanza e durata');
      return;
    }

    const distKm = parseFloat(distance);
    const durationMin = parseInt(minutes) + (parseInt(seconds || '0') / 60);
    const totalSec = durationMin * 60 / distKm;
    const pace = `${Math.floor(totalSec / 60)}:${String(Math.round(totalSec % 60)).padStart(2, '0')}`;

    setSaving(true);
    try {
      const result = await api.adaptFromTest({
        date,
        test_type: testType,
        distance_km: distKm,
        duration_minutes: Math.round(durationMin * 100) / 100,
        avg_pace: pace,
        avg_hr: avgHr ? parseInt(avgHr) : undefined,
        max_hr: maxHr ? parseInt(maxHr) : undefined,
        notes: notes || undefined,
      });
      setAdaptResult(result);
      setShowResult(true);
    } catch (e) {
      Alert.alert('Errore', 'Impossibile salvare il test');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setShowResult(false);
    router.back();
  };

  const feasCfg = adaptResult ? (FEASIBILITY_CONFIG[adaptResult.feasibility] || FEASIBILITY_CONFIG.raggiungibile) : null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity testID="close-test-btn" onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>NUOVO TEST</Text>
          <TouchableOpacity testID="save-test-btn" onPress={handleSave} style={styles.saveBtn} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? '...' : 'SALVA'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
          <Text style={styles.label}>DATA</Text>
          <TextInput
            testID="test-date-input"
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.textMuted}
          />

          <Text style={styles.label}>TIPO DI TEST</Text>
          <View style={styles.typeGrid}>
            {TEST_TYPES.map(t => (
              <TouchableOpacity
                key={t.key}
                testID={`test-type-${t.key}`}
                style={[styles.typeChip, testType === t.key && styles.typeChipActive]}
                onPress={() => {
                  setTestType(t.key);
                  if (t.key.includes('6km')) setDistance('6');
                  else if (t.key.includes('10km')) setDistance('10');
                  else if (t.key.includes('15km')) setDistance('15');
                }}
              >
                <Text style={[styles.typeChipText, testType === t.key && styles.typeChipTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>DISTANZA (KM)</Text>
          <TextInput
            testID="test-distance-input"
            style={styles.input}
            value={distance}
            onChangeText={setDistance}
            keyboardType="decimal-pad"
            placeholderTextColor={COLORS.textMuted}
          />

          <Text style={styles.label}>DURATA</Text>
          <View style={styles.row}>
            <TextInput
              testID="test-minutes-input"
              style={[styles.input, styles.halfInput]}
              value={minutes}
              onChangeText={setMinutes}
              keyboardType="number-pad"
              placeholder="Minuti"
              placeholderTextColor={COLORS.textMuted}
            />
            <Text style={styles.colon}>:</Text>
            <TextInput
              testID="test-seconds-input"
              style={[styles.input, styles.halfInput]}
              value={seconds}
              onChangeText={setSeconds}
              keyboardType="number-pad"
              placeholder="Secondi"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <Text style={styles.label}>FREQUENZA CARDIACA</Text>
          <View style={styles.row}>
            <TextInput
              testID="test-avg-hr-input"
              style={[styles.input, styles.halfInput]}
              value={avgHr}
              onChangeText={setAvgHr}
              keyboardType="number-pad"
              placeholder="FC Media"
              placeholderTextColor={COLORS.textMuted}
            />
            <TextInput
              testID="test-max-hr-input"
              style={[styles.input, styles.halfInput]}
              value={maxHr}
              onChangeText={setMaxHr}
              keyboardType="number-pad"
              placeholder="FC Max"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <Text style={styles.label}>NOTE</Text>
          <TextInput
            testID="test-notes-input"
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Sensazioni, condizioni..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={3}
          />

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Adaptation Result Modal */}
      <Modal visible={showResult} transparent animationType="slide">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.card}>
            {adaptResult && (
              <>
                {/* Header */}
                <View style={modalStyles.header}>
                  <Ionicons
                    name={adaptResult.adapted ? 'trending-up' : 'checkmark-circle'}
                    size={32}
                    color={adaptResult.adapted ? COLORS.lime : COLORS.textMuted}
                  />
                  <Text style={modalStyles.title}>
                    {adaptResult.adapted ? 'PIANO ADATTATO' : 'TEST SALVATO'}
                  </Text>
                </View>

                {/* VDOT Change */}
                <View style={modalStyles.vdotRow}>
                  <View style={modalStyles.vdotBox}>
                    <Text style={modalStyles.vdotLabel}>VDOT PRIMA</Text>
                    <Text style={modalStyles.vdotValue}>{adaptResult.old_vdot ?? 'N/D'}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={20} color={COLORS.textMuted} />
                  <View style={modalStyles.vdotBox}>
                    <Text style={modalStyles.vdotLabel}>VDOT ORA</Text>
                    <Text style={[modalStyles.vdotValue, { color: COLORS.lime }]}>{adaptResult.training_vdot}</Text>
                  </View>
                  {adaptResult.vdot_change !== 0 && (
                    <View style={[modalStyles.changeBadge, {
                      backgroundColor: adaptResult.vdot_change > 0 ? '#22c55e20' : '#ef444420'
                    }]}>
                      <Text style={[modalStyles.changeText, {
                        color: adaptResult.vdot_change > 0 ? '#22c55e' : '#ef4444'
                      }]}>
                        {adaptResult.vdot_change > 0 ? '+' : ''}{adaptResult.vdot_change}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Paces comparison */}
                {adaptResult.adapted && adaptResult.new_paces && (
                  <View style={modalStyles.pacesSection}>
                    <Text style={modalStyles.sectionLabel}>NUOVI RITMI</Text>
                    {['easy', 'threshold', 'interval', 'marathon'].map(zone => {
                      const oldP = adaptResult.old_paces?.[zone];
                      const newP = adaptResult.new_paces?.[zone];
                      if (!newP) return null;
                      const labels: Record<string, string> = {
                        easy: 'Easy', threshold: 'Soglia', interval: 'Intervallo', marathon: 'Maratona'
                      };
                      return (
                        <View key={zone} style={modalStyles.paceRow}>
                          <Text style={modalStyles.paceZone}>{labels[zone] || zone}</Text>
                          <Text style={modalStyles.paceOld}>{oldP || '-'}</Text>
                          <Ionicons name="arrow-forward" size={12} color={COLORS.textMuted} />
                          <Text style={modalStyles.paceNew}>{newP}/km</Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Stats */}
                {adaptResult.adapted && (
                  <View style={modalStyles.statsRow}>
                    <View style={modalStyles.statBox}>
                      <Text style={modalStyles.statValue}>{adaptResult.weeks_updated}</Text>
                      <Text style={modalStyles.statLabel}>Settimane aggiornate</Text>
                    </View>
                    <View style={modalStyles.statBox}>
                      <Text style={modalStyles.statValue}>
                        {adaptResult.volume_adjustment_pct > 0 ? '+' : ''}{adaptResult.volume_adjustment_pct}%
                      </Text>
                      <Text style={modalStyles.statLabel}>Volume</Text>
                    </View>
                  </View>
                )}

                {/* Feasibility */}
                {adaptResult.adapted && feasCfg && (
                  <View style={[modalStyles.feasibilityBox, { borderColor: feasCfg.color + '40' }]}>
                    <Ionicons name={feasCfg.icon as any} size={20} color={feasCfg.color} />
                    <View style={{ flex: 1 }}>
                      <Text style={[modalStyles.feasibilityLabel, { color: feasCfg.color }]}>
                        Obiettivo: {feasCfg.label}
                      </Text>
                      {adaptResult.feasibility_detail ? (
                        <Text style={modalStyles.feasibilityDetail}>{adaptResult.feasibility_detail}</Text>
                      ) : null}
                    </View>
                  </View>
                )}

                {/* Message for non-adapted */}
                {!adaptResult.adapted && (
                  <Text style={modalStyles.message}>{adaptResult.message}</Text>
                )}

                {/* Close button */}
                <TouchableOpacity style={modalStyles.closeBtn} onPress={handleClose}>
                  <Text style={modalStyles.closeBtnText}>CHIUDI</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
  },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '700', letterSpacing: 2 },
  saveBtn: {
    backgroundColor: COLORS.lime, borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
  },
  saveBtnText: { fontSize: FONT_SIZES.sm, color: COLORS.limeDark, fontWeight: '800' },
  form: { paddingHorizontal: SPACING.xl },
  label: {
    fontSize: FONT_SIZES.xs, color: COLORS.textMuted, fontWeight: '700',
    letterSpacing: 1, marginTop: SPACING.lg, marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.body, color: COLORS.text,
  },
  halfInput: { flex: 1 },
  row: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' },
  colon: { fontSize: FONT_SIZES.xl, color: COLORS.textMuted, fontWeight: '700' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  typeChip: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
  },
  typeChipActive: { backgroundColor: COLORS.lime, borderColor: COLORS.lime },
  typeChipText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '600' },
  typeChipTextActive: { color: COLORS.limeDark },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: SPACING.md },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center', padding: SPACING.xl,
  },
  card: {
    width: '100%', backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  header: {
    alignItems: 'center', marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.lg, color: COLORS.text, fontWeight: '900',
    letterSpacing: 2, marginTop: SPACING.sm,
  },
  vdotRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.md, marginBottom: SPACING.lg,
  },
  vdotBox: { alignItems: 'center' },
  vdotLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 1 },
  vdotValue: { fontSize: 28, color: COLORS.text, fontWeight: '900', marginTop: 2 },
  changeBadge: {
    borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 4,
  },
  changeText: { fontSize: FONT_SIZES.sm, fontWeight: '800' },
  pacesSection: {
    backgroundColor: COLORS.bg, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  sectionLabel: {
    fontSize: FONT_SIZES.xs, color: COLORS.lime, fontWeight: '700',
    letterSpacing: 1, marginBottom: SPACING.sm,
  },
  paceRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingVertical: 4,
  },
  paceZone: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '600', width: 80 },
  paceOld: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted },
  paceNew: { fontSize: FONT_SIZES.sm, color: COLORS.lime, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg,
  },
  statBox: {
    flex: 1, alignItems: 'center', backgroundColor: COLORS.bg,
    borderRadius: BORDER_RADIUS.md, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  statValue: { fontSize: FONT_SIZES.xl, color: COLORS.text, fontWeight: '900' },
  statLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  feasibilityBox: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    padding: SPACING.md, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, marginBottom: SPACING.lg,
    backgroundColor: COLORS.bg,
  },
  feasibilityLabel: { fontSize: FONT_SIZES.sm, fontWeight: '700' },
  feasibilityDetail: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2, lineHeight: 16 },
  message: {
    fontSize: FONT_SIZES.md, color: COLORS.textSecondary,
    textAlign: 'center', lineHeight: 22, marginBottom: SPACING.lg,
  },
  closeBtn: {
    backgroundColor: COLORS.lime, borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.md, alignItems: 'center',
  },
  closeBtnText: {
    fontSize: FONT_SIZES.body, color: COLORS.limeDark, fontWeight: '800', letterSpacing: 1,
  },
});
