// jest.config.js
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
    '!src/server.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  setupFilesAfterEnv: [
    './tests/setup.js'
  ],
  globalTeardown: './tests/teardown.js',
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: true,
  verbose: true,
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './test-report',
        filename: 'report.html',
        expand: true
      }
    ]
  ]
};