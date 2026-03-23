import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../src/theme';

export default function MetodologiaScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>METODOLOGIA</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Intro */}
        <View style={styles.introCard}>
          <Ionicons name="book" size={28} color="#3b82f6" />
          <Text style={styles.introTitle}>Basi Scientifiche del Piano</Text>
          <Text style={styles.introText}>
            Il piano di allenamento si basa su metodologie consolidate nella scienza della corsa,
            personalizzate in base al tuo profilo, obiettivo e dati di allenamento.
          </Text>
        </View>

        {/* VDOT / Jack Daniels */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: COLORS.lime + '20' }]}>
              <Ionicons name="speedometer" size={20} color={COLORS.lime} />
            </View>
            <Text style={styles.sectionTitle}>VDOT e Jack Daniels</Text>
          </View>
          <Text style={styles.sectionText}>
            Il cuore del sistema di calcolo dei passi si basa sulla formula VDOT di Jack Daniels,
            presentata nel libro "Daniels' Running Formula" (4a edizione). Il VDOT è un indice
            di fitness aerobica che permette di stimare i ritmi di allenamento ottimali a partire
            da una prestazione di gara o test.
          </Text>
          <View style={styles.detailBox}>
            <Text style={styles.detailTitle}>Come funziona</Text>
            <Text style={styles.detailText}>
              - Da un tempo di gara si calcola il tuo VDOT (VO2max equivalente){'\n'}
              - Dal VDOT si derivano 5 zone di passo: Easy, Marathon, Threshold, Interval, Repetition{'\n'}
              - Ogni sessione del piano usa il passo corretto per il tuo livello attuale{'\n'}
              - Man mano che migliori, i passi vengono ricalcolati
            </Text>
          </View>
          <View style={styles.referenceBox}>
            <Ionicons name="document-text" size={14} color={COLORS.textMuted} />
            <Text style={styles.referenceText}>Daniels, J. (2014). Daniels' Running Formula. Human Kinetics, 4th ed.</Text>
          </View>
        </View>

        {/* Periodizzazione */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: COLORS.orange + '20' }]}>
              <Ionicons name="calendar" size={20} color={COLORS.orange} />
            </View>
            <Text style={styles.sectionTitle}>Periodizzazione a 6 Fasi</Text>
          </View>
          <Text style={styles.sectionText}>
            Il piano segue un modello di periodizzazione lineare ispirato a Daniels e Lydiard,
            suddiviso in 6 fasi progressive che costruiscono gradualmente la forma verso il giorno della gara.
          </Text>
          <View style={styles.phaseList}>
            <PhaseItem number={1} name="Base / Fondamenta" color={COLORS.blue}
              desc="Costruzione del volume aerobico. Corsa lenta, lungo progressivo. Obiettivo: adattamento muscolare e cardiovascolare." />
            <PhaseItem number={2} name="Sviluppo Aerobico" color="#22c55e"
              desc="Aumento del volume con inserimento di progressivi. Consolidamento della base aerobica." />
            <PhaseItem number={3} name="Soglia / Threshold" color={COLORS.orange}
              desc="Lavori al ritmo soglia (Tempo Run). Miglioramento della velocita' alla soglia anaerobica." />
            <PhaseItem number={4} name="Specifico / VO2max" color="#ef4444"
              desc="Ripetute e intervalli. Sviluppo della potenza aerobica massima (VO2max)." />
            <PhaseItem number={5} name="Pre-Gara / Sharpening" color="#8b5cf6"
              desc="Riduzione del volume, mantenimento dell'intensita'. Affinamento della forma." />
            <PhaseItem number={6} name="Tapering / Gara" color={COLORS.lime}
              desc="Scarico progressivo. Supercompensazione. Massima freschezza per il giorno della gara." />
          </View>
        </View>

        {/* Zone FC */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#ef444420' }]}>
              <Ionicons name="heart" size={20} color="#ef4444" />
            </View>
            <Text style={styles.sectionTitle}>Zone di Frequenza Cardiaca</Text>
          </View>
          <Text style={styles.sectionText}>
            Le zone FC sono calcolate dinamicamente dalla tua FC massima e seguono il modello
            a 5 zone basato sulle percentuali della FCmax.
          </Text>
          <View style={styles.detailBox}>
            <Text style={styles.detailTitle}>Le 5 Zone</Text>
            <Text style={styles.detailText}>
              Z1 - Recupero: &lt;65% FCmax{'\n'}
              Z2 - Aerobica: 65-80% FCmax{'\n'}
              Z3 - Tempo: 80-87% FCmax{'\n'}
              Z4 - Soglia: 87-93% FCmax{'\n'}
              Z5 - VO2max: &gt;93% FCmax
            </Text>
          </View>
        </View>

        {/* Soglia Anaerobica */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: COLORS.orange + '20' }]}>
              <Ionicons name="trending-up" size={20} color={COLORS.orange} />
            </View>
            <Text style={styles.sectionTitle}>Soglia Anaerobica (AT)</Text>
          </View>
          <Text style={styles.sectionText}>
            La soglia anaerobica viene stimata come il 78-88% della FCmax. Rappresenta l'intensita'
            massima sostenibile per periodi prolungati (30-60 min). Il miglioramento della soglia AT
            è uno dei principali indicatori di progresso nella preparazione alla gara.
          </Text>
        </View>

        {/* Adattamento Dinamico */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#8b5cf620' }]}>
              <Ionicons name="analytics" size={20} color="#8b5cf6" />
            </View>
            <Text style={styles.sectionTitle}>Adattamento Dinamico</Text>
          </View>
          <Text style={styles.sectionText}>
            Il piano non è statico: si adatta in base alle corse effettivamente completate.
            Dopo ogni sincronizzazione con Strava, il sistema analizza il volume reale,
            il rispetto dei passi target e la risposta cardiaca per valutare se è necessario
            un aggiustamento del piano.
          </Text>
        </View>

        {/* Scaling per distanza */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: COLORS.lime + '20' }]}>
              <Ionicons name="resize" size={20} color={COLORS.lime} />
            </View>
            <Text style={styles.sectionTitle}>Scaling per Distanza</Text>
          </View>
          <Text style={styles.sectionText}>
            Il volume settimanale viene scalato in base alla distanza obiettivo:
          </Text>
          <View style={styles.detailBox}>
            <Text style={styles.detailText}>
              5K: fattore 0.65x (max ~40 km/sett){'\n'}
              10K: fattore 0.8x (max ~45 km/sett){'\n'}
              Mezza Maratona: fattore 1.0x (max ~55 km/sett){'\n'}
              Maratona: fattore 1.6x (max ~80 km/sett){'\n'}
              Ultra Trail: fattore 1.8x (max ~90 km/sett)
            </Text>
          </View>
        </View>

        {/* References */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: COLORS.textMuted + '20' }]}>
              <Ionicons name="library" size={20} color={COLORS.textMuted} />
            </View>
            <Text style={styles.sectionTitle}>Riferimenti Bibliografici</Text>
          </View>
          <View style={styles.refList}>
            <Text style={styles.refItem}>Daniels, J. (2014). Daniels' Running Formula. Human Kinetics, 4th ed.</Text>
            <Text style={styles.refItem}>Lydiard, A. & Gilmour, G. (2000). Running with Lydiard. Meyer & Meyer Sport.</Text>
            <Text style={styles.refItem}>Pfitzinger, P. & Douglas, S. (2009). Advanced Marathoning. Human Kinetics, 2nd ed.</Text>
            <Text style={styles.refItem}>Noakes, T. (2002). Lore of Running. Human Kinetics, 4th ed.</Text>
            <Text style={styles.refItem}>Billat, V. et al. (2001). Interval Training at VO2max. Medicine & Science in Sports & Exercise.</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function PhaseItem({ number, name, color, desc }: { number: number; name: string; color: string; desc: string }) {
  return (
    <View style={phaseStyles.item}>
      <View style={[phaseStyles.numberCircle, { backgroundColor: color + '20', borderColor: color + '40' }]}>
        <Text style={[phaseStyles.number, { color }]}>{number}</Text>
      </View>
      <View style={phaseStyles.content}>
        <Text style={[phaseStyles.name, { color }]}>{name}</Text>
        <Text style={phaseStyles.desc}>{desc}</Text>
      </View>
    </View>
  );
}

const phaseStyles = StyleSheet.create({
  item: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  numberCircle: {
    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, marginTop: 2,
  },
  number: { fontSize: FONT_SIZES.body, fontWeight: '900' },
  content: { flex: 1 },
  name: { fontSize: FONT_SIZES.body, fontWeight: '700' },
  desc: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 18, marginTop: 2 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FONT_SIZES.lg, color: COLORS.text, fontWeight: '900', letterSpacing: 2 },
  scrollContent: { paddingTop: SPACING.md, paddingBottom: SPACING.xxxl },

  introCard: {
    marginHorizontal: SPACING.xl, marginBottom: SPACING.xl, padding: SPACING.xl,
    backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1, borderColor: '#3b82f630', alignItems: 'center',
  },
  introTitle: { fontSize: FONT_SIZES.xl, color: COLORS.text, fontWeight: '900', marginTop: SPACING.md, textAlign: 'center' },
  introText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, lineHeight: 22, marginTop: SPACING.sm, textAlign: 'center' },

  section: {
    marginHorizontal: SPACING.xl, marginBottom: SPACING.xl,
    backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  sectionIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: FONT_SIZES.body, color: COLORS.text, fontWeight: '900', flex: 1 },
  sectionText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, lineHeight: 22 },

  detailBox: {
    backgroundColor: COLORS.bg, borderRadius: BORDER_RADIUS.md, padding: SPACING.md,
    marginTop: SPACING.md, borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  detailTitle: { fontSize: FONT_SIZES.sm, color: COLORS.lime, fontWeight: '700', letterSpacing: 1, marginBottom: SPACING.sm },
  detailText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 20 },

  referenceBox: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    marginTop: SPACING.md, paddingTop: SPACING.sm,
    borderTopWidth: 1, borderTopColor: COLORS.cardBorder,
  },
  referenceText: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, fontStyle: 'italic', flex: 1 },

  phaseList: { marginTop: SPACING.md },

  refList: { gap: SPACING.sm },
  refItem: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 20, paddingLeft: SPACING.sm, borderLeftWidth: 2, borderLeftColor: COLORS.cardBorder },
});
