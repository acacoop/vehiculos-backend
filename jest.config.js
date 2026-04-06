/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/scripts/**",
  ],
  testTimeout: 30000, // 30 seconds for database operations
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.ts"],
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          module: "esnext",
          target: "ES2022",
          moduleResolution: "node",
        },
      },
    ],
  },
  moduleNameMapper: {
    // Stub out the real ESM-only package with a TypeScript mock ts-jest can process
    "^expo-server-sdk$": "<rootDir>/src/scripts/expo-server-sdk.ts",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
