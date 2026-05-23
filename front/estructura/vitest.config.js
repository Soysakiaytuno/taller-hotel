// vitest.config.js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      all: true, // Obliga a escanear código sin tests (0%)
      include: ['**/*.js'], // Asegúrate de que apunte a tus archivos JS
      exclude: ['node_modules', 'test', 'vitest.config.js'],
      reporter: ['html']
    }
  }
})