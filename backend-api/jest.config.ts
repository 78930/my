import type { Config } from "jest";

/**
 * ESM + TypeScript (NodeNext) Jest config for the Sketu backend.
 *
 * The source uses `.js` import specifiers (NodeNext), so we strip the
 * extension via moduleNameMapper and run ts-jest in ESM mode.
 *
 * Run with:  npm test   (which sets NODE_OPTIONS=--experimental-vm-modules)
 */
const config: Config = {
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    // Map "./foo.js" -> "./foo" so ts-jest resolves the .ts source.
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        // Loosen strictness for test ergonomics only.
        tsconfig: {
          module: "ESNext",
          moduleResolution: "Bundler",
          verbatimModuleSyntax: false,
          strict: false,
        },
      },
    ],
  },
  testMatch: ["**/src/test/**/*.test.ts"],
  testTimeout: 60000, // mongodb-memory-server cold start can be slow
};

export default config;
