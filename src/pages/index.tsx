import React from 'react';
import { useRouter } from 'next/router';
import styles from './Home.module.css';

/**
 * Landing page for Ship Simulator. No simulation runs here.
 */
const Home: React.FC = () => {
  const router = useRouter();
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.kicker}>Bridge Ops - Live Physics</div>
          <h1 className={styles.title}>Ship Simulator</h1>
          <p className={styles.lead}>
            Command a live vessel, assign crew stations, and test mission
            scenarios across a real-time ocean simulation. Weather, currents,
            and systems respond as you steer.
          </p>
          <div className={styles.heroActions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => router.push('/sim')}
            >
              Launch simulator
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => router.push('/globe')}
            >
              Explore the map
            </button>
          </div>
          <div className={styles.metaRow}>
            {[
              { label: 'Simulation rate', value: '60 Hz physics' },
              { label: 'Crew stations', value: 'Helm / Engine / Radio' },
              { label: 'Weather', value: 'Dynamic presets + events' },
            ].map(meta => (
              <div key={meta.label} className={styles.metaCard}>
                <div className={styles.metaLabel}>{meta.label}</div>
                <div className={styles.metaValue}>{meta.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.heroGlow} />
          <div className={styles.heroPanel}>
            <div className={styles.panelTitle}>Live systems snapshot</div>
            <div className={styles.panelGrid}>
              {[
                { label: 'Sea state', value: 'Real-time swell' },
                { label: 'Propulsion', value: 'Throttle + ballast' },
                { label: 'Navigation', value: 'COG, SOG, heading' },
                { label: 'Alerts', value: 'Grounding + collision' },
              ].map(card => (
                <div key={card.label} className={styles.panelCard}>
                  <div className={styles.panelCardLabel}>{card.label}</div>
                  <div className={styles.panelCardValue}>{card.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.featuresTitle}>What you can do</div>
        <div className={styles.featureGrid}>
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
              className={styles.featureCard}
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <div className={styles.featureLabel}>{feature.label}</div>
              <div className={styles.featureTitle}>{feature.title}</div>
              <div className={styles.featureText}>{feature.text}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.cta}>
        <div className={styles.ctaText}>
          Ready to run a crewed sim or scout the global map?
        </div>
        <div className={styles.heroActions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => router.push('/sim')}
          >
            Enter simulator
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
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
