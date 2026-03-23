import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from './theme';
import { api } from './api';

const TOTAL_STEPS = 5;

const RACE_OPTIONS = ['5km', '10km', 'Mezza Maratona', 'Maratona', 'Altro'];
const LEVEL_OPTIONS = [
  { key: 'principiante', label: 'Principiante', desc: 'Corro da meno di 1 anno', icon: 'walk' },
  { key: 'intermedio', label: 'Intermedio', desc: 'Corro da 1-3 anni', icon: 'fitness' },
  { key: 'avanzato', label: 'Avanzato', desc: 'Corro da 3+ anni', icon: 'flash' },
];

interface OnboardingProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1: Profilo base
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');

  // Step 2: FC
  const [maxHr, setMaxHr] = useState('');

  // Step 3: Obiettivo
  const [raceGoal, setRaceGoal] = useState('');
  const [customRaceGoal, setCustomRaceGoal] = useState('');
  const [raceDate, setRaceDate] = useState('');
  const [targetTime, setTargetTime] = useState('');
  const [targetPace, setTargetPace] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showPacePicker, setShowPacePicker] = useState(false);
  const [dateYear, setDateYear] = useState('2026');
  const [dateMonth, setDateMonth] = useState('06');
  const [dateDay, setDateDay] = useState('15');

  // Step 4: Livello
  const [level, setLevel] = useState('');
  const [startedRunning, setStartedRunning] = useState('');
  const [maxWeeklyKm, setMaxWeeklyKm] = useState('');

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return name.trim().length > 0;
      case 1: return true; // FC optional
      case 2: return true; // Obiettivo optional (can set later)
      case 3: return level.length > 0;
      case 4: return true; // Summary, always can proceed
      default: return true;
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      // First seed the database (creates empty profile)
      try { await api.seed(); } catch {}

      // Build profile data
      const finalRaceGoal = raceGoal === 'Altro' ? customRaceGoal : raceGoal;
      const profileData: any = {};
      if (name.trim()) profileData.name = name.trim();
      if (age) profileData.age = parseInt(age);
      if (weightKg) profileData.weight_kg = parseFloat(weightKg);
      if (heightCm) profileData.height_cm = parseInt(heightCm);
      if (maxHr) profileData.max_hr = parseInt(maxHr);
      if (finalRaceGoal) profileData.race_goal = finalRaceGoal;
      if (raceDate) profileData.race_date = raceDate;
      if (targetTime) profileData.target_time = targetTime;
      if (targetPace) profileData.target_pace = targetPace;
      if (level) profileData.level = level;
      if (startedRunning) profileData.started_running = startedRunning;
      if (maxWeeklyKm) profileData.max_weekly_km = parseInt(maxWeeklyKm);

      // Update profile
      await api.updateProfile(profileData);

      // Generate training plan if we have enough data
      if (finalRaceGoal && raceDate) {
        try {
          await api.generatePlan();
        } catch (e) {
          console.log('Plan generation skipped:', e);
        }
      }

      // Mark onboarding as complete
      await AsyncStorage.setItem('onboarding_completed', 'true');
      onComplete();
    } catch (e: any) {
      Alert.alert('Errore', 'Impossibile salvare il profilo. Riprova.');
      console.error('Onboarding error:', e);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.stepDot,
            i === step && styles.stepDotActive,
            i < step && styles.stepDotCompleted,
          ]}
        />
      ))}
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 0: return renderStepProfile();
      case 1: return renderStepHR();
      case 2: return renderStepGoal();
      case 3: return renderStepLevel();
      case 4: return renderStepSummary();
      default: return null;
    }
  };

  // ─── STEP 1: Profilo ────────────────────────────
  const renderStepProfile = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.motto}>sic transit gloria mundi</Text>
        <View style={{ height: SPACING.lg }} />
        <Ionicons name="person" size={40} color={COLORS.lime} />
        <Text style={styles.stepTitle}>Chi sei?</Text>
        <Text style={styles.stepSubtitle}>Iniziamo con le informazioni base</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>NOME *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Il tuo nome"
          placeholderTextColor={COLORS.textMuted}
          autoFocus
        />
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>ETÀ</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder="30"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="number-pad"
          />
        </View>
        <View style={{ width: SPACING.lg }} />
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>PESO (kg)</Text>
          <TextInput
            style={styles.input}
            value={weightKg}
            onChangeText={setWeightKg}
            placeholder="70"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>ALTEZZA (cm)</Text>
        <TextInput
          style={styles.input}
          value={heightCm}
          onChangeText={setHeightCm}
          placeholder="175"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="number-pad"
        />
      </View>
    </View>
  );

  // ─── STEP 2: FC ─────────────────────────────────
  const renderStepHR = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Ionicons name="heart" size={40} color={COLORS.red} />
        <Text style={styles.stepTitle}>Frequenza cardiaca</Text>
        <Text style={styles.stepSubtitle}>Se la conosci, inserisci la tua FC massima</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>FC MASSIMA (bpm)</Text>
        <TextInput
          style={styles.input}
          value={maxHr}
          onChangeText={setMaxHr}
          placeholder={age ? `~${220 - parseInt(age)} (stima)` : '180'}
          placeholderTextColor={COLORS.textMuted}
          keyboardType="number-pad"
          autoFocus
        />
      </View>

      <View style={styles.tipCard}>
        <Ionicons name="information-circle" size={20} color={COLORS.blue} />
        <Text style={styles.tipText}>
          Se non la conosci, puoi stimarla con la formula 220 - età{age ? ` = ${220 - parseInt(age)} bpm` : ''}.{'\n'}
          Potrai aggiornarla in seguito nelle impostazioni del profilo.
        </Text>
      </View>
    </View>
  );

  // ─── STEP 3: Obiettivo ──────────────────────────
  const renderStepGoal = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Ionicons name="trophy" size={40} color={COLORS.orange} />
        <Text style={styles.stepTitle}>Il tuo obiettivo</Text>
        <Text style={styles.stepSubtitle}>Quale gara stai preparando?</Text>
      </View>

      <View style={styles.optionsGrid}>
        {RACE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.optionChip, raceGoal === opt && styles.optionChipActive]}
            onPress={() => setRaceGoal(opt)}
          >
            <Text style={[styles.optionChipText, raceGoal === opt && styles.optionChipTextActive]}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {raceGoal === 'Altro' && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>DISTANZA / EVENTO</Text>
          <TextInput
            style={styles.input}
            value={customRaceGoal}
            onChangeText={setCustomRaceGoal}
            placeholder="es. Trail 30km, Ultramaratona..."
            placeholderTextColor={COLORS.textMuted}
          />
        </View>
      )}

      {raceGoal ? (
        <>
          {/* DATA GARA — Selettore anno/mese/giorno */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>DATA GARA</Text>
            <TouchableOpacity
              style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
              onPress={() => { setShowDatePicker(!showDatePicker); setShowTimePicker(false); setShowPacePicker(false); }}
            >
              <Text style={{ color: raceDate ? COLORS.text : COLORS.textMuted, fontSize: FONT_SIZES.lg }}>
                {raceDate || 'Seleziona data'}
              </Text>
              <Ionicons name="calendar" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
            {showDatePicker && (
              <View style={{ backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.cardBorder, padding: SPACING.md, marginTop: SPACING.xs }}>
                <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginBottom: 4, textAlign: 'center', fontWeight: '700' }}>ANNO</Text>
                    <ScrollView style={{ maxHeight: 130 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                      {['2025', '2026', '2027', '2028', '2029', '2030'].map(y => (
                        <TouchableOpacity key={y} onPress={() => setDateYear(y)}
                          style={{ paddingVertical: 8, alignItems: 'center', backgroundColor: dateYear === y ? COLORS.lime + '20' : 'transparent', borderRadius: 8 }}>
                          <Text style={{ color: dateYear === y ? COLORS.lime : COLORS.text, fontWeight: dateYear === y ? '700' : '400', fontSize: FONT_SIZES.body }}>{y}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginBottom: 4, textAlign: 'center', fontWeight: '700' }}>MESE</Text>
                    <ScrollView style={{ maxHeight: 130 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                      {[{k:'01',l:'Gen'},{k:'02',l:'Feb'},{k:'03',l:'Mar'},{k:'04',l:'Apr'},{k:'05',l:'Mag'},{k:'06',l:'Giu'},{k:'07',l:'Lug'},{k:'08',l:'Ago'},{k:'09',l:'Set'},{k:'10',l:'Ott'},{k:'11',l:'Nov'},{k:'12',l:'Dic'}].map(m => (
                        <TouchableOpacity key={m.k} onPress={() => setDateMonth(m.k)}
                          style={{ paddingVertical: 8, alignItems: 'center', backgroundColor: dateMonth === m.k ? COLORS.lime + '20' : 'transparent', borderRadius: 8 }}>
                          <Text style={{ color: dateMonth === m.k ? COLORS.lime : COLORS.text, fontWeight: dateMonth === m.k ? '700' : '400', fontSize: FONT_SIZES.body }}>{m.l}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginBottom: 4, textAlign: 'center', fontWeight: '700' }}>GIORNO</Text>
                    <ScrollView style={{ maxHeight: 130 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                      {Array.from({length: 31}, (_, i) => String(i+1).padStart(2, '0')).map(d => (
                        <TouchableOpacity key={d} onPress={() => setDateDay(d)}
                          style={{ paddingVertical: 8, alignItems: 'center', backgroundColor: dateDay === d ? COLORS.lime + '20' : 'transparent', borderRadius: 8 }}>
                          <Text style={{ color: dateDay === d ? COLORS.lime : COLORS.text, fontWeight: dateDay === d ? '700' : '400', fontSize: FONT_SIZES.body }}>{d}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => { setRaceDate(`${dateYear}-${dateMonth}-${dateDay}`); setShowDatePicker(false); }}
                  style={{ marginTop: SPACING.md, backgroundColor: COLORS.lime, borderRadius: BORDER_RADIUS.full, paddingVertical: SPACING.sm + 2, alignItems: 'center' }}
                >
                  <Text style={{ color: COLORS.limeDark, fontWeight: '800', fontSize: FONT_SIZES.sm }}>CONFERMA DATA</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* TEMPO TARGET — Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>TEMPO TARGET</Text>
            <TouchableOpacity
              style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
              onPress={() => { setShowTimePicker(!showTimePicker); setShowDatePicker(false); setShowPacePicker(false); }}
            >
              <Text style={{ color: targetTime ? COLORS.text : COLORS.textMuted, fontSize: FONT_SIZES.lg }}>
                {targetTime || 'Seleziona tempo'}
              </Text>
              <Ionicons name={showTimePicker ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
            {showTimePicker && (
              <View style={{ backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.cardBorder, overflow: 'hidden', marginTop: SPACING.xs }}>
                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  {(raceGoal === '5km' ? ['0:17:00','0:18:00','0:19:00','0:20:00','0:21:00','0:22:00','0:23:00','0:24:00','0:25:00','0:27:00','0:30:00','0:32:00','0:35:00','0:38:00','0:40:00'] :
                    raceGoal === '10km' ? ['0:35:00','0:37:00','0:38:00','0:40:00','0:42:00','0:45:00','0:47:00','0:50:00','0:52:00','0:55:00','0:58:00','1:00:00','1:05:00','1:10:00'] :
                    raceGoal === 'Mezza Maratona' ? ['1:15:00','1:20:00','1:25:00','1:28:00','1:30:00','1:32:00','1:35:00','1:38:00','1:40:00','1:45:00','1:50:00','1:55:00','2:00:00','2:10:00','2:20:00','2:30:00'] :
                    raceGoal === 'Maratona' ? ['2:45:00','2:50:00','2:55:00','3:00:00','3:05:00','3:10:00','3:15:00','3:20:00','3:30:00','3:40:00','3:45:00','3:50:00','4:00:00','4:15:00','4:30:00','4:45:00','5:00:00'] :
                    ['0:20:00','0:30:00','0:40:00','0:50:00','1:00:00','1:15:00','1:30:00','1:45:00','2:00:00','2:30:00','3:00:00','3:30:00','4:00:00','5:00:00']
                  ).map(t => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => { setTargetTime(t); setShowTimePicker(false); }}
                      style={{ paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, backgroundColor: targetTime === t ? COLORS.lime + '20' : 'transparent', borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder }}
                    >
                      <Text style={{ color: targetTime === t ? COLORS.lime : COLORS.text, fontSize: FONT_SIZES.lg, fontWeight: targetTime === t ? '700' : '400' }}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* PASSO TARGET — Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PASSO TARGET (/KM)</Text>
            <TouchableOpacity
              style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
              onPress={() => { setShowPacePicker(!showPacePicker); setShowDatePicker(false); setShowTimePicker(false); }}
            >
              <Text style={{ color: targetPace ? COLORS.text : COLORS.textMuted, fontSize: FONT_SIZES.lg }}>
                {targetPace ? `${targetPace}/km` : 'Seleziona passo'}
              </Text>
              <Ionicons name={showPacePicker ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
            {showPacePicker && (
              <View style={{ backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.cardBorder, overflow: 'hidden', marginTop: SPACING.xs }}>
                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  {['3:30','3:40','3:45','3:50','4:00','4:05','4:10','4:15','4:20','4:25','4:30','4:35','4:40','4:45','4:50','5:00','5:10','5:20','5:30','5:40','5:50','6:00','6:15','6:30','6:45','7:00','7:30','8:00'].map(p => (
                    <TouchableOpacity
                      key={p}
                      onPress={() => { setTargetPace(p); setShowPacePicker(false); }}
                      style={{ paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, backgroundColor: targetPace === p ? COLORS.lime + '20' : 'transparent', borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder }}
                    >
                      <Text style={{ color: targetPace === p ? COLORS.lime : COLORS.text, fontSize: FONT_SIZES.lg, fontWeight: targetPace === p ? '700' : '400' }}>{p}/km</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </>
      ) : (
        <View style={styles.tipCard}>
          <Ionicons name="information-circle" size={20} color={COLORS.blue} />
          <Text style={styles.tipText}>
            Puoi saltare questo passo e impostare il tuo obiettivo in seguito dal profilo.
          </Text>
        </View>
      )}
    </View>
  );

  // ─── STEP 4: Livello ────────────────────────────
  const renderStepLevel = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Ionicons name="speedometer" size={40} color={COLORS.blue} />
        <Text style={styles.stepTitle}>Il tuo livello</Text>
        <Text style={styles.stepSubtitle}>Questo ci aiuta a calibrare il piano</Text>
      </View>

      {LEVEL_OPTIONS.map((opt) => (
        <TouchableOpacity
          key={opt.key}
          style={[styles.levelCard, level === opt.key && styles.levelCardActive]}
          onPress={() => setLevel(opt.key)}
        >
          <Ionicons
            name={opt.icon as any}
            size={28}
            color={level === opt.key ? COLORS.lime : COLORS.textMuted}
          />
          <View style={styles.levelInfo}>
            <Text style={[styles.levelLabel, level === opt.key && styles.levelLabelActive]}>
              {opt.label}
            </Text>
            <Text style={styles.levelDesc}>{opt.desc}</Text>
          </View>
          {level === opt.key && (
            <Ionicons name="checkmark-circle" size={24} color={COLORS.lime} />
          )}
        </TouchableOpacity>
      ))}

      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>CORRI DA</Text>
          <TextInput
            style={styles.input}
            value={startedRunning}
            onChangeText={setStartedRunning}
            placeholder="2024-01"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>
        <View style={{ width: SPACING.lg }} />
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>MAX KM/SETT.</Text>
          <TextInput
            style={styles.input}
            value={maxWeeklyKm}
            onChangeText={setMaxWeeklyKm}
            placeholder="50"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="number-pad"
          />
        </View>
      </View>
    </View>
  );

  // ─── STEP 5: Riepilogo ──────────────────────────
  const renderStepSummary = () => {
    const finalGoal = raceGoal === 'Altro' ? customRaceGoal : raceGoal;
    return (
      <View style={styles.stepContent}>
        <View style={styles.stepHeader}>
          <Ionicons name="rocket" size={40} color={COLORS.lime} />
          <Text style={styles.stepTitle}>Tutto pronto!</Text>
          <Text style={styles.stepSubtitle}>Ecco il riepilogo del tuo profilo</Text>
        </View>

        <View style={styles.summaryCard}>
          <SummaryRow icon="person" label="Nome" value={name} />
          {age ? <SummaryRow icon="calendar" label="Età" value={`${age} anni`} /> : null}
          {weightKg ? <SummaryRow icon="scale" label="Peso" value={`${weightKg} kg`} /> : null}
          {heightCm ? <SummaryRow icon="resize" label="Altezza" value={`${heightCm} cm`} /> : null}
          {maxHr ? <SummaryRow icon="heart" label="FC Max" value={`${maxHr} bpm`} /> : null}
          {finalGoal ? <SummaryRow icon="trophy" label="Obiettivo" value={finalGoal} /> : null}
          {raceDate ? <SummaryRow icon="calendar" label="Data gara" value={raceDate} /> : null}
          {targetTime ? <SummaryRow icon="time" label="Tempo target" value={targetTime} /> : null}
          {targetPace ? <SummaryRow icon="speedometer" label="Passo target" value={`${targetPace}/km`} /> : null}
          <SummaryRow icon="fitness" label="Livello" value={level || '—'} />
          {maxWeeklyKm ? <SummaryRow icon="trending-up" label="Max km/sett" value={`${maxWeeklyKm} km`} /> : null}
        </View>

        {finalGoal && raceDate ? (
          <View style={[styles.tipCard, { borderColor: 'rgba(190, 242, 100, 0.3)', backgroundColor: 'rgba(190, 242, 100, 0.06)' }]}>
            <Ionicons name="sparkles" size={20} color={COLORS.lime} />
            <Text style={[styles.tipText, { color: COLORS.lime }]}>
              Il tuo piano di allenamento personalizzato verrà generato automaticamente!
            </Text>
          </View>
        ) : (
          <View style={styles.tipCard}>
            <Ionicons name="information-circle" size={20} color={COLORS.blue} />
            <Text style={styles.tipText}>
              Potrai generare il piano in seguito impostando obiettivo e data gara dal profilo.
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          {step > 0 ? (
            <TouchableOpacity onPress={handleBack} style={styles.headerBtn}>
              <Ionicons name="chevron-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerBtn} />
          )}
          <Text style={styles.headerTitle}>ALTROVE</Text>
          <View style={styles.headerBtn} />
        </View>

        {renderStepIndicator()}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStep()}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {step < TOTAL_STEPS - 1 ? (
            <>
              <TouchableOpacity
                style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
                onPress={handleNext}
                disabled={!canProceed()}
              >
                <Text style={[styles.nextBtnText, !canProceed() && styles.nextBtnTextDisabled]}>
                  Continua
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={canProceed() ? COLORS.bg : COLORS.textMuted}
                />
              </TouchableOpacity>
              {step > 0 && step < 3 && (
                <TouchableOpacity onPress={handleNext} style={styles.skipBtn}>
                  <Text style={styles.skipBtnText}>Salta per ora</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <TouchableOpacity
              style={[styles.nextBtn, styles.finishBtn]}
              onPress={handleFinish}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.bg} />
              ) : (
                <>
                  <Ionicons name="rocket" size={20} color={COLORS.bg} />
                  <Text style={styles.nextBtnText}>
                    {raceGoal && raceDate ? 'Genera il piano e inizia' : 'Inizia'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryLeft}>
        <Ionicons name={icon as any} size={18} color={COLORS.textMuted} />
        <Text style={styles.summaryLabel}>{label}</Text>
      </View>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    fontSize: FONT_SIZES.sm, color: COLORS.lime, fontWeight: '800',
    letterSpacing: 4,
  },

  // Step indicator
  stepIndicator: {
    flexDirection: 'row', justifyContent: 'center', gap: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  stepDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.cardBorder,
  },
  stepDotActive: {
    width: 24, backgroundColor: COLORS.lime,
  },
  stepDotCompleted: {
    backgroundColor: COLORS.lime + '60',
  },

  // Content
  scrollContent: {
    paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxxl,
  },
  stepContent: { gap: SPACING.xl },
  stepHeader: {
    alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md,
  },
  motto: {
    fontSize: FONT_SIZES.lg, color: COLORS.textSecondary, fontStyle: 'italic',
    letterSpacing: 3, textAlign: 'center', opacity: 0.7,
  },
  stepTitle: {
    fontSize: FONT_SIZES.xxxl, color: COLORS.text, fontWeight: '800',
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: FONT_SIZES.body, color: COLORS.textSecondary, textAlign: 'center',
  },

  // Inputs
  inputGroup: { gap: SPACING.xs },
  inputLabel: {
    fontSize: FONT_SIZES.xs, color: COLORS.textMuted, fontWeight: '700',
    letterSpacing: 2,
  },
  input: {
    backgroundColor: COLORS.inputBg, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md + 2,
    fontSize: FONT_SIZES.lg, color: COLORS.text,
  },
  inputRow: { flexDirection: 'row' },

  // Options grid (race goal chips)
  optionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm,
  },
  optionChip: {
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full, borderWidth: 1,
    borderColor: COLORS.cardBorder, backgroundColor: COLORS.card,
  },
  optionChipActive: {
    borderColor: COLORS.lime, backgroundColor: COLORS.lime + '15',
  },
  optionChipText: {
    fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '600',
  },
  optionChipTextActive: {
    color: COLORS.lime,
  },

  // Level cards
  levelCard: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.lg,
    backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  levelCardActive: {
    borderColor: COLORS.lime, backgroundColor: 'rgba(190, 242, 100, 0.06)',
  },
  levelInfo: { flex: 1 },
  levelLabel: {
    fontSize: FONT_SIZES.lg, color: COLORS.text, fontWeight: '700',
  },
  levelLabelActive: { color: COLORS.lime },
  levelDesc: {
    fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginTop: 2,
  },

  // Tip card
  tipCard: {
    flexDirection: 'row', gap: SPACING.md,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg,
    borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  tipText: {
    flex: 1, fontSize: FONT_SIZES.md, color: COLORS.textSecondary, lineHeight: 20,
  },

  // Summary
  summaryCard: {
    backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.cardBorder,
    gap: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  summaryLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  summaryLabel: { fontSize: FONT_SIZES.md, color: COLORS.textMuted },
  summaryValue: { fontSize: FONT_SIZES.md, color: COLORS.text, fontWeight: '700' },

  // Footer
  footer: {
    paddingHorizontal: SPACING.xl, paddingBottom: SPACING.lg,
    gap: SPACING.md,
  },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, backgroundColor: COLORS.lime,
    borderRadius: BORDER_RADIUS.lg, paddingVertical: SPACING.lg,
  },
  nextBtnDisabled: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  nextBtnText: {
    fontSize: FONT_SIZES.lg, color: COLORS.bg, fontWeight: '800',
  },
  nextBtnTextDisabled: { color: COLORS.textMuted },
  finishBtn: {},
  skipBtn: { alignItems: 'center', paddingVertical: SPACING.sm },
  skipBtnText: { fontSize: FONT_SIZES.md, color: COLORS.textMuted },
});
