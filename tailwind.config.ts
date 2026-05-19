import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{tsx,ts}'],
  theme: {
    extend: {
      colors: {
        sf: {
          bg:      '#0A0A0C',
          text:    '#E5E7EB',
          border:  '#27272A',
          blue:    '#3B82F6',
          mint:    '#10B981',
          violet:  '#8B5CF6',
          error:   '#EF4444',
          warning: '#F59E0B'
        }
      }
    }
  },
  plugins: []
}

export default config
