# Howell-Tech-Platform

Shared library platform for Howell Technologies. Published as `@howell-tech/platform` to JFrog Artifactory for use in client applications.

## Installation

Install from your Artifactory npm registry:

```bash
npm install @howell-tech/platform
```

> Your `.npmrc` must be configured to resolve the `@howell-tech` scope from Artifactory. See the [Publishing](#publishing) section for details.

## Usage

```ts
import { hello } from "@howell-tech/platform";

console.log(hello("World")); // "Hello, World!"
```

## Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
git clone https://github.com/Austinh132324/Howell-Tech-Platform.git
cd Howell-Tech-Platform
npm install
```

### Scripts

| Command          | Description                                  |
| ---------------- | -------------------------------------------- |
| `npm run build`  | Bundle with tsup (CJS + ESM + declarations)  |
| `npm test`       | Run tests with vitest                        |
| `npm run lint`   | Lint with ESLint                             |
| `npm run clean`  | Remove the `dist/` directory                 |

## Publishing

Releases are published to JFrog Artifactory via GitHub Actions when a version tag is pushed:

```bash
# 1. Bump version
npm version patch   # or minor / major

# 2. Push the tag
git push origin --tags
```

The workflow requires two GitHub Actions secrets:

- `ARTIFACTORY_REGISTRY_URL` — your JFrog npm registry URL (e.g., `your-instance.jfrog.io/artifactory/api/npm/npm-local/`)
- `ARTIFACTORY_AUTH_TOKEN` — an Artifactory API token with publish permissions
