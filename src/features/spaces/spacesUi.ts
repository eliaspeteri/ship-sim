export const spacesUi = {
  page: 'mx-auto max-w-[1080px] px-4 pb-[60px] pt-8 text-[var(--ink)]',
  header:
    'mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center',
  title: 'text-2xl font-bold',
  subtitle: 'text-[13px] text-[rgba(170,192,202,0.7)]',
  status: 'text-xs text-[rgba(170,192,202,0.7)]',
  notice: 'mb-3 rounded-[10px] px-2.5 py-2 text-xs',
  noticeInfo: 'bg-[rgba(28,88,130,0.7)] text-[#e6f2ff]',
  noticeError: 'bg-[rgba(120,36,32,0.8)] text-[#ffe7e1]',
  spaceGrid: 'grid gap-4',
  spaceCard:
    'grid gap-3 rounded-2xl border border-[rgba(27,154,170,0.35)] bg-[rgba(10,20,34,0.9)] p-4',
  cardHeader: 'flex items-baseline justify-between gap-3',
  cardMeta: 'text-[11px] text-[rgba(170,192,202,0.7)]',
  formRow: 'flex flex-wrap items-center gap-2.5',
  formGrid: 'grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3',
  input:
    'rounded-[10px] border border-[rgba(60,88,104,0.6)] bg-[rgba(8,18,30,0.75)] px-2.5 py-1.5 text-xs text-[#f1f7f8]',
  select:
    'rounded-[10px] border border-[rgba(60,88,104,0.6)] bg-[rgba(8,18,30,0.75)] px-2.5 py-1.5 text-xs text-[#f1f7f8]',
  button:
    'cursor-pointer rounded-[10px] border-0 px-3 py-1.5 text-xs font-semibold text-[#f1f7f8]',
  buttonPrimary: 'bg-gradient-to-br from-[#1b9aaa] to-[#0f6d75]',
  buttonSecondary: 'bg-[rgba(52,72,98,0.9)]',
  buttonDanger: 'bg-[rgba(120,36,32,0.85)]',
  tag: 'rounded-full border border-[rgba(60,88,104,0.6)] bg-[rgba(12,28,44,0.7)] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[#e6f2f6]',
  tagPrivate: 'border-[rgba(162,66,120,0.7)] bg-[rgba(92,28,60,0.7)]',
  mono: 'font-mono',
  actionsRow: 'flex flex-wrap gap-2',
  toggleGroup: 'flex gap-1.5',
  rulesSection:
    'grid gap-2.5 rounded-xl border border-[rgba(60,88,104,0.4)] bg-[rgba(8,16,28,0.6)] p-2.5',
  rulesGrid: 'grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3',
  rulesGroup: 'grid gap-1.5',
  checkboxRow: 'flex items-center gap-1.5 text-xs text-[#e6f2f6]',
  rulesInputs: 'grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2.5',
} as const;
