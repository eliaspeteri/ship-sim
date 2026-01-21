/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        editor: {
          text: '#edf5f8',
          muted: 'rgba(199, 218, 230, 0.7)',
          'muted-strong': 'rgba(199, 218, 230, 0.75)',
          soft: 'rgba(210, 226, 236, 0.85)',
          panel: 'rgba(10, 22, 32, 0.86)',
          'panel-border': 'rgba(97, 137, 160, 0.28)',
          surface: 'rgba(9, 18, 28, 0.92)',
          'surface-border': 'rgba(97, 137, 160, 0.3)',
          card: 'rgba(10, 20, 30, 0.9)',
          'card-border': 'rgba(97, 137, 160, 0.35)',
          'control-bg': 'rgba(11, 22, 34, 0.75)',
          'control-border': 'rgba(137, 186, 211, 0.3)',
          'tool-bg': 'rgba(21, 42, 58, 0.65)',
          'tool-border': 'rgba(122, 167, 190, 0.35)',
          'accent-soft': 'rgba(245, 176, 95, 0.12)',
          'accent-border': 'rgba(245, 176, 95, 0.4)',
          'accent-ring': 'rgba(245, 176, 95, 0.8)',
          'row-bg': 'rgba(16, 31, 44, 0.6)',
          'row-border': 'rgba(97, 137, 160, 0.2)',
          'quiet-bg': 'rgba(11, 22, 34, 0.4)',
          'quiet-border': 'rgba(137, 186, 211, 0.2)',
          'pill-bg': 'rgba(14, 26, 38, 0.8)',
          'pill-border': 'rgba(137, 186, 211, 0.35)',
          'inspector-bg': 'rgba(12, 26, 36, 0.7)',
          'inspector-border': 'rgba(118, 160, 184, 0.3)',
          'bottom-bar': 'rgba(7, 18, 28, 0.82)',
          viewport: 'rgba(8, 16, 26, 0.8)',
          'accent-strong-border': 'rgba(247, 199, 128, 0.6)',
          'tag-bg': 'rgba(245, 199, 128, 0.16)',
          'tag-border': 'rgba(245, 199, 128, 0.35)',
          'tag-text': '#ffd6a3',
          'status-text': '#f4d9b3',
          link: '#f9c58b',
          'accent-text': '#120c08',
        },
      },
      backgroundImage: {
        'editor-shell':
          'radial-gradient(120% 120% at 10% 10%, rgba(28, 63, 82, 0.75) 0%, rgba(10, 20, 32, 0.95) 48%, rgba(6, 10, 16, 0.98) 100%), linear-gradient(135deg, rgba(7, 14, 22, 0.95), rgba(3, 8, 14, 0.98))',
        'editor-page':
          'radial-gradient(120% 120% at 10% 10%, rgba(26, 58, 78, 0.75) 0%, rgba(9, 18, 30, 0.96) 50%, rgba(5, 10, 16, 0.98) 100%), linear-gradient(135deg, rgba(7, 14, 22, 0.95), rgba(3, 8, 14, 0.98))',
        'editor-accent-gradient':
          'linear-gradient(135deg, #ffb15b, #ff8b3d)',
        'editor-grid':
          'linear-gradient(transparent 95%, rgba(90, 135, 160, 0.18) 96%), linear-gradient(90deg, transparent 95%, rgba(90, 135, 160, 0.18) 96%)',
      },
      boxShadow: {
        'editor-accent': '0 0 0 1px rgba(245, 176, 95, 0.4)',
      },
    },
  },
};
