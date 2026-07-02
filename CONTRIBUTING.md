# Contributing to VibeForge

First off, thank you for considering contributing to VibeForge! It's people like you that make the open-source community such a fantastic place.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating a bug report, please check the [existing issues](https://github.com/Farmeobaasje/vibeforge/issues) to see if the problem has already been reported. If it hasn't, create a new issue with:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs. actual behavior
- Screenshots if applicable
- Your environment (browser, OS, Node.js version)

### Suggesting Enhancements

Enhancement suggestions are tracked as [GitHub issues](https://github.com/Farmeobaasje/vibeforge/issues). When creating one:

- Use a clear and descriptive title
- Provide a step-by-step description of the suggested enhancement
- Explain why this enhancement would be useful
- List any alternative solutions you've considered

### Adding Domain Templates

VibeForge uses domain-specific templates to generate tailored project blueprints. To add a new domain:

1. Open `src/semantic/domainTemplates.ts`
2. Create a new `DomainTemplate` object following the existing pattern
3. Add it to the `ALL_DOMAINS` array
4. Add strong/weak keywords for semantic classification
5. Update the domain table in `README.md`

### Adding AI Providers

To add a new AI provider:

1. Create a new file in `src/ai/providers/` implementing the `AIProvider` interface
2. Register it in `src/ai/provider-config.ts`
3. Add provider-specific settings in `src/ai/settings.ts`
4. Update capabilities in `src/ai/capabilities.ts`

## Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/your-username/vibeforge.git
cd vibeforge

# Install dependencies
npm ci

# Start the development server
npm run dev

# Run tests
npm test

# Run linter
npm run lint

# Build for production
npm run build
```

## Project Structure

```
src/
├── ai/              # AI provider abstraction layer
├── canonical/       # Canonical data model
├── components/      # React UI components
├── demo/            # Demo scenarios
├── generator/       # Generation pipeline
├── hooks/           # React hooks
├── intelligence/    # Domain classification
├── lib/             # Utilities
├── models/          # Data models
├── orchestrator/    # Interview orchestration
├── semantic/        # Domain templates
├── types/           # TypeScript types
└── __tests__/       # Test suite
```

## Style Guides

### Git Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
```

Types: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `ci`

Examples:
- `feat(interview): add follow-up question generation`
- `fix(generator): handle empty domain template`
- `docs(readme): update quick start guide`

### TypeScript Style

- Use TypeScript strict mode
- Prefer `interface` over `type` for object shapes
- Use `type` for unions, intersections, and utility types
- Export types from barrel files (`index.ts`)
- Use JSDoc comments for public APIs

### Component Style

- Use functional components with hooks
- Co-locate styles using Tailwind CSS utility classes
- Use CSS variables from the design system (`var(--vf-*)`)
- Export components as named exports
- Define Props interface above the component

## Testing

- Write tests for all new features
- Run the full test suite before submitting: `npm test`
- Update snapshots when changing generator output: `npm test -- --update`
- Add golden test projects for new domain templates

## Pull Request Process

1. Fork the repository and create your branch from `main`
2. If you've added code, add tests
3. Ensure the test suite passes
4. Make sure your code lints (`npm run lint`)
5. Update the README if needed
6. Create a pull request with a clear description of changes

## Questions?

Feel free to open a [discussion](https://github.com/Farmeobaasje/vibeforge/discussions) or reach out via [Buy Me a Coffee](https://www.buymeacoffee.com/lynoa).

Thank you for contributing! 🚀
