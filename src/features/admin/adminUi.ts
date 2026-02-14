export const adminUi = {
  page: 'mx-auto max-w-[1200px] px-4 pb-[60px] pt-8 text-[var(--ink)]',
  header:
    'mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-start',
  title: 'text-[26px] font-bold',
  subtitle: 'text-[13px] text-[rgba(170,192,202,0.7)]',
  section:
    'mt-5 rounded-[18px] border border-[rgba(27,154,170,0.35)] bg-[rgba(10,20,34,0.9)] p-4',
  sectionHeader: 'mb-3 flex items-center justify-between gap-3',
  sectionTitle:
    'text-sm uppercase tracking-[0.18em] text-[rgba(170,192,202,0.8)]',
  grid: 'grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3',
  spaceSection: 'mt-4 grid gap-2.5',
  spaceTable:
    'grid gap-1.5 rounded-xl border border-[rgba(40,60,80,0.6)] bg-[rgba(6,12,20,0.7)] p-2.5',
  spaceHeader:
    'grid grid-cols-[minmax(120px,1.4fr)_repeat(4,minmax(60px,0.6fr))_minmax(110px,0.9fr)] items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-[rgba(160,179,192,0.75)]',
  spaceRow:
    'grid grid-cols-[minmax(120px,1.4fr)_repeat(4,minmax(60px,0.6fr))_minmax(110px,0.9fr)] items-center gap-2 rounded-lg bg-[rgba(10,20,34,0.6)] px-2 py-1.5 text-xs text-[#eef6f8]',
  card: 'rounded-xl border border-[rgba(40,60,80,0.6)] bg-[rgba(8,18,30,0.8)] p-3',
  cardLabel:
    'text-[11px] uppercase tracking-[0.16em] text-[rgba(160,179,192,0.7)]',
  cardValue: 'mt-1.5 text-lg font-semibold text-[#f2f7f8]',
  formRow: 'flex flex-wrap items-center gap-2.5',
  input:
    'rounded-[10px] border border-[rgba(60,88,104,0.6)] bg-[rgba(8,18,30,0.75)] px-2.5 py-1.5 text-xs text-[#f1f7f8]',
  select:
    'rounded-[10px] border border-[rgba(60,88,104,0.6)] bg-[rgba(8,18,30,0.75)] px-2.5 py-1.5 text-xs text-[#f1f7f8]',
  button:
    'cursor-pointer rounded-[10px] border-0 px-3 py-1.5 text-xs font-semibold text-[#f1f7f8]',
  buttonPrimary: 'bg-gradient-to-br from-[#1b9aaa] to-[#0f6d75]',
  buttonSecondary: 'bg-[rgba(52,72,98,0.9)]',
  buttonDanger: 'bg-[rgba(120,36,32,0.85)]',
  logList: 'grid max-h-[260px] gap-2 overflow-y-auto',
  logItem:
    'rounded-[10px] border border-[rgba(40,60,80,0.6)] bg-[rgba(6,12,20,0.8)] px-2.5 py-2 text-xs',
  logMeta: 'text-[10px] text-[rgba(160,179,192,0.7)]',
  notice: 'mt-2 rounded-[10px] px-2.5 py-2 text-xs',
  noticeError: 'bg-[rgba(120,36,32,0.8)] text-[#ffe7e1]',
  noticeInfo: 'bg-[rgba(28,88,130,0.7)] text-[#e6f2ff]',
} as const;

export const metricTargets: Record<string, number> = {
  api: 120,
  broadcast: 16,
  ai: 12,
  socketLatency: 120,
};
