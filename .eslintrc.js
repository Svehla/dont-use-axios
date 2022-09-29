module.exports = {
  // USE REACT-APP ESLINT INSTEAD ONE IN THE PACKAGE.JSON ->
  // -> https://www.npmjs.com/package/eslint-config-react-app (but no real-time warnings)

  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  extends: [
    // 'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
    'plugin:react/recommended',
    'prettier',
    'plugin:prettier/recommended', // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
  ],
  parserOptions: {
    ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
    ecmaFeatures: {
      jsx: true, // Allows for the parsing of JSX
    },
  },
  rules: {
    semi: 'off',
    // 'no-unused-vars': [1, { argsIgnorePattern: '^_' }],
    '@typescript-eslint/ban-ts-ignore': 0,
    'eslint-disable-next-line': 0,
    'linebreak-style': 0,
    '@typescript-eslint/explicit-member-accessibility': 0,
    eqeqeq: 'error',
    'max-len': 'off',
    'new-parens': 'error',
    'no-bitwise': 'error',
    'no-console': ['warn', { allow: ['warn', 'info', 'log', 'error'] }],
    'no-caller': 'error',
    'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1, maxBOF: 0 }],
    'quote-props': ['error', 'as-needed'],
    'sort-imports-es6-autofix/sort-imports-es6': [
      2,
      {
        ignoreCase: false,
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
      },
    ],
    '@typescript-eslint/ban-ts-comment': 0,
    'no-irregular-whitespace': 'warn',
    'react-hooks/exhaustive-deps': 0,
    'react/display-name': 0,
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    // https://mui.com/material-ui/guides/minimizing-bundle-size/#option-1
    'no-restricted-imports': [
      'error',
      {
        patterns: ['@mui/*/*/*', '!@mui/material/test-utils/*'],
      },
    ],
  },
  plugins: ['sort-imports-es6-autofix'],
  settings: {
    react: {
      version: 'detect', // Tells eslint-plugin-react to automatically detect the version of React to use
    },
  },
}
