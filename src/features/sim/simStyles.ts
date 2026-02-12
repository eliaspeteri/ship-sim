export const simStyles = {
  button:
    'cursor-pointer rounded-[10px] border-none px-3 py-1.5 text-xs font-semibold text-[#f1f7f8]',
  buttonNeutral: 'bg-[rgba(40,54,66,0.9)]',
  buttonPrimary: 'bg-[linear-gradient(135deg,#1b9aaa,#0f6d75)]',
  buttonSecondary: 'bg-[rgba(52,72,98,0.9)]',
  choiceButton:
    'cursor-pointer rounded-[14px] border border-[rgba(60,88,104,0.6)] bg-[rgba(12,28,44,0.8)] p-4 text-center text-[13px] font-semibold text-[#f1f7f8]',
  choiceButtonPrimary:
    'border-[rgba(27,154,170,0.6)] bg-[linear-gradient(135deg,#1b9aaa,#0f6d75)]',
  choiceGrid: 'mb-[18px] grid grid-cols-1 gap-3 min-[841px]:grid-cols-2',
  detailsCard:
    'mb-3 rounded-xl border border-[rgba(40,60,80,0.6)] bg-[rgba(8,18,30,0.7)] px-3 py-2.5 text-xs text-[rgba(210,222,230,0.9)]',
  detailsHeader: 'mb-1.5 flex items-center justify-between',
  errorText: 'text-xs text-[#ffb4ad]',
  formRow: 'mb-3 flex flex-wrap items-center gap-2.5',
  helperText: 'text-xs text-[rgba(160,179,192,0.7)]',
  input:
    'rounded-[10px] border border-[rgba(60,88,104,0.6)] bg-[rgba(8,18,30,0.7)] px-2.5 py-1.5 text-xs text-[#f1f7f8]',
  modalBack:
    'cursor-pointer rounded-[10px] border border-[rgba(60,88,104,0.6)] bg-[rgba(12,28,44,0.7)] px-2.5 py-1.5 text-xs font-semibold text-[rgba(220,234,240,0.9)]',
  modalCard:
    'w-[min(560px,90vw)] rounded-2xl border border-[rgba(27,154,170,0.35)] bg-[rgba(10,20,34,0.95)] p-4 text-[var(--ink)] shadow-[0_24px_60px_rgba(4,10,18,0.6)]',
  modalClose:
    'cursor-pointer rounded-[10px] border-none bg-[rgba(120,42,36,0.9)] px-2.5 py-1.5 text-xs font-semibold text-[#ffe7e1]',
  modalHeader: 'mb-4 flex items-center justify-between',
  modalHeaderLeft: 'flex items-center gap-2.5',
  modalOverlay:
    'fixed inset-0 z-50 flex items-center justify-center bg-[rgba(3,6,12,0.7)]',
  modalSpacer: 'w-[68px]',
  modalTitle: 'text-lg font-semibold',
  modeLabel:
    'text-[10px] uppercase tracking-[0.2em] text-[rgba(170,192,202,0.7)]',
  pill: 'inline-flex cursor-pointer items-center gap-2 rounded-full border border-[rgba(60,88,104,0.6)] bg-[rgba(12,28,44,0.7)] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-[#e6f2f6]',
  pillBadge:
    'rounded-full border border-[rgba(70,96,112,0.7)] bg-[rgba(18,32,48,0.85)] px-1.5 py-0.5 text-[9px] tracking-[0.12em] text-[rgba(220,234,240,0.9)]',
  pillBadgeCasual: 'border-[rgba(40,150,140,0.7)] bg-[rgba(12,48,46,0.7)]',
  pillBadgeExam: 'border-[rgba(190,60,70,0.7)] bg-[rgba(70,16,24,0.75)]',
  pillBadgeRealism: 'border-[rgba(190,126,40,0.7)] bg-[rgba(72,40,12,0.75)]',
  pillBadgeSandbox: 'border-[rgba(120,110,200,0.7)] bg-[rgba(36,32,80,0.7)]',
  pillBadges: 'inline-flex items-center gap-1.5',
  pillName: 'text-[11px] tracking-[0.08em]',
  pillPrivate: 'border-[rgba(162,66,120,0.7)] bg-[rgba(92,28,60,0.7)]',
  pillRow: 'mb-3 flex flex-wrap gap-2',
  pillScroller: 'mb-3 max-h-[180px] overflow-y-auto pr-1',
  rulesBadge:
    'rounded-full border border-[rgba(70,96,112,0.7)] bg-[rgba(18,32,48,0.85)] px-1.5 py-0.5 text-[9px] tracking-[0.08em] text-[rgba(220,234,240,0.9)]',
  rulesBadgeOff:
    'border-[rgba(70,96,112,0.45)] bg-[rgba(18,32,48,0.4)] text-[rgba(180,196,206,0.7)]',
  rulesBadgeOn: 'border-[rgba(40,150,140,0.7)] bg-[rgba(12,48,46,0.7)]',
  rulesBadgeWarn: 'border-[rgba(190,126,40,0.7)] bg-[rgba(72,40,12,0.75)]',
  rulesBadges: 'flex flex-wrap gap-1.5',
  rulesGrid: 'mt-2 grid gap-1.5',
  rulesLabel:
    'text-[10px] uppercase tracking-[0.16em] text-[rgba(160,179,192,0.7)]',
  rulesRow:
    'grid grid-cols-[minmax(90px,0.6fr)_minmax(0,1fr)] items-center gap-2.5',
  scenarioAction: 'justify-self-start',
  scenarioCard:
    'grid gap-2 rounded-[14px] border border-[rgba(40,60,80,0.6)] bg-[rgba(8,18,30,0.8)] p-3',
  scenarioGrid: 'mt-3 grid gap-2.5',
  scenarioHeader: 'flex items-baseline justify-between gap-3',
  scenarioMeta: 'text-[11px] text-[rgba(160,179,192,0.7)]',
  scenarioTitle: 'text-sm font-semibold text-[#f1f7f8]',
  select:
    'rounded-[10px] border border-[rgba(60,88,104,0.6)] bg-[rgba(8,18,30,0.7)] px-2.5 py-1.5 text-xs text-[#f1f7f8]',
} as const;
