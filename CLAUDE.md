# CLAUDE.md - Project Information for Claude Code

This file provides context and commands for development in the **SplitHouse** project.

## Build and Run Commands
- **Install dependencies**: `npm install`
- **Build project**: `npm run build`
- **Start development server**: `npm run start` (or `ng serve`)
- **Watch build**: `npm run watch`

## Test and Lint Commands
- **Run tests**: `npm run test` (uses Vitest)
- **Lint/Format check**: `npx prettier --check .`
- **Format code**: `npx prettier --write .`

## Code Style and Guidelines
- **Framework**: Angular 21
- **Language**: TypeScript (Strict mode enabled)
- **Styling**: Vanilla CSS with custom properties, Glassmorphism, and Flexbox/Grid. Avoid Tailwind CSS unless explicitly requested.
- **Formatting**: 
  - Use Prettier for all files (defined in `.prettierrc`).
  - Single quotes for strings: `true`
  - Print width: `100`
  - HTML parser: `angular`
- **Naming Conventions**:
  - Components/Services/Files: `kebab-case.component.ts` (Angular standard)
  - Classes: `PascalCase`
  - Variables/Functions: `camelCase`
- **Imports**: Organize imports alphabetically; group Angular core/common imports at the top.
- **Architecture**:
  - Follow standard Angular feature-based structure (`src/app/pages/...`, `src/app/components/...`).
  - Use JWT HTTP Interceptors for secure API communication.
