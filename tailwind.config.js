{
  theme: {
    extend: {
      keyframes: {
        'highlight-fade': {
          '0%': { backgroundColor: 'var(--primary-50)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
      animation: {
        'highlight-fade': 'highlight-fade 2s ease-out',
      },
    },
  },
} 