# Salla Twilight Component Starter

Starter setup for developing custom **Salla Twilight Components** using **Lit** and **Vite**.

## Requirements

* Node.js
* pnpm
* Salla Twilight Bundles

## Setup

### 1. Install Dependencies

```bash
pnpm run install-deps
```

### 2. Initialize Twilight Starter Kit

```bash
pnpm run tw-init
```

### 3. Apply Windows Fix

إذا كنت تعمل على Windows وظهر `404` عند تحميل الـ component:

```bash
pnpm run fix-twilight
```

هذا الأمر يصلح مشكلة `/@fs` path داخل `sallaDemoPlugin`.

### 4. Start Development Server

```bash
pnpm run dev
```

ثم افتح:

```text
http://localhost:5176/
```

## Available Scripts

| Command                 | Description                         |
| ----------------------- | ----------------------------------- |
| `pnpm run install-deps` | Install project dependencies        |
| `pnpm run tw-init`      | Initialize the Twilight Starter Kit |
| `pnpm run fix-twilight` | Apply Windows `/@fs` path fix       |
| `pnpm run dev`          | Start Vite development server       |
| `pnpm run build`        | Build the project                   |
| `pnpm run preview`      | Preview the production build        |

## Project Structure

```text
tw-test-fmf/
├── src/
│   └── components/
│       └── first-component/
│           └── index.ts
├── templates/
├── scripts/
│   └── fix-twilight.js
├── twilight-bundle.json
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## Creating a Component

Components are located inside:

```text
src/components/<component-name>/index.ts
```

Example:

```ts
import { html, LitElement } from 'lit';

export default class FirstComponent extends LitElement {
  render() {
    return html`
      <div>
        Hello Salla
      </div>
    `;
  }
}
```

## Windows 404 Fix

The Twilight demo plugin may generate an incorrect Vite filesystem URL on Windows.

### Before

```js
const I = `/@fs${_}`
```

### After

```js
const I = `/@fs/${_}`
```

The fix is applied automatically by:

```bash
pnpm run fix-twilight
```

## Development Flow

```text
Install
   ↓
pnpm run install-deps
   ↓
Initialize
   ↓
pnpm run tw-init
   ↓
Windows Fix
   ↓
pnpm run fix-twilight
   ↓
Development
   ↓
pnpm run dev
   ↓
Twilight Component Demo
```

## Tech Stack

* Salla Twilight
* Lit
* Vite
* TypeScript
* pnpm