import { defineConfig } from "cypress"
import codeCoverage from '@cypress/code-coverage/task'

export default defineConfig({
  component: {
    devServer: {
      framework: "react",
      bundler: "vite"
    },
    setupNodeEvents(
      on: Cypress.PluginEvents,
      config: Cypress.PluginConfigOptions
    ) {
      return codeCoverage(on, config)
    }
  }
})
