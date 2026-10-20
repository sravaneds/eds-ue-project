module.exports = {
  root: true,
  extends: [
    'airbnb-base',
    'plugin:json/recommended',
    'plugin:xwalk/recommended',
  ],
  env: {
    browser: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    allowImportExportEverywhere: true,
    sourceType: 'module',
    requireConfigFile: false,
  },
  rules: {
    'import/extensions': ['error', { js: 'always' }], // require js file extensions in imports
    'linebreak-style': ['error', 'unix'], // enforce unix linebreaks
    'no-param-reassign': [2, { props: false }], // allow modifying properties of param
    // tabs-item (legacy Tabs block): one cell per tab setting, read by position even when
    // optional ones are empty; tabs-section: a section model, rendered as key-value
    // section metadata rather than cells; list-theme / list-insight (List block cards): one
    // cell per card field, read by position
    'xwalk/max-cells': ['error', {
      '*': 4, 'tabs-item': 11, 'tabs-section': 13, 'list-theme': 6, 'list-insight': 9,
    }],
  },
};
