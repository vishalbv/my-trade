module.exports = {
  // ... other configurations ...
  parserOptions: {
    // project: "./tsconfig.lint.json",
    tsconfigRootDir: __dirname,
  },
  settings: {
    "import/resolver": {
      typescript: {
        project: "./tsconfig.lint.json",
      },
    },
  },
  ignorePatterns: ["**/components/ui/**/*.tsx"],
  // ... rest of your eslint config ...
  rules: {
    "no-redeclare": "off", // or 'no-redeclare': 0
  },
};
