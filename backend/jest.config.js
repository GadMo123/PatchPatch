module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
    transform: {
      '^.+\\.tsx?$': 'ts-jest'
    },
    moduleNameMapper: {
      '^shared/(.*)$': '<rootDir>/../shared/dist-node/$1',
      '^game/(.*)$': '<rootDir>/src/game/$1'  // This maps to src/game from project root
    },
    modulePaths: ['<rootDir>/src'],  // Add this to include src as a module resolution root
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coveragePathIgnorePatterns: [
      '/node_modules/',
      '/dist/'
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
  };