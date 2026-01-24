# React Modern Stack Template

A modern, production-ready React starter template built with Vite, TanStack Router, TanStack Query, shadcn/ui, and Tailwind CSS v4.

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TanStack Router** - Type-safe routing
- **TanStack Query** - Powerful data synchronization
- **shadcn/ui** - Composable component library
- **Tailwind CSS v4** - Utility-first CSS framework
- **Zod v4** - TypeScript-first schema validation

## Features

- ⚡️ Lightning-fast HMR with Vite
- 🎯 Type-safe routing with TanStack Router
- 🔄 Powerful async state management with TanStack Query
- ✅ Runtime validation with Zod
- 🎨 Beautiful, accessible components with shadcn/ui
- 🔧 Utility-first styling with Tailwind CSS v4
- 📦 Production-ready build configuration
- 🚀 Optimized for modern development workflow

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm/yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name

# Install dependencies
npm install
# or
pnpm install
# or
yarn install
```

### Development
```bash
# Start the development server
npm run dev
# or
pnpm dev
# or
yarn dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build
```bash
# Create a production build
npm run build
# or
pnpm build
# or
yarn build
```

### Preview
```bash
# Preview the production build locally
npm run preview
# or
pnpm preview
# or
yarn preview
```

## Project Structure
```
├── src/
│   ├── components/     # Reusable React components
│   ├── pages/          # Page components
│   ├── routes/         # TanStack Router routes
│   ├── lib/            # Utility functions
│   └── main.tsx        # Application entry point
├── public/             # Static assets
└── package.json
```

## Adding Components

This template uses shadcn/ui. To add new components:
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
# etc.
```

## Key Integrations

### TanStack Query

Pre-configured for efficient server state management:
```typescript
import { useQuery } from '@tanstack/react-query'

const { data, isLoading } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
})
```

### TanStack Router

Type-safe routing with automatic code splitting:
```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})
```

### Zod Validation

Runtime type validation for forms and API responses:
```typescript
import { z } from 'zod'

const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
})
```

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- [Vite](https://vitejs.dev/)
- [TanStack Router](https://tanstack.com/router)
- [TanStack Query](https://tanstack.com/query)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zod](https://zod.dev/)
