# Agent Guidelines for schmart-icp

ALWAYS USE PNPM.

## Commands
- **Build/Run**: `pnpm dev`
- **Lint**: `pnpm lint` / `pnpm lint:fix`
- **Format**: `pnpm format` / `pnpm format:fix`
- **Typecheck**: `pnpm typecheck`
- **Test all**: `pnpm test`
- **Test single file**: `vitest run src/<filename>.test.ts`
- **Test watch**: `pnpm test:watch`
- **CI**: `pnpm run ci` (format:fix + lint:fix + typecheck + test)

## Code Style
- **Language**: TypeScript with strict mode enabled
- **Modules**: ES modules (type: "module" in package.json)
- **Imports**: Include `.ts` extensions, Biome auto-organizes imports
- **Formatting**: Tabs for indentation, double quotes (Biome enforced)
- **Naming Conventions**:
  - Types/Interfaces: PascalCase (e.g., `CompanyInput`, `KeyMappingConfig`)
  - Functions/Variables: camelCase (e.g., `normalizeCompanyInput`, `rawCompany`)
  - Constants: PascalCase for schemas (e.g., `baseResponseSchema`), UPPER_CASE for config (e.g., `DEFAULT_KEY_MAPPING`, `SYSTEM_PROMPT`)
- **Comments**: JSDoc-style for exported functions (include @param, @returns, @throws)
- **Error Handling**: Throw descriptive errors with context, use Logger for output
- **Validation**: Use Zod schemas for all external/untrusted data (JSON parsing, API responses)
- **Testing**: Vitest with describe/it blocks, comprehensive edge case coverage
- **Async**: Prefer async/await, use Promise.all for parallel operations
- **Type Inference**: Extract types from Zod schemas when appropriate

## Dependencies & Patterns
- **OpenAI API**: Use `openai` package, track token usage via globalTokenTracker
- **CLI**: yargs for argument parsing with examples and help text
- **Config**: dotenv for environment variables (.env in .gitignore)
- **File I/O**: Validate JSON files against Zod schemas before use
- **Logger**: Use Logger.debug/section/log/info/warn/error instead of console

## File Organization
- Source: `src/*.ts`, Tests: `src/*.test.ts` (co-located, flat structure)
- Export from `index.ts` for external consumers
- Entry point: `src/index.ts` loads dotenv and calls main()

## Implementation Patterns

### Zod Schema Validation
Always validate external data with Zod schemas:
```typescript
import z from "zod";

export const ExampleSchema = z.object({
  requiredField: z.string(),
  optionalField: z.number().optional(),
});

// Parse and validate
const data = ExampleSchema.parse(input);
```

### Error Handling
Throw descriptive errors with context:
```typescript
if (value === null || value === undefined) {
  throw new Error(`Missing required field 'fieldName' in ${context}`);
}
```

### Logger Usage
Use Logger instead of console:
```typescript
import { Logger } from "./logger.ts";

Logger.debug(...args);        // Conditional debug output
Logger.section("Title");       // Section separator
Logger.log(...args);           // Regular output
Logger.info(...args);          // Info output
Logger.warn(...args);          // Warning
Logger.error(...args);         // Error
```

### JSDoc Comments
Document all exported functions:
```typescript
/**
 * Normalizes input data to standard format.
 * @param rawInput - The raw input object
 * @param config - Configuration for normalization
 * @returns Normalized data object
 * @throws Error if required fields are missing
 */
export function normalizeInput(rawInput: unknown, config: Config): Output {
  // ...
}
```

### Type Inference from Zod
Extract types from Zod schemas:
```typescript
export type ExampleType = z.infer<typeof ExampleSchema>;
export type ExtractZodType<T> = T extends z.ZodType<infer U> ? U : never;
```

## Testing Guidelines
- Use `describe` and `it` from vitest
- Test happy paths and edge cases (null, undefined, empty strings, wrong types)
- Use descriptive test names
- Mock external dependencies (file system, API calls)
- Co-locate tests with source files (`module.ts` → `module.test.ts`)

## Architecture & Module Responsibilities

### Core Modules
- **api.ts**: OpenAI API integration, LLM calls with structured output
- **research.ts**: Orchestrates company research across multiple fields
- **schemas.ts**: Zod schemas for validation, type extraction helpers
- **transform.ts**: Data normalization and transformation utilities
- **config.ts**: Configuration management with defaults
- **file-io.ts**: File reading/writing with validation
- **cli.ts**: CLI argument parsing and main program flow
- **logger.ts**: Centralized logging with debug toggle
- **processor.ts**: Batch processing with concurrency control
- **tokenTracker.ts**: Token usage and cost tracking across API calls
- **prompts.ts**: Field configuration and prompt templates
- **types.ts**: TypeScript type definitions

### Research Flow Pattern
```typescript
// 1. Define field configuration in prompts.ts with schema
const fieldConfig = {
  fieldName: {
    prompt: (company) => `Research ${company}...`,
    valueSchema: z.string(),
  },
};

// 2. Use createExtendedSchema to build validation schema
const schema = createExtendedSchema("fieldName");

// 3. Call LLM with structured response
const { response, parsedOutput } = await callLLM({
  prompt: fieldConfig.prompt(companyName),
  response_schema: { name: "fieldName", schema },
});

// 4. Token usage is automatically tracked via globalTokenTracker
```

### CLI Pattern
```typescript
// Use yargs with examples for user-friendly CLI
const argv = await yargs(hideBin(process.argv))
  .usage("Usage: pnpm run dev [input] [options]")
  .example('pnpm run dev "Company"', "Research single company")
  .option("key", { type: "string", describe: "Description" })
  .help()
  .parseAsync();
```

## Important Notes

### Token Tracking
- All OpenAI API calls should use `callLLM` from `api.ts`
- Token usage is automatically tracked via `globalTokenTracker`
- Call `globalTokenTracker.logSummary()` to display totals at the end

### Schema Validation
- Always validate external JSON files before processing
- Use `createCompanyInputArraySchema(config)` for dynamic key mapping
- Use `.passthrough()` on object schemas to preserve extra fields

### Error Handling Flow
- Use try/catch in main functions (cli.ts, file-io.ts, processor.ts)
- Log errors with `Logger.error` and exit with non-zero code
- Throw descriptive errors with context from validation layers
- In processor.ts, catch individual company errors and continue batch

### Environment Variables
- Load dotenv at entry point (`src/index.ts` imports `dotenv/config`)
- Never commit `.env` file (in .gitignore)
- Use `process.env.VAR_NAME` to access variables