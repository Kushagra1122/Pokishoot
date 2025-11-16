module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'services/**/*.js',
    'controllers/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  setupFilesAfterEnv: [],
  testTimeout: 30000,
};

