module.exports = {
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    extend: {
      // animation: {
      //   "ra-1": "animate-arrow-1 1s ease-in-out infinite",
      //   "ra-2": "animate-arrow-2 1s ease-in-out infinite 0.1s",
      //   "ra-3": "animate-arrow-3 1s ease-in-out infinite 0.2s",
      // },
      // keyframes: {
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
      // },
      backgroundImage: (_) => ({
        darwinia: 'linear-gradient(-45deg, #fe3876 0%, #7c30dd 71%, #3a30dd 100%)',
      }),
      backgroundColor: (_) => ({
        crab: '#EC3783',
        pangolin: '#5745DE',
        polkadot: '#e6007a',
        kusama: '#000',
      }),
      borderRadius: {
        xl: '10px',
        lg: '8px',
      },
      colors: (_) => ({
        pangolin: {
          main: '#5745DE',
        },
        crab: {
          main: '#EC3783',
        },
        darwinia: {
          main: '#3a30dd',
        },
        ropsten: {
          main: '#e6007a',
        },
        kusama: {
          main: '#000',
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
