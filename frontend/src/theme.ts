export const COLORS = {
  bg: '#09090b',
  card: '#18181b',
  cardBorder: '#27272a',
  cardHighlight: 'rgba(190, 242, 100, 0.08)',
  text: '#f4f4f5',
  textSecondary: '#a1a1aa',
  textMuted: '#52525b',
  lime: '#bef264',
  limeDark: '#1a2e05',
  blue: '#3b82f6',
  orange: '#f97316',
  red: '#ef4444',
  green: '#22c55e',
  hrZone1: '#71717a',
  hrZone2: '#3b82f6',
  hrZone3: '#22c55e',
  hrZone4: '#f97316',
  hrZone5: '#ef4444',
  overlay: 'rgba(9, 9, 11, 0.8)',
  inputBg: '#0a0a0c',
  tabBar: '#111113',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  body: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  hero: 40,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const SESSION_COLORS: Record<string, string> = {
  corsa_lenta: '#3b82f6',
  lungo: '#8b5cf6',
  lungo_spec: '#a855f7',       // Lungo specifico (con sezioni a ritmo gara)
  ripetute: '#ef4444',
  ripetute_salita: '#f59e0b',
  progressivo: '#f97316',
  medio: '#fb923c',            // Ritmo maratona / ritmo gara
  soglia: '#f97316',           // Soglia / tempo
  rinforzo: '#22c55e',
  cyclette: '#06b6d4',
  riposo: '#52525b',
  test: '#bef264',
  race: '#fbbf24',
};

export const SESSION_ICONS: Record<string, string> = {
  corsa_lenta: 'walk',
  lungo: 'trending-up',
  lungo_spec: 'rocket',
  ripetute: 'flash',
  ripetute_salita: 'arrow-up-circle',
  progressivo: 'arrow-up',
  medio: 'speedometer',
  soglia: 'pulse',
  rinforzo: 'barbell',
  cyclette: 'bicycle',
  riposo: 'bed',
  test: 'stopwatch',
  race: 'trophy',
};
