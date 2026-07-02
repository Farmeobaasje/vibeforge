# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.3.x   | ✅ Active development |
| < 0.3.0 | ❌ Not supported   |

## Reporting a Vulnerability

VibeForge is a client-side web application that runs entirely in the browser. All data is stored locally using `localStorage` — no data is sent to any server unless you configure an AI provider endpoint.

If you discover a security vulnerability, please report it by opening a [GitHub Issue](https://github.com/Farmeobaasje/vibeforge/issues) with the label `security`.

Please include the following in your report:

- A clear description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Any suggested fixes (if applicable)

We will acknowledge receipt within 48 hours and provide an estimated timeline for a fix.

## Security Considerations

### AI Provider API Keys

- API keys for AI providers (OpenAI, Anthropic, etc.) are stored in `localStorage`
- They are never transmitted to any server other than the configured AI provider endpoint
- Consider using environment variables or a secure key management service for production deployments

### Data Storage

- All project data is stored in the browser's `localStorage`
- No data is sent to external servers by default
- Clearing browser data will remove all stored projects

### Dependencies

We use `npm ci` for deterministic dependency installation. Dependencies are regularly updated to patch known vulnerabilities. Run `npm audit` periodically to check for vulnerabilities in your local installation.

## Best Practices

1. Keep your dependencies up to date
2. Use strong, unique API keys for AI providers
3. Clear browser storage when switching between sensitive projects
4. Review generated project definitions before sharing them
5. Report any security issues promptly
