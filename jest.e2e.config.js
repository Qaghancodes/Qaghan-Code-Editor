module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: '.e2e-spec.ts$',
  moduleFileExtensions: ['ts', 'js'],
  setupFilesAfterEnv: ['<rootDir>/src/test/e2e-setup.ts']
}; 