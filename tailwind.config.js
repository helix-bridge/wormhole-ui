module.exports = {
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    extend: {
      animation: {
        whirl: 'whirl 1s linear',
        'whirl-reverse': 'whirl-reverse 1s linear',
        'ball-scale-pulse': 'ball-scale-pulse 2s ease-in-out infinite',
        //   "ra-1": "animate-arrow-1 1s ease-in-out infinite",
        //   "ra-2": "animate-arrow-2 1s ease-in-out infinite 0.1s",
        //   "ra-3": "animate-arrow-3 1s ease-in-out infinite 0.2s",
      },
      keyframes: {
        whirl: {
          '0%': { transform: 'rotateY(0deg)', opacity: 1 },
          '25%': { transform: 'rotateY(90deg)', opacity: 0.3 },
          '50%': { transform: 'rotateY(120deg)', opacity: 0 },
          '75%': { transform: 'rotateY(150deg)', opacity: 0.3 },
          '100%': { transform: 'rotateY(180deg)', opacity: 1 },
        },
        'whirl-reverse': {
          '0%': { transform: 'rotateY(180deg)', opacity: 1 },
          '25%': { transform: 'rotateY(150deg)', opacity: 0.3 },
          '50%': { transform: 'rotateY(120deg)', opacity: 0 },
          '75%': { transform: 'rotateY(90deg)', opacity: 0.3 },
          '100%': { transform: 'rotateY(180deg)', opacity: 1 },
        },
        'ball-scale-pulse': {
          '0%': { transform: 'scale(0)' },
          '50%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(0)' },
        },
        //   'right-arrow-1': {
        //     '0%': { transform: 'translateX(-40px);opacity: 0;' },
        //     '70%': { transform: 'translateX(0px);opacity: 1;' },
        //     '100%': { transform: 'translateX(0px);opacity: 1;' },
        //   },
        //   'right-arrow-2': {
        //     '0%': { transform: 'translateX(-20px);opacity: 0;' },
        //     '70%': { transform: 'translateX(0px);opacity: .5;' },
        //     '100%': { transform: 'translateX(0px);opacity: .5;' },
        //   },
        //   'right-arrow-3': {
        //     '0%': { transform: 'translateX(-10px);opacity: 0;' },
        //     '70%': { transform: 'translateX(0px);opacity: .3;' },
        //     '100%': { transform: 'translateX(0px);opacity: .3;' },
        //   },
      },
      backgroundImage: (_) => ({
        darwinia: 'linear-gradient(-45deg, #fe3876 0%, #7c30dd 71%, #3a30dd 100%)',
      }),
      backgroundColor: (_) => ({
        antDark: '#151e33',
        crab: '#EC3783',
        kusama: '#000',
        pangolin: '#5745DE',
        pangoro: '#5745DE',
        polkadot: '#e6007a',
      }),
      borderRadius: {
        xl: '10px',
        lg: '8px',
      },
      boxShadow: {
        'mock-bottom-border': '0px 10px 1px -8px #5745de',
        'mock-bottom-border-light': '0px 10px 1px -8px rgba(255,255,255,.85)',
      },
      colors: (_) => ({
        crab: {
          main: '#EC3783',
        },
        darwinia: {
          main: '#3a30dd',
        },
        kusama: {
          main: '#000',
        },
        pangolin: {
          main: '#5745DE',
        },
        pangoro: {
          main: '#5745DE',
        },
        ropsten: {
          main: '#e6007a',
        },
      }),
    },
  },
  plugins: [
    require('tailwindcss-pseudo-elements')({
      customPseudoClasses: ['step'],
      customPseudoElements: ['div'],
      emptyContent: false,
    }),
  ],
  variants: {
    extend: {
      backgroundColor: ['before', 'after'],
      backgroundOpacity: ['before', 'after'],
    },
  },
};
