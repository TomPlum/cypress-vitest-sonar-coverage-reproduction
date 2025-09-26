import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import istanbul from 'vite-plugin-istanbul'
import dts from 'vite-plugin-dts'
import {resolve} from "path";

export default defineConfig({
  plugins: [
    react(),
    istanbul({
      cypress: true,
      requireEnv: false,
      nycrcPath: '.nycrc.json'
    }),
    dts({
      tsconfigPath: './tsconfig.bundle.json'
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: 'inline',
    lib: {
      formats: ['es'],
      entry: resolve(__dirname, './src/index.ts'),
      name: 'Test Library',
      fileName: 'test-library'
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    reporters: ['default', 'html', 'junit'],
    outputFile: {
      html: './.vitest/html/vitest-test-report.html',
      junit: './.vitest/junit'
    },
    mockReset: true,
    setupFiles: './src/setupTests.ts',
    css: {
      modules: {
        classNameStrategy: 'non-scoped'
      }
    },
    coverage: {
      provider: 'istanbul',
      include: ['src/TestComponent.tsx'],
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage-unit-dir'
    }
  }
})
