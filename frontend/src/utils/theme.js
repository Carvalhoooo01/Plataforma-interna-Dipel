// Retorna um objeto de cores baseado no tema atual
export const tk = (dark) => ({
  card:          dark ? '#1e293b' : '#ffffff',
  cardBorder:    dark ? '#334155' : '#e5e7eb',
  bg:            dark ? '#0f172a' : '#f9fafb',
  text:          dark ? '#f1f5f9' : '#111827',
  textSub:       dark ? '#94a3b8' : '#6b7280',
  textMuted:     dark ? '#64748b' : '#9ca3af',
  headerBg:      dark ? '#1e293b' : '#f9fafb',
  inputBg:       dark ? '#0f172a' : '#ffffff',
  inputBorder:   dark ? '#475569' : '#e5e7eb',
  rowHover:      dark ? '#1e293b' : '#f9fafb',
  sectionBg:     dark ? '#0f172a' : '#f8fafc',
  sectionBorder: dark ? '#334155' : '#e2e8f0',
  tagBg:         dark ? '#1e3a5f' : '#e8f0fe',
  tagColor:      dark ? '#60a5fa' : '#1e40af',
  badgeBg:       dark ? '#334155' : '#f3f4f6',
});