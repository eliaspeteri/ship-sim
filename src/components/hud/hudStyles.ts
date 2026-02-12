export const hudStyles = {
  accountCard:
    'rounded-xl border border-[rgba(40,60,80,0.6)] bg-[rgba(10,22,36,0.7)] px-3 py-2.5',
  accountGrid:
    'mt-3 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2.5',
  accountLabel:
    'text-[11px] uppercase tracking-[0.18em] text-[rgba(160,179,192,0.7)]',
  accountValue: 'mt-1 text-base font-semibold text-[#f1f7f8]',
  adminActions: 'flex flex-wrap gap-2.5',
  adminButton:
    'cursor-pointer rounded-[10px] border-none bg-[linear-gradient(135deg,#1b9aaa,#0f6d75)] px-3.5 py-2 text-xs font-semibold text-white',
  adminButtonSecondary:
    'cursor-pointer rounded-[10px] border border-[rgba(60,88,104,0.7)] bg-[rgba(12,28,44,0.7)] px-3.5 py-2 text-xs font-semibold text-[rgba(220,234,240,0.9)]',
  adminGrid: 'grid grid-cols-1 gap-3 md:grid-cols-2',
  adminHint: 'mt-1.5 text-[11px] text-[rgba(150,168,182,0.7)]',
  adminInput:
    'mt-1.5 w-full rounded-[10px] border border-[rgba(40,60,80,0.6)] bg-[rgba(6,12,18,0.6)] px-2.5 py-2 text-xs text-[#f2f7f8]',
  adminLabel: 'text-[11px] text-[rgba(180,198,210,0.8)]',
  adminPanel: 'flex flex-col gap-4',
  adminSelect:
    'mt-2 w-full rounded-[10px] border border-[rgba(40,60,80,0.6)] bg-[rgba(6,12,18,0.6)] px-2.5 py-2 text-xs text-[#f2f7f8]',
  assignmentCard:
    'flex items-center justify-between gap-3 rounded-xl border border-[rgba(40,60,80,0.6)] bg-[rgba(6,12,18,0.6)] px-3 py-2.5',
  assignmentList: 'mt-2.5 grid gap-2',
  assignmentMeta: 'text-[11px] text-[rgba(160,179,192,0.7)]',
  assignmentTitle: 'text-[13px] font-semibold text-[#f1f7f8]',
  badge:
    'rounded-full bg-[rgba(74,96,114,0.5)] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-[rgba(220,234,240,0.8)]',
  crewRow:
    'flex items-center justify-between rounded-[10px] border border-[rgba(40,60,80,0.6)] bg-[rgba(6,12,18,0.5)] px-3 py-2.5',
  fleetButton:
    'cursor-pointer rounded-[10px] border border-[rgba(27,154,170,0.6)] bg-[rgba(14,30,46,0.9)] px-3 py-1.5 text-xs text-[#f0f7f8] disabled:cursor-not-allowed disabled:opacity-50',
  fleetGrid: 'grid gap-3',
  fleetMeta: 'text-xs text-[rgba(170,186,198,0.7)]',
  fleetRow:
    'flex items-center justify-between gap-4 rounded-xl border border-[rgba(40,60,80,0.6)] bg-[rgba(9,18,30,0.75)] px-3.5 py-3',
  fleetTitle: 'text-sm font-semibold text-[#f2f7f8]',
  footerMeta:
    'hidden text-[11px] uppercase tracking-[0.2em] text-[rgba(162,184,198,0.7)] md:block',
  hudFooter:
    'pointer-events-auto flex flex-col items-start justify-between gap-3 border-t border-[rgba(27,154,170,0.3)] bg-[linear-gradient(90deg,rgba(7,18,30,0.96),rgba(10,30,52,0.95))] px-3.5 py-2.5 backdrop-blur-[14px] md:flex-row md:items-center md:gap-5 md:px-5 md:py-3',
  hudPanel:
    'pointer-events-auto z-[44] mx-auto mb-3 w-[min(1080px,95vw)] max-h-[85vh] overflow-y-auto rounded-[20px] border border-[rgba(27,154,170,0.35)] bg-[linear-gradient(135deg,rgba(10,22,38,0.96),rgba(10,30,50,0.94))] p-5 shadow-[0_24px_60px_rgba(2,8,18,0.6)] backdrop-blur-2xl',
  hudPanelWide: 'mb-3 w-screen max-w-none rounded-none',
  hudRoot:
    'pointer-events-none fixed inset-x-0 bottom-0 z-40 text-[var(--ink)]',
  meter: 'mt-2 h-1.5 overflow-hidden rounded-full bg-[rgba(40,60,80,0.6)]',
  meterFill:
    'meterFill h-full rounded-full transition-[width] duration-200 ease-in-out',
  meterFillDanger:
    'meterFillDanger bg-[linear-gradient(135deg,#d1624f,#a23f2c)]',
  meterFillOk: 'meterFillOk bg-[linear-gradient(135deg,#1b9aaa,#0f6d75)]',
  meterFillWarn: 'meterFillWarn bg-[linear-gradient(135deg,#e0a53a,#b5721c)]',
  missionButton:
    'cursor-pointer rounded-[10px] border-none bg-[linear-gradient(135deg,#1b9aaa,#0f6d75)] px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60',
  missionCard:
    'grid gap-2.5 rounded-[14px] border border-[rgba(40,60,80,0.6)] bg-[rgba(9,18,30,0.75)] p-3',
  missionFooter: 'flex items-center justify-between gap-3',
  missionHeader: 'flex justify-between gap-3',
  missionList: 'mt-3 grid gap-2.5',
  missionMeta: 'text-[11px] text-[rgba(170,186,198,0.7)]',
  missionTitle: 'text-sm font-semibold text-[#f2f7f8]',
  navControlsDock:
    'pointer-events-auto fixed left-1/2 z-[42] w-full max-w-[min(780px,94vw)] -translate-x-1/2',
  navControlsDockBehind: 'z-[38]',
  navControlsRow: 'flex flex-nowrap items-center justify-center gap-[18px]',
  noticeText: 'text-xs text-[rgba(185,206,216,0.7)]',
  physicsGrid:
    'grid grid-cols-[minmax(160px,1.2fr)_minmax(120px,0.7fr)_minmax(140px,0.9fr)] items-center gap-x-3 gap-y-1.5',
  physicsHeader:
    'text-[10px] uppercase tracking-[0.18em] text-[rgba(150,168,182,0.7)]',
  physicsInput:
    'w-full rounded-[10px] border border-[rgba(40,60,80,0.6)] bg-[rgba(6,12,18,0.6)] px-2 py-1.5 text-xs text-[#f2f7f8]',
  physicsLabel:
    'flex items-baseline gap-1.5 text-xs text-[rgba(220,234,240,0.85)]',
  physicsPanel: 'flex flex-col gap-4',
  physicsSection: 'flex flex-col gap-2',
  physicsUnit: 'text-[10px] text-[rgba(150,168,182,0.7)]',
  physicsValue: 'text-xs tabular-nums text-[rgba(230,240,244,0.9)]',
  progressFill: 'h-full bg-[linear-gradient(135deg,#1b9aaa,#0f6d75)]',
  progressMeta: 'text-[11px] text-[rgba(150,168,182,0.7)]',
  progressRow: 'mt-3 grid gap-1.5',
  progressTrack:
    'h-2 overflow-hidden rounded-full border border-[rgba(40,60,80,0.6)] bg-[rgba(10,24,36,0.7)]',
  radarGrid: 'grid gap-4',
  radarTitle:
    'text-[11px] uppercase tracking-[0.2em] text-[rgba(160,179,192,0.7)]',
  replayButton:
    'cursor-pointer rounded-[10px] border-none bg-[linear-gradient(135deg,#1b9aaa,#0f6d75)] px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60',
  replayButtonDanger:
    'cursor-pointer rounded-[10px] border border-[rgba(140,60,50,0.7)] bg-[rgba(70,24,20,0.8)] px-3 py-1.5 text-xs font-semibold text-[#ffd5cc] disabled:cursor-not-allowed disabled:opacity-60',
  replayButtonSecondary:
    'cursor-pointer rounded-[10px] border border-[rgba(60,88,104,0.7)] bg-[rgba(12,28,44,0.7)] px-3 py-1.5 text-xs font-semibold text-[rgba(220,234,240,0.9)] disabled:cursor-not-allowed disabled:opacity-60',
  replayControls: 'mt-3 flex flex-wrap gap-2.5',
  replayMeta: 'mt-1.5 text-xs text-[rgba(170,186,198,0.7)]',
  sectionCard:
    'rounded-[14px] border border-[rgba(27,154,170,0.35)] bg-[rgba(12,28,44,0.7)] p-3.5',
  sectionGrid: 'grid gap-4',
  sectionHeader: 'flex items-center justify-between gap-3',
  sectionSub: 'text-xs text-[rgba(185,206,216,0.7)]',
  sectionTitle:
    'text-[11px] uppercase tracking-[0.2em] text-[rgba(160,179,192,0.7)]',
  statCard:
    'rounded-xl border border-[rgba(27,154,170,0.3)] bg-[rgba(15,32,52,0.7)] px-3 py-2.5',
  statDetail: 'text-[11px] text-[rgba(160,179,192,0.7)]',
  statGrid: 'grid grid-cols-2 gap-3',
  statLabel:
    'text-[11px] uppercase tracking-[0.2em] text-[rgba(165,186,198,0.8)]',
  statValue: 'text-[15px] font-semibold text-[#f2f7f8]',
  stationButton:
    'cursor-pointer rounded-lg border-none bg-[linear-gradient(135deg,#1b8f8a,#116672)] px-2.5 py-1.5 text-[11px] font-semibold text-[#f1f7f8]',
  stationButtonDisabled:
    'cursor-not-allowed bg-[rgba(40,54,66,0.6)] text-[rgba(150,170,180,0.6)]',
  stationHint: 'mt-1 text-[10px] text-[rgba(150,168,182,0.7)]',
  systemCard:
    'rounded-xl border border-[rgba(40,60,80,0.6)] bg-[rgba(9,18,30,0.75)] px-3 py-2.5',
  systemGrid:
    'mt-3 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3 md:[grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]',
  systemLabel:
    'text-[11px] uppercase tracking-[0.18em] text-[rgba(160,179,192,0.7)]',
  systemMeta: 'mt-1.5 text-[11px] text-[rgba(170,186,198,0.7)]',
  systemRange: 'mt-2.5 w-full accent-[#1b9aaa]',
  systemValue: 'mt-1.5 text-base font-semibold text-[#f2f7f8]',
  tabButton:
    'cursor-pointer rounded-[10px] border border-[rgba(60,88,104,0.7)] bg-[rgba(19,34,48,0.85)] px-2.5 py-1.5 text-[11px] font-semibold text-[rgba(216,231,238,0.9)] transition-all md:px-3.5 md:py-2 md:text-xs',
  tabButtonActive:
    'border-[rgba(27,154,170,0.7)] bg-[linear-gradient(135deg,#1b9aaa,#0f6d75)] text-white shadow-[0_12px_30px_rgba(12,62,72,0.45)]',
  tabRow:
    'flex w-full flex-nowrap gap-1.5 overflow-x-auto pb-1 md:w-auto md:flex-wrap md:gap-2.5 md:overflow-visible md:pb-0',
  transactionAmount: 'text-xs font-semibold',
  transactionLabel: 'text-xs text-[rgba(210,222,230,0.9)]',
  transactionList: 'mt-2.5 grid gap-2',
  transactionMeta: 'text-[10px] text-[rgba(150,168,182,0.7)]',
  transactionNegative: 'text-[#f39b7b]',
  transactionPositive: 'text-[#6ad39f]',
  transactionRow:
    'flex items-center justify-between gap-3 rounded-xl border border-[rgba(40,60,80,0.6)] bg-[rgba(6,12,18,0.6)] px-3 py-2.5',
} as const;
