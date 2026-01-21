export type EconomyContext = {
  id: string;
  label: string;
  description?: string;
  navLabel?: string;
};

export const ECONOMY_DEFAULT_CONTEXT = 'shipyard';

export const ECONOMY_CONTEXTS: EconomyContext[] = [
  {
    id: 'shipyard',
    label: 'Shipyard',
    description: 'Buy, lease, or charter vessels.',
  },
  {
    id: 'fleet',
    label: 'Company Fleet',
    description: 'Active vessels, leases, and sales.',
    navLabel: 'Fleet',
  },
  {
    id: 'finances',
    label: 'Company Finances',
    description: 'Credits, rank, and operational status.',
    navLabel: 'Finances',
  },
  {
    id: 'port-market',
    label: 'Port Market',
    description: 'Cargo and passenger opportunities by port.',
    navLabel: 'Port Market',
  },
  {
    id: 'loans',
    label: 'Loans',
    description: 'Outstanding balances and repayment timelines.',
  },
  {
    id: 'insurance',
    label: 'Insurance',
    description: 'Active coverage and premiums.',
  },
  {
    id: 'insurance-history',
    label: 'Insurance History',
    description: 'Past claims and closed policies.',
    navLabel: 'Insurance History',
  },
  {
    id: 'missions',
    label: 'Missions & Contracts',
    description: 'Available missions and contract rewards.',
    navLabel: 'Missions',
  },
  {
    id: 'careers',
    label: 'Careers',
    description: 'Career tracks and progression.',
  },
  {
    id: 'licenses',
    label: 'Licenses & Exams',
    description: 'Certifications and competency tests.',
    navLabel: 'Licenses',
  },
  {
    id: 'reputation',
    label: 'Reputation',
    description: 'Standing across ports and operators.',
  },
];

export const getEconomyContext = (id: string) =>
  ECONOMY_CONTEXTS.find(context => context.id === id);

export const isEconomyContext = (id: string) =>
  ECONOMY_CONTEXTS.some(context => context.id === id);
