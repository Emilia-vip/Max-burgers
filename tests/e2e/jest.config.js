module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: process.env.CI ? 60000 : 30000,
};
