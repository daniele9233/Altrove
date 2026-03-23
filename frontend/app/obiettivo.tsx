import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../src/theme';
import { api } from '../src/api';
import { Profile } from '../src/types';

export default function ObiettivoScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Goal fields
  const [raceGoal, setRaceGoal] = useState('');
  const [raceDate, setRaceDate] = useState('');
  const [targetPace, setTargetPace] = useState('');
  const [targetTime, setTargetTime] = useState('');
  const [level, setLevel] = useState('');

  // Picker visibility
  const [showRaceGoalPicker, setShowRaceGoalPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPacePicker, setShowPacePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Date picker state
  const [dateYear, setDateYear] = useState('2026');
  const [dateMonth, setDateMonth] = useState('06');
  const [dateDay, setDateDay] = useState('15');

  // Time picker state
  const [timeHours, setTimeHours] = useState('1');
  const [timeMinutes, setTimeMinutes] = useState('35');
  const [timeSeconds, setTimeSeconds] = useState('00');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const p = await api.getProfile();
      setProfile(p);
      setRaceGoal(p.race_goal || '');
      setRaceDate(p.race_date || '');
      setTargetPace(p.target_pace || '');
      setTargetTime(p.target_time || '');
      setLevel(p.level || '');
      // Parse existing date
      if (p.race_date) {
        const parts = p.race_date.split('-');
        if (parts.length === 3) {
          setDateYear(parts[0]);
          setDateMonth(parts[1]);
          setDateDay(parts[2]);
        }
      }
      // Parse existing time
      if (p.target_time) {
        const tParts = p.target_time.split(':');
        if (tParts.length === 3) {
          setTimeHours(tParts[0]);
          setTimeMinutes(tParts[1]);
          setTimeSeconds(tParts[2]);
        } else if (tParts.length === 2) {
          setTimeHours('0');
          setTimeMinutes(tParts[0]);
          setTimeSeconds(tParts[1]);
        }
      }
    } catch {
      Alert.alert('Errore', 'Impossibile caricare il profilo');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const updates: any = {};
    if (raceGoal.trim()) updates.race_goal = raceGoal.trim();
    if (raceDate.trim()) updates.race_date = raceDate.trim();
    if (targetPace.trim()) updates.target_pace = targetPace.trim();
    if (targetTime.trim()) updates.target_time = targetTime.trim();
    if (level.trim()) updates.level = level.trim();
    if (Object.keys(updates).length === 0) {
      Alert.alert('Attenzione', 'Nessun campo compilato');
      return;
    }
    setSaving(true);
    try {
      const updated = await api.updateProfile(updates);
      setProfile(updated);
      Alert.alert('Salvato', 'Obiettivo aggiornato con successo');
    } catch {
      Alert.alert('Errore', 'Impossibile salvare');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    // First save, then regenerate
    const updates: any = {};
    if (raceGoal.trim()) updates.race_goal = raceGoal.trim();
    if (raceDate.trim()) updates.race_date = raceDate.trim();
    if (targetPace.trim()) updates.target_pace = targetPace.trim();
    if (targetTime.trim()) updates.target_time = targetTime.trim();
    if (level.trim()) updates.level = level.trim();

    setRegenerating(true);
    try {
      if (Object.keys(updates).length > 0) {
        await api.updateProfile(updates);
      }
      const result = await api.generatePlan();
      Alert.alert(
        'Piano Rigenerato',
        result.message || 'Il tuo piano di allenamento è stato rigenerato in base al nuovo obiettivo.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch {
      Alert.alert('Errore', 'Impossibile rigenerare il piano');
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.lime} /></View>
      </SafeAreaView>
    );
  }

  const mNames = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>OBIETTIVO GARA</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Current goal summary */}
        {profile?.race_goal && (
          <View style={styles.currentGoal}>
            <Text style={styles.currentGoalLabel}>OBIETTIVO ATTUALE</Text>
            <Text style={styles.currentGoalValue}>{profile.race_goal}</Text>
            <View style={styles.currentGoalDetails}>
              {profile.race_date && <Text style={styles.currentGoalDetail}>{profile.race_date}</Text>}
              {profile.target_pace && <Text style={styles.currentGoalDetail}>{profile.target_pace}/km</Text>}
              {profile.target_time && <Text style={styles.currentGoalDetail}>{profile.target_time}</Text>}
              {profile.level && <Text style={[styles.currentGoalDetail, { textTransform: 'capitalize' }]}>{profile.level}</Text>}
            </View>
          </View>
        )}

        {/* GARA Dropdown */}
        <Text style={styles.label}>GARA</Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setShowRaceGoalPicker(!showRaceGoalPicker)}
        >
          <Text style={{ color: raceGoal ? COLORS.text : COLORS.textMuted, fontSize: FONT_SIZES.body }}>
            {raceGoal || 'Seleziona distanza'}
          </Text>
          <Ionicons name={showRaceGoalPicker ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
        {showRaceGoalPicker && (
          <View style={styles.pickerContainer}>
            {['5K', '10K', 'Mezza Maratona', 'Maratona', '15K', '30K', 'Ultra Trail'].map(goal => (
              <TouchableOpacity
                key={goal}
                onPress={() => { setRaceGoal(goal); setShowRaceGoalPicker(false); }}
                style={[styles.pickerItem, raceGoal === goal && styles.pickerItemActive]}
              >
                <Text style={{ color: raceGoal === goal ? COLORS.lime : COLORS.text, fontSize: FONT_SIZES.body, fontWeight: raceGoal === goal ? '700' : '400' }}>{goal}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* DATA GARA */}
        <Text style={styles.label}>DATA GARA</Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => {
            if (raceDate) {
              const parts = raceDate.split('-');
              if (parts.length === 3) { setDateYear(parts[0]); setDateMonth(parts[1]); setDateDay(parts[2]); }
            }
            setShowDatePicker(!showDatePicker);
          }}
        >
          <Text style={{ color: raceDate ? COLORS.text : COLORS.textMuted, fontSize: FONT_SIZES.body }}>
            {raceDate || 'Seleziona data'}
          </Text>
          <Ionicons name="calendar" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
        {showDatePicker && (
          <View style={styles.datePickerBox}>
            <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.dateColLabel}>ANNO</Text>
                <ScrollView style={{ maxHeight: 140 }} nestedScrollEnabled>
                  {['2025', '2026', '2027', '2028', '2029', '2030'].map(y => (
                    <TouchableOpacity key={y} onPress={() => setDateYear(y)}
                      style={[styles.dateOption, dateYear === y && styles.dateOptionActive]}>
                      <Text style={{ color: dateYear === y ? COLORS.lime : COLORS.text, fontWeight: dateYear === y ? '700' : '400', fontSize: FONT_SIZES.body }}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dateColLabel}>MESE</Text>
                <ScrollView style={{ maxHeight: 140 }} nestedScrollEnabled>
                  {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => (
                    <TouchableOpacity key={m} onPress={() => setDateMonth(m)}
                      style={[styles.dateOption, dateMonth === m && styles.dateOptionActive]}>
                      <Text style={{ color: dateMonth === m ? COLORS.lime : COLORS.text, fontWeight: dateMonth === m ? '700' : '400', fontSize: FONT_SIZES.body }}>{mNames[parseInt(m)-1]}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dateColLabel}>GIORNO</Text>
                <ScrollView style={{ maxHeight: 140 }} nestedScrollEnabled>
                  {Array.from({length: 31}, (_, i) => String(i+1).padStart(2, '0')).map(d => (
                    <TouchableOpacity key={d} onPress={() => setDateDay(d)}
                      style={[styles.dateOption, dateDay === d && styles.dateOptionActive]}>
                      <Text style={{ color: dateDay === d ? COLORS.lime : COLORS.text, fontWeight: dateDay === d ? '700' : '400', fontSize: FONT_SIZES.body }}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => { setRaceDate(`${dateYear}-${dateMonth}-${dateDay}`); setShowDatePicker(false); }}
              style={styles.confirmBtn}
            >
              <Text style={styles.confirmBtnText}>CONFERMA DATA</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* PASSO OBIETTIVO */}
        <Text style={styles.label}>PASSO OBIETTIVO (/KM)</Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setShowPacePicker(!showPacePicker)}
        >
          <Text style={{ color: targetPace ? COLORS.text : COLORS.textMuted, fontSize: FONT_SIZES.body }}>
            {targetPace ? `${targetPace}/km` : 'Seleziona passo'}
          </Text>
          <Ionicons name={showPacePicker ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
        {showPacePicker && (
          <View style={styles.pickerContainer}>
            <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
              {['3:30','3:40','3:45','3:50','4:00','4:05','4:10','4:15','4:20','4:25','4:30','4:35','4:40','4:45','4:50','5:00','5:10','5:15','5:20','5:30','5:40','5:45','5:50','6:00','6:15','6:30','6:45','7:00','7:30','8:00'].map(p => (
                <TouchableOpacity
                  key={p}
                  onPress={() => { setTargetPace(p); setShowPacePicker(false); }}
                  style={[styles.pickerItem, targetPace === p && styles.pickerItemActive]}
                >
                  <Text style={{ color: targetPace === p ? COLORS.lime : COLORS.text, fontSize: FONT_SIZES.body, fontWeight: targetPace === p ? '700' : '400' }}>{p}/km</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* TEMPO OBIETTIVO */}
        <Text style={styles.label}>TEMPO OBIETTIVO</Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setShowTimePicker(!showTimePicker)}
        >
          <Text style={{ color: targetTime ? COLORS.text : COLORS.textMuted, fontSize: FONT_SIZES.body }}>
            {targetTime || 'Seleziona tempo'}
          </Text>
          <Ionicons name="time" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
        {showTimePicker && (
          <View style={styles.datePickerBox}>
            <View style={{ flexDirection: 'row', gap: SPACING.xs, alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.dateColLabel, { fontWeight: '700' }]}>ORE</Text>
                <ScrollView style={{ maxHeight: 140 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  {['0','1','2','3','4','5','6'].map(h => (
                    <TouchableOpacity key={h} onPress={() => setTimeHours(h)}
                      style={[styles.dateOption, timeHours === h && styles.dateOptionActive]}>
                      <Text style={{ color: timeHours === h ? COLORS.lime : COLORS.text, fontWeight: timeHours === h ? '700' : '400', fontSize: FONT_SIZES.lg }}>{h}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <Text style={{ color: COLORS.textMuted, fontSize: FONT_SIZES.xl, fontWeight: '700' }}>:</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.dateColLabel, { fontWeight: '700' }]}>MIN</Text>
                <ScrollView style={{ maxHeight: 140 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  {Array.from({length: 60}, (_, i) => String(i).padStart(2, '0')).map(m => (
                    <TouchableOpacity key={m} onPress={() => setTimeMinutes(m)}
                      style={[styles.dateOption, timeMinutes === m && styles.dateOptionActive]}>
                      <Text style={{ color: timeMinutes === m ? COLORS.lime : COLORS.text, fontWeight: timeMinutes === m ? '700' : '400', fontSize: FONT_SIZES.lg }}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <Text style={{ color: COLORS.textMuted, fontSize: FONT_SIZES.xl, fontWeight: '700' }}>:</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.dateColLabel, { fontWeight: '700' }]}>SEC</Text>
                <ScrollView style={{ maxHeight: 140 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  {Array.from({length: 60}, (_, i) => String(i).padStart(2, '0')).map(s => (
                    <TouchableOpacity key={s} onPress={() => setTimeSeconds(s)}
                      style={[styles.dateOption, timeSeconds === s && styles.dateOptionActive]}>
                      <Text style={{ color: timeSeconds === s ? COLORS.lime : COLORS.text, fontWeight: timeSeconds === s ? '700' : '400', fontSize: FONT_SIZES.lg }}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => { setTargetTime(`${timeHours}:${timeMinutes}:${timeSeconds}`); setShowTimePicker(false); }}
              style={styles.confirmBtn}
            >
              <Text style={styles.confirmBtnText}>CONFERMA TEMPO</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* LIVELLO */}
        <Text style={styles.label}>LIVELLO</Text>
        <View style={{ flexDirection: 'row', gap: SPACING.sm, marginHorizontal: SPACING.xl, marginBottom: SPACING.xl }}>
          {['principiante', 'intermedio', 'avanzato'].map(lev => (
            <TouchableOpacity
              key={lev}
              onPress={() => setLevel(lev)}
              style={{
                flex: 1, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md,
                backgroundColor: level === lev ? COLORS.lime + '30' : COLORS.card,
                borderWidth: 1, borderColor: level === lev ? COLORS.lime : COLORS.cardBorder,
                alignItems: 'center',
              }}
            >
              <Text style={{
                fontSize: FONT_SIZES.sm, fontWeight: '700',
                color: level === lev ? COLORS.lime : COLORS.textMuted,
                textTransform: 'uppercase',
              }}>{lev}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.limeDark} />
            ) : (
              <>
                <Ionicons name="save" size={18} color={COLORS.limeDark} />
                <Text style={styles.saveBtnText}>SALVA OBIETTIVO</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.regenerateBtn} onPress={handleRegenerate} disabled={regenerating}>
            {regenerating ? (
              <ActivityIndicator size="small" color={COLORS.text} />
            ) : (
              <>
                <Ionicons name="refresh" size={18} color={COLORS.orange} />
                <Text style={styles.regenerateBtnText}>RIGENERA OBIETTIVO</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.regenerateNote}>
            Rigenera il piano di allenamento in base al nuovo obiettivo. Il piano attuale verr&agrave; sostituito.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FONT_SIZES.lg, color: COLORS.text, fontWeight: '900', letterSpacing: 2 },
  scrollContent: { paddingTop: SPACING.md },

  currentGoal: {
    marginHorizontal: SPACING.xl, marginBottom: SPACING.xl, padding: SPACING.lg,
    backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.lime + '30',
  },
  currentGoalLabel: { fontSize: FONT_SIZES.xs, color: COLORS.lime, fontWeight: '700', letterSpacing: 2 },
  currentGoalValue: { fontSize: FONT_SIZES.xxl, color: COLORS.text, fontWeight: '900', marginTop: SPACING.xs },
  currentGoalDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginTop: SPACING.sm },
  currentGoalDetail: {
    fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, backgroundColor: COLORS.bg,
    paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.sm,
  },

  label: {
    fontSize: FONT_SIZES.xs, color: COLORS.lime, fontWeight: '700', letterSpacing: 2,
    marginHorizontal: SPACING.xl, marginTop: SPACING.lg, marginBottom: SPACING.sm,
  },
  selector: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: SPACING.xl, paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  pickerContainer: {
    marginHorizontal: SPACING.xl, backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.cardBorder, marginTop: SPACING.xs, overflow: 'hidden',
  },
  pickerItem: {
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder,
  },
  pickerItemActive: { backgroundColor: COLORS.lime + '20' },

  datePickerBox: {
    marginHorizontal: SPACING.xl, backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.cardBorder, marginTop: SPACING.xs, padding: SPACING.md,
  },
  dateColLabel: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginBottom: 4, textAlign: 'center' },
  dateOption: { paddingVertical: 6, alignItems: 'center', borderRadius: 6 },
  dateOptionActive: { backgroundColor: COLORS.lime + '20' },
  confirmBtn: {
    marginTop: SPACING.md, backgroundColor: COLORS.lime, borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.sm, alignItems: 'center',
  },
  confirmBtnText: { color: COLORS.limeDark, fontWeight: '700', fontSize: FONT_SIZES.sm },

  actions: { marginHorizontal: SPACING.xl, marginTop: SPACING.lg },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.lime, borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.lg,
  },
  saveBtnText: { color: COLORS.limeDark, fontWeight: '900', fontSize: FONT_SIZES.body, letterSpacing: 1 },
  regenerateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.lg, marginTop: SPACING.md,
    borderWidth: 1, borderColor: COLORS.orange + '40',
  },
  regenerateBtnText: { color: COLORS.orange, fontWeight: '900', fontSize: FONT_SIZES.body, letterSpacing: 1 },
  regenerateNote: {
    fontSize: FONT_SIZES.xs, color: COLORS.textMuted, textAlign: 'center',
    marginTop: SPACING.sm, lineHeight: 16,
  },
});
