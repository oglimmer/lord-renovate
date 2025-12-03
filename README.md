# Renovate Config Editor

A web-based visual editor for [Renovate](https://docs.renovatebot.com/) configuration files. Create and edit `renovate.json` configurations with an intuitive interface, or switch to JSON mode for direct editing.

## Features

- **Load from GitHub**: Import existing `renovate.json` files directly from GitHub repositories
- **Visual Editor**: User-friendly interface for configuring Renovate settings
- **JSON Editor**: Switch to JSON mode for direct code editing
- **Preset Support**: Select from common Renovate presets with descriptions
- **Package Rules**: Create custom rules to control how Renovate handles different dependency types
- **Export Options**: Download configuration file or copy to clipboard
- **Live Preview**: Real-time validation and preview of your configuration

## Live Demo

Visit the deployed application at: [https://[your-username].github.io/lord-renovate/](https://[your-username].github.io/lord-renovate/)

## Configuration Options

The editor supports all major Renovate configuration options including:

- **General Settings**: Enable/disable features, dependency dashboard, vulnerability alerts
- **Scheduling & Limits**: Control when and how many PRs to create
- **Merge Strategy**: Configure automerge behavior and range strategies
- **Package Rules**: Define custom rules for different package types and update types
- **Lock File Maintenance**: Configure periodic lock file updates
- **Manager-Specific Configuration**: Set file patterns for specific package managers

## Development

### Prerequisites

- Node.js `^20.19.0 || >=22.12.0`
- npm

### Project Setup

```sh
npm install
```

### Development Server

```sh
npm run dev
```

### Type Checking

```sh
npm run type-check
```

### Build for Production

```sh
npm run build
```

### Preview Production Build

```sh
npm run preview
```

### Linting

```sh
npm run lint
```

### Formatting

```sh
npm run format
```

## Testing

### Unit Tests

```sh
npm run test:unit
```

### End-to-End Tests

```sh
# Install browsers for the first run
npx playwright install

# Build the project first (required for CI)
npm run build

# Run all e2e tests
npm run test:e2e

# Run tests only on Chromium
npm run test:e2e -- --project=chromium

# Run tests for a specific file
npm run test:e2e -- tests/example.spec.ts

# Run tests in debug mode
npm run test:e2e -- --debug
```

## Tech Stack

- **Framework**: Vue 3 with Composition API
- **Build Tool**: Vite
- **Language**: TypeScript
- **State Management**: Pinia
- **Routing**: Vue Router
- **Testing**: Vitest (unit) + Playwright (e2e)
- **Code Quality**: ESLint + Prettier

## Project Structure

```
src/
├── components/
│   ├── RenovateEditor.vue    # Main visual editor component
│   └── UrlInput.vue           # GitHub URL input component
├── views/
│   └── HomeView.vue           # Main application view
├── types.ts                   # TypeScript type definitions
├── defaults.ts                # Default Renovate configuration
└── main.ts                    # Application entry point
```

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

[Add your license here]

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/)
- [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) extension

## Recommended Browser Extensions

### Chromium-based browsers (Chrome, Edge, Brave, etc.)
- [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
- [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)

### Firefox
- [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
- [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Learn More

- [Renovate Documentation](https://docs.renovatebot.com/)
- [Renovate Configuration Reference](https://docs.renovatebot.com/configuration-options/)
- [Vite Configuration Reference](https://vite.dev/config/)
