import type { Config } from 'jest';

const config: Config = {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Collect coverage information
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  coverageReporters: ["json", "text", "lcov"],

  // Run tests in a Node.js environment
  testEnvironment: "node",

  // Glob patterns Jest uses to detect test files
  testMatch: ["**/tests/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[tj]s?(x)"],

  // Transform TypeScript files using ts-jest
  preset: 'ts-jest',

  // Transform configuration
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },

  // Module file extensions for importing
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],

  // Root directory to scan for tests and modules within
  roots: ["<rootDir>/src"],

  // Automatically reset mock state between every test
  resetMocks: true,

  // Test path ignore patterns
  testPathIgnorePatterns: ["/node_modules/", "/build/"],

  // Module name mapper for path aliases (adjust if you use path aliases)
  moduleNameMapper: {
    "^@src/(.*)$": "<rootDir>/src/$1",
  },

  // Coverage path ignore patterns
  coveragePathIgnorePatterns: ["/node_modules/", "/build/"],
};

export default config;
