# Agent Guidelines for schmart-icp

## Commands
- **Build/Run**: `pnpm dev`
- **Lint**: `pnpm lint` / `pnpm lint:fix`
- **Format**: `pnpm format` / `pnpm format:fix`
- **Typecheck**: `pnpm typecheck`
- **Test all**: `pnpm test`
- **Test single file**: `vitest run src/<filename>.test.ts`
- **CI**: `pnpm ci` (format + lint + typecheck + test)

## Code Style
- **Language**: TypeScript with strict mode enabled
- **Modules**: ES modules with `.ts` extensions in imports
- **Formatting**: Tabs for indentation, double quotes
- **Imports**: Organized automatically (Biome assist enabled)
- **Naming**: PascalCase for types/interfaces, camelCase for functions/variables
- **Validation**: Use Zod schemas for data validation
- **Error Handling**: Parse responses with Zod, use Logger for output
- **Dependencies**: OpenAI API, dotenv for config