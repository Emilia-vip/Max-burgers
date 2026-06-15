module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: process.env.CI ? 180000 : 30000,
  verbose: !!process.env.CI,
};
