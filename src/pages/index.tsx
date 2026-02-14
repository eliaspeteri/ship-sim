import React from 'react';
import { useRouter } from 'next/router';

const ui = {
  page: 'relative flex min-h-[calc(100vh-var(--nav-height))] flex-col gap-14 overflow-hidden px-6 pb-[72px] pt-12',
  pageGlow:
    'pointer-events-none absolute inset-x-[-10%] top-[-20%] z-0 h-[60%] bg-[radial-gradient(60%_60%_at_20%_20%,rgba(36,176,168,0.28)_0%,rgba(10,20,34,0.1)_60%,transparent_100%),radial-gradient(50%_50%_at_80%_10%,rgba(195,167,107,0.24)_0%,transparent_70%)]',
  hero: 'relative z-[1] grid items-center gap-8 md:grid-cols-2',
  heroContent: 'flex flex-col gap-[18px]',
  kicker:
    'text-[11px] uppercase tracking-[0.4em] text-[rgba(195,167,107,0.9)]',
  title: 'text-[clamp(36px,6vw,64px)] font-bold leading-[1.05] text-[#f2f7f9]',
  lead: 'max-w-[540px] text-base leading-[1.7] text-[rgba(197,213,222,0.86)]',
  heroActions: 'flex flex-wrap gap-3',
  primaryButton:
    'rounded-xl border-0 bg-gradient-to-br from-[#25b2a6] to-[#15707d] px-[18px] py-3 text-[13px] font-semibold tracking-[0.02em] text-[#f8f8f8] shadow-[0_18px_35px_rgba(8,52,62,0.45)] transition-transform duration-200 hover:-translate-y-0.5',
  secondaryButton:
    'rounded-xl border border-[rgba(52,74,92,0.8)] bg-[rgba(20,34,48,0.9)] px-[18px] py-3 text-[13px] font-semibold tracking-[0.02em] text-[rgba(230,239,244,0.9)] transition-transform duration-200 hover:-translate-y-0.5',
  metaRow: 'grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3',
  metaCard:
    'rounded-[14px] border border-[rgba(35,64,86,0.8)] bg-[rgba(10,22,36,0.65)] px-[14px] py-3 backdrop-blur-xl',
  metaLabel:
    'text-[11px] uppercase tracking-[0.2em] text-[rgba(150,175,190,0.7)]',
  metaValue: 'mt-1.5 text-lg font-semibold text-[#f0f6f8]',
  heroVisual:
    'relative flex min-h-[320px] items-center justify-center',
  heroGlow:
    'absolute h-[340px] w-[340px] rounded-full bg-[radial-gradient(circle,rgba(27,154,170,0.35),rgba(8,16,26,0.1)_70%)] blur-[10px] animate-pulse',
  heroPanel:
    'relative w-[min(420px,90%)] rounded-[20px] border border-[rgba(40,80,96,0.7)] bg-gradient-to-br from-[rgba(8,18,32,0.85)] to-[rgba(16,34,52,0.9)] p-5 shadow-[0_30px_60px_rgba(6,12,18,0.6)] max-[960px]:w-full',
  panelTitle:
    'text-xs uppercase tracking-[0.25em] text-[rgba(168,216,228,0.7)]',
  panelGrid: 'mt-4 grid grid-cols-2 gap-3',
  panelCard:
    'rounded-xl border border-[rgba(40,65,80,0.6)] bg-[rgba(6,14,22,0.6)] p-3',
  panelCardLabel:
    'text-[10px] uppercase tracking-[0.18em] text-[rgba(155,180,194,0.7)]',
  panelCardValue: 'mt-1.5 text-base font-semibold text-[#f2f7f9]',
  features: 'relative z-[1] flex flex-col gap-5',
  featuresTitle: 'text-[22px] font-semibold text-[#f2f7f9]',
  featureGrid: 'grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4',
  featureCard:
    'min-h-[140px] rounded-2xl border border-[rgba(32,64,84,0.8)] bg-[rgba(7,16,28,0.7)] p-4',
  featureLabel:
    'text-xs uppercase tracking-[0.2em] text-[rgba(195,167,107,0.7)]',
  featureTitle: 'mt-2.5 text-base font-semibold text-[#f2f7f9]',
  featureText: 'mt-2 text-[13px] leading-[1.6] text-[rgba(180,201,212,0.8)]',
  cta:
    'relative z-[1] flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[rgba(36,72,90,0.8)] bg-gradient-to-br from-[rgba(11,28,44,0.9)] to-[rgba(8,20,32,0.95)] p-5',
  ctaText: 'text-base text-[rgba(220,233,238,0.9)]',
};

/**
 * Landing page for Ship Simulator. No simulation runs here.
 */
const Home: React.FC = () => {
  const router = useRouter();
  return (
    <main className={ui.page}>
      <div className={ui.pageGlow} />
      <section className={ui.hero}>
        <div className={ui.heroContent}>
          <div className={ui.kicker}>Bridge Ops - Live Physics</div>
          <h1 className={ui.title}>Ship Simulator</h1>
          <p className={ui.lead}>
            Command a live vessel, assign crew stations, and test mission
            scenarios across a real-time ocean simulation. Weather, currents,
            and systems respond as you steer.
          </p>
          <div className={ui.heroActions}>
            <button
              type="button"
              className={ui.primaryButton}
              onClick={() => router.push('/sim')}
            >
              Launch simulator
            </button>
            <button
              type="button"
              className={ui.secondaryButton}
              onClick={() => router.push('/globe')}
            >
              Explore the map
            </button>
          </div>
          <div className={ui.metaRow}>
            {[
              { label: 'Simulation rate', value: '60 Hz physics' },
              { label: 'Crew stations', value: 'Helm / Engine / Radio' },
              { label: 'Weather', value: 'Dynamic presets + events' },
            ].map(meta => (
              <div key={meta.label} className={ui.metaCard}>
                <div className={ui.metaLabel}>{meta.label}</div>
                <div className={ui.metaValue}>{meta.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className={ui.heroVisual}>
          <div className={ui.heroGlow} />
          <div className={ui.heroPanel}>
            <div className={ui.panelTitle}>Live systems snapshot</div>
            <div className={ui.panelGrid}>
              {[
                { label: 'Sea state', value: 'Real-time swell' },
                { label: 'Propulsion', value: 'Throttle + ballast' },
                { label: 'Navigation', value: 'COG, SOG, heading' },
                { label: 'Alerts', value: 'Grounding + collision' },
              ].map(card => (
                <div key={card.label} className={ui.panelCard}>
                  <div className={ui.panelCardLabel}>{card.label}</div>
                  <div className={ui.panelCardValue}>{card.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={ui.features}>
        <div className={ui.featuresTitle}>What you can do</div>
        <div className={ui.featureGrid}>
          {[
            {
              label: 'Navigation',
              title: 'Pilot with real-time instruments',
              text: 'Track course, speed, and yaw rate while managing rudder and throttle from the bridge.',
            },
            {
              label: 'Crew',
              title: 'Coordinate stations and roles',
              text: 'Assign helm, engine, and radio duties with role-based controls and comms.',
            },
            {
              label: 'Weather',
              title: 'Shape the environment',
              text: 'Schedule presets, toggle auto-weather, and observe wave response instantly.',
            },
            {
              label: 'Missions',
              title: 'Run scripted scenarios',
              text: 'Accept contracts, test route plans, and log performance across spaces.',
            },
          ].map((feature, index) => (
            <div
              key={feature.label}
              className={ui.featureCard}
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <div className={ui.featureLabel}>{feature.label}</div>
              <div className={ui.featureTitle}>{feature.title}</div>
              <div className={ui.featureText}>{feature.text}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={ui.cta}>
        <div className={ui.ctaText}>
          Ready to run a crewed sim or scout the global map?
        </div>
        <div className={ui.heroActions}>
          <button
            type="button"
            className={ui.primaryButton}
            onClick={() => router.push('/sim')}
          >
            Enter simulator
          </button>
          <button
            type="button"
            className={ui.secondaryButton}
            onClick={() => router.push('/spaces')}
          >
            Manage spaces
          </button>
        </div>
      </section>
    </main>
  );
};

export default Home;
