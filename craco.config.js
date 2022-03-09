const AntDesignThemePlugin = require('./plugins/antd-theme-plugin');
const path = require('path');
const antdVarsPath = './src/theme/antd/vars.less';
const CracoAntDesignPlugin = require('craco-antd');
const { getLessVars } = require('./plugins/ant-theme-generator');
const themeVariables = getLessVars(path.join(__dirname, antdVarsPath));
const defaultVars = getLessVars(path.join(__dirname, './node_modules/antd/lib/style/themes/default.less'));
const CircularDependencyPlugin = require('circular-dependency-plugin');

const darkVars = {
  ...getLessVars(path.join(__dirname, './node_modules/antd/lib/style/themes/dark.less')),
  '@primary-color': defaultVars['@primary-color'],
  '@picker-basic-cell-active-with-range-color': 'darken(@primary-color, 20%)',
};

const lightVars = {
  ...getLessVars(path.join(__dirname, './node_modules/antd/lib/style/themes/compact.less')),
  '@primary-color': defaultVars['@primary-color'],
};

// just for dev purpose, use to compare vars in different theme.
// fs.writeFileSync('./ant-theme-vars/dark.json', JSON.stringify(darkVars));
// fs.writeFileSync('./ant-theme-vars/light.json', JSON.stringify(lightVars));
// fs.writeFileSync('./ant-theme-vars/theme.json', JSON.stringify(themeVariables));

const options = {
  antDir: path.join(__dirname, './node_modules/antd'),
  stylesDir: path.join(__dirname, './src'),
  varFile: path.join(__dirname, antdVarsPath),
  themeVariables: Array.from(
    new Set([...Object.keys(darkVars), ...Object.keys(lightVars), ...Object.keys(themeVariables)])
  ),
  indexFileName: './public/index.html',
  generateOnce: false,
  publicPath: '',
  customColorRegexArray: [],
};
const themePlugin = new AntDesignThemePlugin(options);
const circularDependencyPlugin = new CircularDependencyPlugin({
  exclude: /\*.js|node_modules/,
  failOnError: true,
  allowAsyncCycles: false,
  cwd: process.cwd(),
});

module.exports = {
  style: {
    postcss: {
      plugins: [require('tailwindcss'), require('autoprefixer')],
    },
  },
  plugins: [
    {
      plugin: CracoAntDesignPlugin,
      options: {
        customizeThemeLessPath: path.join(__dirname, 'src/theme/antd/vars.less'),
      },
    },
  ],
  babel: {
    plugins: [['@babel/plugin-proposal-class-properties', { loose: true }]],
  },
  webpack: {
    plugins: {
      add: [themePlugin, circularDependencyPlugin],
    },
    // add mjs compatibility configuration
    configure: (config) => {
      const wasmExtensionRegExp = /\.wasm$/;

      config.resolve.extensions.push('.wasm');

      config.module.rules.forEach((rule) => {
        (rule.oneOf || []).forEach((oneOf) => {
          if (oneOf.loader && oneOf.loader.indexOf('file-loader') >= 0) {
            // make file-loader ignore WASM files
            oneOf.exclude.push(wasmExtensionRegExp);
          }
        });
      });

      // add a dedicated loader for WASM
      config.module.rules.push({
        test: wasmExtensionRegExp,
        type: 'javascript/auto',
        include: path.resolve(__dirname, 'src'),
        use: [{ loader: require.resolve('wasm-loader'), options: {} }],
      });

      config.module.rules.push({
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
      });

      config.module.rules.push({
        test: /\.js$/,
        include: /node_modules/,
        loader: require.resolve('@open-wc/webpack-import-meta-loader'),
      });

      return config;
    },
  },
};
