# Make Prompts Configurable via YAML

## Context

### Original Request
Make the prompts generic and configurable. User wants to move hardcoded prompts from TypeScript to a configurable format, preferring YAML for human readability.

### Interview Summary

**Key Discussions & Decisions:**
- **Config Format**: YAML (.yaml) - human-readable, supports comments, industry standard
- **Loading Strategy**: CLI override with --config flag, default path schmart.config.yaml
- **Backward Compatibility**: Migrate to config (breaking change) - clean architecture
- **Schema Handling**: Type strings approach - config specifies "number", "enum", "string"
- **System Prompt**: Keep hardcoded in prompts.ts for now (not configurable in this phase)
- **Enum Options**: Inline arrays in YAML (compact, simple)
- **Multi-Domain Support**: Single config file for all research domains
- **Metadata**: No metadata (keep config minimal)
- **Template Variables**: Dynamic support for {{company}}, {{domain}}, etc.
- **Error Handling**: Fail fast with clear error messages
- **Test Strategy**: TDD (RED-GREEN-REFACTOR) with Vitest

**Research Findings (from Librarian agent):**
- YAML excels at configuration files (Docker, Kubernetes, GitHub Actions)
- Type strings pattern is common: config specifies type, builder creates Zod schema
- Promptfoo, LangFuse, LangSmith use similar YAML-based patterns
- Runtime validation with Zod is industry standard
- Template substitution with {{var}} is a common pattern

### Metis Review

**Critical Gaps Identified and Addressed:**

1. **Migration Path**: This is a breaking change. We'll provide example config and documentation.
2. **Error Reporting**: Defined specific error messages for all failure modes (missing file, invalid YAML, unknown types, empty enums, malformed templates).
3. **Template Variable Validation**: Will check for balanced braces and validate variables provided at runtime.
4. **Schema Validation Depth**: Will validate non-empty prompts, non-empty enums for enum types, unique field names.
5. **Default Config Behavior**: Fail fast with clear error if config file doesn't exist. Will suggest creating example config.
6. **Testing Scope**: Comprehensive test coverage for config parsing, schema building, template substitution, error handling, CLI integration.

**Guardrails Applied (from Metis):**

1. **MUST NOT Change System Prompt**: Keep SYSTEM_PROMPT constant in prompts.ts. Only make researchFieldConfiguration configurable.
2. **MUST NOT Support Complex Schema Features**: Only support "number", "string", "enum". No arrays, no nesting, no refinements.
3. **MUST NOT Invent New Template Syntax**: Simple variable substitution only ({{var}}). No conditionals, loops, or filters.
4. **MUST NOT Add Configuration Versioning**: Single format, no versioning, no migration paths.
5. **MUST NOT Add Multiple Config Files**: Only schmart.config.yaml, no profiles, no inheritance.
6. **MUST NOT Support Type Safety Enhancements**: Runtime validation only. No TypeScript config file, no type generation.

**Assumptions Validated:**

1. **Type strings sufficient**: Reviewed current fields - all use number, string, or enum. No arrays or objects needed.
2. **Template variables dynamic**: Current code only uses {{company}}. System will support arbitrary variables.
3. **Breaking change acceptable**: User explicitly chose "migrate to config" over backward compatibility.
4. **YAML parsing errors sufficient**: js-yaml provides helpful error messages. Will wrap with context.
5. **Schema builder straightforward**: Will use Zod's builder pattern with type-to-schema mapping.

---

## Work Objectives

### Core Objective
Make research field prompts configurable via YAML file while maintaining type safety and test coverage.

### Concrete Deliverables
- `schmart.config.yaml` - Configuration file with current field definitions
- `src/config-loader.ts` - New module for YAML loading, validation, and schema building
- `src/prompts.ts` - Refactored to use config loader instead of hardcoded researchFieldConfiguration
- `src/cli.ts` - Updated with --config flag support
- `src/schemas.ts` - Updated with config validation schema
- `src/config-loader.test.ts` - Comprehensive test suite for config loading
- `src/prompts.test.ts` - Test suite for prompt functionality

### Definition of Done
- [ ] Config file loads successfully from default path
- [ ] --config flag overrides default path
- [ ] All 8 existing fields work with YAML config
- [ ] Type strings correctly map to Zod schemas
- [ ] Template variables substitute correctly
- [ ] Invalid configs fail with clear error messages
- [ ] All tests pass (TDD approach)
- [ ] No regressions in existing functionality
- [ ] Documentation provided (README update)

### Must Have
- YAML configuration file parsing and validation
- Runtime Zod schema building from type strings
- Template variable substitution ({{var}} format)
- CLI --config flag support
- Fail-fast error handling with clear messages
- Comprehensive test coverage (TDD)
- Example config file with all current fields

### Must NOT Have (Guardrails)

**ABSOLUTE BOUNDARIES:**
- **DO NOT** make SYSTEM_PROMPT configurable (keep hardcoded)
- **DO NOT** support complex types (arrays, objects, unions)
- **DO NOT** add template logic (conditionals, loops, filters)
- **DO NOT** implement config versioning
- **DO NOT** create multiple config files or profiles
- **DO NOT** add TypeScript config file support
- **DO NOT** implement auto-fix or config suggestions
- **DO NOT** use different template delimiters (must be {{var}})

**AI Slop Prevention:**
- **DO NOT** create "helper functions" for every edge case
- **DO NOT** over-engineer error recovery (fail fast is enough)
- **DO NOT** add "future-proofing" for features not requested
- **DO NOT** document hypothetical use cases
- **DO NOT** add unnecessary abstractions

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: YES (Vitest with 8 test files)
- **User wants tests**: YES (TDD - RED-GREEN-REFACTOR)
- **Framework**: Vitest

### TDD Workflow

Each TODO follows RED-GREEN-REFACTOR:

**Task Structure:**
1. **RED**: Write failing test first
   - Test file: `src/[module].test.ts`
   - Test command: `vitest run src/[module].test.ts`
   - Expected: FAIL (test exists, implementation doesn't)
2. **GREEN**: Implement minimum code to pass
   - Command: `vitest run src/[module].test.ts`
   - Expected: PASS
3. **REFACTOR**: Clean up while keeping green
   - Command: `vitest run src/[module].test.ts`
   - Expected: PASS (still)

**Test Coverage Target:**
- Unit tests for config parsing, schema building, template substitution
- Unit tests for error handling (all failure modes)
- Integration tests with prompts.ts and research.ts
- Test coverage >= 80% for new code

**Existing Test Patterns to Follow:**
- `src/config.test.ts:describe("DEFAULT_KEY_MAPPING constant")` - Simple constant testing
- `src/config.test.ts:describe("createKeyMappingConfig function")` - Function testing with edge cases
- Use describe/it blocks with descriptive test names
- Test happy paths and edge cases (null, undefined, empty strings, wrong types)
- Mock external dependencies where appropriate

---

## Task Flow

```
Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7 → Task 8
```

**No Parallelization**: Each task depends on previous implementation. TDD approach requires sequential RED-GREEN-REFACTOR cycles.

---

## TODOs

### Task 0: Add js-yaml Dependency

**What to do:**
- Add js-yaml package to dependencies
- Verify installation

**Must NOT do:**
- Do not add other YAML parsing libraries (yamljs, yaml-ast-parser)
- Do not add template libraries (handlebars, mustache) - we use simple substitution

**Parallelizable**: NO (first task)

**References**:

**Package Management References**:
- `package.json:29-34` - Dependencies section structure (follow this pattern)
- `AGENTS.md:Commands` - Use pnpm for package management (ALWAYS USE PNPM)

**Existing Dependencies**:
- `package.json:33` - zod dependency (version format reference)

**Acceptance Criteria** (TDD):

No test for this task - just package installation.

**Manual Execution Verification**:
- [ ] Run: `pnpm add js-yaml`
- [ ] Verify: `package.json` includes `"js-yaml": "^<version>"`
- [ ] Verify: `pnpm list js-yaml` → shows installed version

**Evidence Required**:
- [ ] Output of `pnpm add js-yaml` command
- [ ] Relevant section of package.json showing js-yaml dependency

**Commit**: YES
- Message: `chore: add js-yaml dependency for config parsing`
- Files: `package.json`
- Pre-commit: `pnpm test` (should still pass - no code changes yet)

---

### Task 1: Create Config Schema Validation

**What to do:**
- Create Zod schema for validating config file structure
- Schema should validate: fields object, prompt (string), type (enum), options (array for enum)
- Add types for config structure

**Must NOT do:**
- Do not add version field to config
- Do not add metadata fields (name, description, author)
- Do not support complex types (arrays, objects, unions)
- Do not add config validation rules beyond structure

**Parallelizable**: NO

**References**:

**Schema Definition Patterns**:
- `src/schemas.ts:5-9` - baseResponseSchema pattern (z.object with required fields)
- `src/schemas.ts:51-57` - CompanyInputArraySchema pattern (array with z.object and passthrough)

**Type Inference Patterns**:
- `src/schemas.ts:12-13` - Export type from typeof pattern (ResearchFieldConfig, ResearchFieldKey)
- `src/schemas.ts:16` - ExtractZodType helper pattern (z.infer from ZodType)

**Enum Validation Patterns**:
- `src/prompts.ts:48-63` - z.enum pattern with explicit values array

**Validation Patterns**:
- `src/schemas.ts:59-69` - createCompanyInputArraySchema pattern (function that returns z.ZodType)

**Documentation References**:
- `AGENTS.md:Dependencies & Patterns` → "Validation: Use Zod schemas for all external/untrusted data"

**Acceptance Criteria** (TDD):

**RED:**
- [ ] Test file created: `src/schemas.test.ts`
- [ ] Test: valid config with all field types passes validation
- [ ] Test: config with unknown type string fails with clear error
- [ ] Test: enum type without options array fails
- [ ] Test: enum type with empty options array fails
- [ ] Test: missing required fields (prompt, type) fail
- [ ] Test: extra fields are rejected (strict mode)
- Command: `vitest run src/schemas.test.ts`
- Expected: FAIL (schema doesn't exist yet)

**GREEN:**
- [ ] Config validation schema created in `src/schemas.ts`
- [ ] Config field type defined
- [ ] Type string enum defined ("number", "string", "enum")
- [ ] Schema validates required fields
- Command: `vitest run src/schemas.test.ts`
- Expected: PASS (all tests pass)

**REFACTOR:**
- [ ] Clean up schema definition if needed
- [ ] Ensure types are properly exported
- Command: `vitest run src/schemas.test.ts`
- Expected: PASS

**Manual Execution Verification**:
- [ ] REPL verification:
  ```typescript
  > import { PromptConfigSchema } from './src/schemas.ts'
  > const validConfig = { fields: { test: { prompt: "Test {{var}}", type: "string" } } }
  > PromptConfigSchema.parse(validConfig)
  Expected: Parsed config object
  ```

**Evidence Required**:
- [ ] Test file created
- [ ] All test results (vitest output)
- [ ] REPL verification output

**Commit**: YES
- Message: `feat: add config validation schema`
- Files: `src/schemas.ts`, `src/schemas.test.ts`
- Pre-commit: `pnpm test`

---

### Task 2: Implement Schema Builder from Type Strings

**What to do:**
- Create function that builds Zod schemas from type strings
- Type strings: "number" → z.number(), "string" → z.string(), "enum" with options → z.enum([...])
- Handle edge cases: invalid type strings, missing options for enum

**Must NOT do:**
- Do not support arrays ("array<string>")
- Do not support objects
- Do not support union types ("string|number")
- Do not add Zod refinements (min, max, regex)
- Do not create complex schema builders

**Parallelizable**: NO

**References**:

**Zod Schema Creation Patterns**:
- `src/schemas.ts:33-41` - createExtendedSchema function pattern (returns z.ZodObject)
- `src/schemas.ts:38-40` - .extend() pattern for adding fields to schema

**Schema Types Reference**:
- `src/prompts.ts:38` - z.number() example
- `src/prompts.ts:48-63` - z.enum([...]) example with string array

**Error Handling Patterns**:
- `AGENTS.md:Error Handling` → "Throw descriptive errors with context, use Logger for output"
- `src/processor.ts` (to be read) - Error handling for individual items in batch processing

**Documentation References**:
- `AGENTS.md:Dependencies & Patterns` → "Type Inference: Extract types from Zod schemas when appropriate"

**Acceptance Criteria** (TDD):

**RED:**
- [ ] Test file created: `src/config-loader.test.ts`
- [ ] Test: type "string" → z.string()
- [ ] Test: type "number" → z.number()
- [ ] Test: type "enum" with options array → z.enum([...])
- [ ] Test: invalid type string → throws descriptive error
- [ ] Test: enum type without options → throws descriptive error
- [ ] Test: enum type with empty options → throws descriptive error
- Command: `vitest run src/config-loader.test.ts`
- Expected: FAIL (builder function doesn't exist)

**GREEN:**
- [ ] Schema builder function created in `src/config-loader.ts`
- [ ] Type string to schema mapping implemented
- [ ] Error handling for invalid types
- Command: `vitest run src/config-loader.test.ts`
- Expected: PASS

**REFACTOR:**
- [ ] Clean up function
- [ ] Ensure error messages are clear and actionable
- Command: `vitest run src/config-loader.test.ts`
- Expected: PASS

**Manual Execution Verification**:
- [ ] REPL verification:
  ```typescript
  > import { buildZodSchema } from './src/config-loader.ts'
  > buildZodSchema({ type: "string" })
  Expected: ZodStringSchema
  > buildZodSchema({ type: "enum", options: ["a", "b"] })
  Expected: ZodEnumSchema
  > buildZodSchema({ type: "invalid" })
  Expected: Error with message
  ```

**Evidence Required**:
- [ ] Test file created
- [ ] All test results
- [ ] REPL verification output

**Commit**: YES
- Message: `feat: implement schema builder from type strings`
- Files: `src/config-loader.ts`, `src/config-loader.test.ts`
- Pre-commit: `pnpm test`

---

### Task 3: Implement YAML Config Loader

**What to do:**
- Create function to load and parse YAML config file
- Validate config structure using schema from Task 1
- Handle errors: file not found, invalid YAML, validation failure
- Support default path and custom path override

**Must NOT do:**
- Do not implement hot reload (config file changes during runtime)
- Do not implement config caching (unless performance issue discovered)
- Do not support multiple config files
- Do not add config file watchers
- Do not implement fallback to hardcoded prompts

**Parallelizable**: NO

**References**:

**File I/O Patterns**:
- `src/file-io.ts` - Read existing file reading patterns, error handling

**Error Handling Patterns**:
- `src/config.test.ts:91-103` - Null/undefined value handling pattern
- `src/config.test.ts:117-129` - Error handling pattern (throw, don't return null)

**CLI Integration Patterns**:
- `src/cli.ts` - Read existing CLI pattern, how args are passed to functions

**js-yaml Usage**:
- Research js-yaml API for loading and parsing

**Documentation References**:
- `AGENTS.md:File I/O` → "Validate JSON files against Zod schemas before use"
- `AGENTS.md:Dependencies & Patterns` → "Environment Variables: Load dotenv at entry point"

**Acceptance Criteria** (TDD):

**RED:**
- [ ] Test: load valid config file → returns parsed config
- [ ] Test: load config with default path → uses schmart.config.yaml
- [ ] Test: load config with custom path → uses provided path
- [ ] Test: file not found → throws error with clear message
- [ ] Test: invalid YAML syntax → throws error with file path and line info
- [ ] Test: config validation fails → throws error with field path
- [ ] Test: config with extra fields → fails validation (strict mode)
- Command: `vitest run src/config-loader.test.ts`
- Expected: FAIL (loader doesn't exist)

**GREEN:**
- [ ] Config loader function created
- [ ] js-yaml integration implemented
- [ ] Schema validation integrated
- [ ] Error handling for all failure modes
- Command: `vitest run src/config-loader.test.ts`
- Expected: PASS

**REFACTOR:**
- [ ] Ensure error messages include file path and helpful context
- [ ] Verify function is exported correctly
- Command: `vitest run src/config-loader.test.ts`
- Expected: PASS

**Manual Execution Verification**:
- [ ] Create test config: `schmart.config.yaml`
- [ ] Run loader function
- [ ] Expected: Returns validated config object

**Evidence Required**:
- [ ] Test results
- [ ] Error message examples (for file not found, invalid YAML, validation fail)

**Commit**: YES
- Message: `feat: implement YAML config loader`
- Files: `src/config-loader.ts`, `schmart.config.yaml` (example)
- Pre-commit: `pnpm test`

---

### Task 4: Implement Template Variable Substitution

**What to do:**
- Create function to substitute variables in prompt templates
- Support {{var}} format
- Validate balanced braces
- Error on missing variable values at runtime

**Must NOT do:**
- Do not use Handlebars/Mustache template libraries
- Do not add conditionals ({{#if}})
- Do not add loops ({{#each}})
- Do not add filters ({{var|uppercase}})
- Do not support nested braces or complex expressions

**Parallelizable**: NO

**References**:

**String Manipulation Patterns**:
- Research existing string manipulation in codebase (grep for "replace", "split", etc.)

**Error Handling Patterns**:
- `AGENTS.md:Error Handling` → Throw descriptive errors with context

**Template Patterns**:
- `src/prompts.ts:36-37` - Current template pattern: `prompt: (company) => \`What is... ${company}?\``

**Documentation References**:
- Research prompt template substitution best practices

**Acceptance Criteria** (TDD):

**RED:**
- [ ] Test: substitute single variable → "Hello {{name}}" + {name: "Alice"} → "Hello Alice"
- [ ] Test: substitute multiple variables → "{{greeting}} {{name}}" → "Hello Alice"
- [ ] Test: no variables in template → returns unchanged string
- [ ] Test: variable value with spaces → handled correctly
- [ ] Test: missing variable value → throws error with variable name
- [ ] Test: unbalanced opening brace → throws error
- [ ] Test: unbalanced closing brace → throws error
- [ ] Test: empty variable name {{}} → throws error
- Command: `vitest run src/config-loader.test.ts`
- Expected: FAIL

**GREEN:**
- [ ] Template substitution function created
- [ ] Regex pattern for {{var}} matching
- [ ] Balanced brace validation
- [ ] Error handling for missing variables
- Command: `vitest run src/config-loader.test.ts`
- Expected: PASS

**REFACTOR:**
- [ ] Optimize regex if needed
- [ ] Ensure error messages are clear
- Command: `vitest run src/config-loader.test.ts`
- Expected: PASS

**Manual Execution Verification**:
- [ ] REPL verification:
  ```typescript
  > import { substituteVariables } from './src/config-loader.ts'
  > substituteVariables("Hello {{name}}", { name: "Alice" })
  Expected: "Hello Alice"
  > substituteVariables("Test {{missing}}", {})
  Expected: Error: "Missing variable: missing"
  ```

**Evidence Required**:
- [ ] Test results
- [ ] REPL verification output

**Commit**: YES
- Message: `feat: implement template variable substitution`
- Files: `src/config-loader.ts`
- Pre-commit: `pnpm test`

---

### Task 5: Create schmart.config.yaml with Current Prompts

**What to do:**
- Create schmart.config.yaml file at root
- Migrate all 8 existing fields from prompts.ts to YAML
- Ensure all prompt templates use {{company}} instead of template function
- Include all enum options exactly as they are in code
- Add comments for clarity (YAML supports comments)

**Must NOT do:**
- Do not add SYSTEM_PROMPT to config
- Do not change prompt text (exact migration)
- Do not add metadata (version, author, description)
- Do not create multiple config files

**Parallelizable**: NO

**References**:

**Existing Prompts Structure**:
- `src/prompts.ts:34-111` - researchFieldConfiguration (exact migration source)

**Field Definitions**:
- `src/prompts.ts:35-39` - employees field
- `src/prompts.ts:40-44` - revenue field
- `src/prompts.ts:45-64` - eam_tool field (with enum options)
- `src/prompts.ts:65-69` - eam_practice field
- `src/prompts.ts:70-74` - itBp_practice field
- `src/prompts.ts:75-90` - itsm_tool field (with enum options)
- `src/prompts.ts:91-95` - sam_practice field
- `src/prompts.ts:96-110` - sam_tool field (with enum options)

**Type Definitions**:
- `src/schemas.ts:3-6` - DataField type pattern (prompt function + valueSchema)
- `src/schemas.ts:12` - ResearchFieldConfig type (typeof researchFieldConfiguration)

**Acceptance Criteria** (TDD):

**RED:**
- [ ] Test: config file exists and is valid YAML
- [ ] Test: config file has all 8 fields from original
- [ ] Test: config file validates against PromptConfigSchema
- Command: `vitest run src/config-loader.test.ts`
- Expected: FAIL (file doesn't exist)

**GREEN:**
- [ ] schmart.config.yaml created
- [ ] All 8 fields migrated from prompts.ts
- [ ] Prompt templates use {{company}} variable
- [ ] All enum options included
- [ ] Config validates successfully
- Command: `vitest run src/config-loader.test.ts`
- Expected: PASS

**REFACTOR:**
- [ ] Add helpful comments to config file
- [ ] Ensure consistent formatting
- Command: `vitest run src/config-loader.test.ts`
- Expected: PASS

**Manual Execution Verification**:
- [ ] Run: `pnpm run dev` with config file present
- [ ] Expected: Config loads successfully, research works

**Evidence Required**:
- [ ] schmart.config.yaml file content
- [ ] Config validation output
- [ ] Test run output

**Commit**: YES
- Message: `feat: create schmart.config.yaml with current prompts`
- Files: `schmart.config.yaml`
- Pre-commit: `pnpm test`

---

### Task 6: Refactor prompts.ts to Use Config Loader

**What to do:**
- Replace hardcoded researchFieldConfiguration with config loader
- Keep SYSTEM_PROMPT constant unchanged
- Export function to load and get field configuration
- Ensure types are compatible with existing code
- Update exports to maintain API compatibility

**Must NOT do:**
- Do not modify SYSTEM_PROMPT
- Do not change the DataField type signature
- Do not break existing imports (schemas.ts, research.ts)

**Parallelizable**: NO

**References**:

**Existing prompts.ts Structure**:
- `src/prompts.ts:1-2` - Imports (z from "zod")
- `src/prompts.ts:3-6` - DataField type definition
- `src/prompts.ts:8-32` - SYSTEM_PROMPT constant (DO NOT CHANGE)
- `src/prompts.ts:34-111` - researchFieldConfiguration (TO BE REPLACED)

**Research Module Usage**:
- `src/research.ts:3` - Imports researchFieldConfiguration
- `src/research.ts:11-13` - Gets field keys from config
- `src/research.ts:51-54` - Iterates over field entries
- `src/research.ts:65` - Uses field.prompt(company)

**Schema Module Usage**:
- `src/schemas.ts:3` - Imports researchFieldConfiguration
- `src/schemas.ts:12` - Type extraction from researchFieldConfiguration
- `src/schemas.ts:36` - Uses config to build extended schema

**Config Loader Integration**:
- Task 1-4 outputs (config schema, loader, substitution)
- Task 5 output (schmart.config.yaml)

**Acceptance Criteria** (TDD):

**RED:**
- [ ] Test: loadFieldConfiguration returns correct type
- [ ] Test: loadFieldConfiguration has same structure as original researchFieldConfiguration
- [ ] Test: SYSTEM_PROMPT is still exported
- [ ] Test: field prompts are functions (backward compatibility)
- [ ] Test: field valueSchemas are Zod types (backward compatibility)
- Command: `vitest run src/prompts.test.ts`
- Expected: FAIL (config loader not integrated)

**GREEN:**
- [ ] researchFieldConfiguration replaced with getResearchFieldConfiguration function
- [ ] Function loads config, builds schemas, returns field configuration
- [ ] Field prompts are wrapped as functions (backward compatible)
- [ ] SYSTEM_PROMPT still exported as constant
- [ ] Types maintain compatibility with existing imports
- Command: `vitest run src/prompts.test.ts`
- Expected: PASS

**REFACTOR:**
- [ ] Clean up exports
- [ ] Ensure no unused imports
- [ ] Add JSDoc comments if needed
- Command: `vitest run src/prompts.test.ts`
- Expected: PASS

**Manual Execution Verification**:
- [ ] Run: `pnpm run dev "TestCompany"`
- [ ] Expected: Research works, all fields researched
- [ ] Verify: Log shows prompts being used correctly

**Evidence Required**:
- [ ] Test results
- [ ] Research execution output
- [ ] No errors or warnings

**Commit**: YES
- Message: `refactor: prompts.ts to use YAML config loader`
- Files: `src/prompts.ts`
- Pre-commit: `pnpm test`

---

### Task 7: Add --config Flag to CLI

**What to do:**
- Add --config flag to yargs configuration
- Pass config path to prompts loader
- Use default path (schmart.config.yaml) if flag not provided
- Update CLI help text and examples

**Must NOT do:**
- Do not add other CLI options (this is the only new flag)
- Do not change existing CLI behavior if --config not provided
- Do not implement config file discovery (only explicit flag or default)

**Parallelizable**: NO

**References**:

**Existing CLI Pattern**:
- `src/cli.ts` - Read existing yargs configuration
- `AGENTS.md:Implementation Patterns` → CLI Pattern: "Use yargs with examples for user-friendly CLI"

**Config Loader Integration**:
- Task 3 output (loadConfig function with path parameter)
- Task 6 output (getResearchFieldConfiguration function)

**Environment Variable Pattern**:
- `src/index.ts` - Load dotenv at entry point

**Documentation References**:
- `AGENTS.md:Commands` → CLI usage patterns

**Acceptance Criteria** (TDD):

**RED:**
- [ ] Test: CLI without --config flag uses default path
- [ ] Test: CLI with --config flag uses provided path
- [ ] Test: CLI with invalid config path shows error
- [ ] Test: CLI help text includes --config option
- Command: `vitest run src/cli.test.ts`
- Expected: FAIL (flag not added)

**GREEN:**
- [ ] --config option added to yargs
- [ ] Config path passed to loader function
- [ ] Default path used when flag not provided
- [ ] Help text updated
- Command: `vitest run src/cli.test.ts`
- Expected: PASS

**REFACTOR:**
- [ ] Clean up CLI configuration
- [ ] Ensure consistent indentation and formatting
- Command: `vitest run src/cli.test.ts`
- Expected: PASS

**Manual Execution Verification**:
- [ ] Run: `pnpm run dev "TestCompany"`
- [ ] Expected: Uses schmart.config.yaml (default)
- [ ] Run: `pnpm run dev "TestCompany" --config custom-config.yaml`
- [ ] Expected: Uses custom-config.yaml
- [ ] Run: `pnpm run dev "TestCompany" --help`
- [ ] Expected: Shows --config option in help text

**Evidence Required**:
- [ ] Test results
- [ ] CLI help text output
- [ ] Research execution with default and custom config

**Commit**: YES
- Message: `feat: add --config flag to CLI`
- Files: `src/cli.ts`
- Pre-commit: `pnpm test`

---

### Task 8: Integration Tests and Documentation

**What to do:**
- Create integration tests for end-to-end flow
- Test config loading → prompt generation → research execution
- Test all 8 fields work correctly with YAML config
- Update README.md with config usage instructions
- Add example config file documentation

**Must NOT do:**
- Do not add new features (just documentation and tests)
- Do not modify test framework (use existing Vitest setup)
- Do not create separate documentation files (update README only)

**Parallelizable**: NO

**References**:

**Integration Test Pattern**:
- `src/integration.test.ts` - Read existing integration test structure

**Research Flow**:
- `src/research.ts:26-46` - researchCompany function (end-to-end flow)
- `src/research.ts:48-59` - researchAllFields function
- `src/research.ts:61-80` - researchCompanyField function

**Documentation Pattern**:
- `README.md` (to be read) - Update with config usage

**Test Coverage**:
- `AGENTS.md:Commands` → `pnpm test:watch` for test watching
- `AGENTS.md:Commands` → `pnpm run ci` for full CI (format:fix + lint:fix + typecheck + test)

**Acceptance Criteria** (TDD):

**RED:**
- [ ] Test: end-to-end research with YAML config works
- [ ] Test: all 8 fields return correct types
- [ ] Test: config errors propagate to CLI correctly
- [ ] Test: --config flag works in integration context
- Command: `vitest run src/integration.test.ts`
- Expected: FAIL (integration not tested yet)

**GREEN:**
- [ ] Integration test suite created
- [ ] End-to-end research tested
- [ ] Error propagation tested
- Command: `vitest run src/integration.test.ts`
- Expected: PASS

**REFACTOR:**
- [ ] Clean up integration tests
- Command: `vitest run src/integration.test.ts`
- Expected: PASS

**Documentation Verification:**
- [ ] README.md updated with:
  - Config file location (schmart.config.yaml)
  - How to create config file
  - How to use --config flag
  - Example config structure
  - Migration notes (breaking change)

**Manual Execution Verification**:
- [ ] Run: `pnpm run ci`
- [ ] Expected: All checks pass (format:fix + lint:fix + typecheck + test)
- [ ] Run: `pnpm run dev "TestCompany"`
- [ ] Expected: Complete research with all fields
- [ ] Run: `pnpm run dev "TestCompany" --config schmart.config.yaml`
- [ ] Expected: Uses config file successfully

**Evidence Required**:
- [ ] Integration test results
- [ ] CI command output (all checks pass)
- [ ] Research execution output
- [ ] README.md sections added/updated

**Commit**: YES (two commits)
- Message 1: `test: add integration tests for YAML config`
- Files: `src/integration.test.ts`
- Pre-commit: `pnpm test`

- Message 2: `docs: update README with config usage instructions`
- Files: `README.md`
- Pre-commit: `pnpm run ci`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 0 | `chore: add js-yaml dependency` | package.json | pnpm test |
| 1 | `feat: add config validation schema` | src/schemas.ts, src/schemas.test.ts | pnpm test |
| 2 | `feat: implement schema builder` | src/config-loader.ts, src/config-loader.test.ts | pnpm test |
| 3 | `feat: implement YAML config loader` | src/config-loader.ts, schmart.config.yaml | pnpm test |
| 4 | `feat: implement template substitution` | src/config-loader.ts | pnpm test |
| 5 | `feat: create schmart.config.yaml` | schmart.config.yaml | pnpm test |
| 6 | `refactor: prompts.ts to use config` | src/prompts.ts | pnpm test |
| 7 | `feat: add --config CLI flag` | src/cli.ts | pnpm test |
| 8a | `test: add integration tests` | src/integration.test.ts | pnpm test |
| 8b | `docs: update README` | README.md | pnpm run ci |

---

## Success Criteria

### Verification Commands
```bash
# Verify package installation
pnpm list js-yaml

# Run all tests
pnpm test

# Run CI (full check)
pnpm run ci

# Run with default config
pnpm run dev "TestCompany"

# Run with custom config
pnpm run dev "TestCompany" --config custom-config.yaml

# Check help text
pnpm run dev --help
```

### Final Checklist
- [ ] All 8 tasks completed
- [ ] All tests pass (TDD approach)
- [ ] schmart.config.yaml exists and is valid
- [ ] All 8 research fields work with YAML config
- [ ] --config flag works correctly
- [ ] Error messages are clear and actionable
- [ ] No regressions in existing functionality
- [ ] README.md updated with config usage
- [ ] CI passes (format:fix + lint:fix + typecheck + test)
- [ ] Type safety maintained (TypeScript compiles)
- [ ] Code follows project conventions (tabs, double quotes, JSDoc)

### Behavior Changes

**Before:**
- Prompts hardcoded in `src/prompts.ts`
- No external configuration
- Changing prompts required code changes

**After:**
- Prompts configured in `schmart.config.yaml`
- System prompt still in code (as decided)
- Changing prompts requires editing YAML file
- CLI override with `--config` flag
- Type-safe validation with Zod
- Fail-fast error handling

### Backward Compatibility

**Breaking Change:**
- This is a breaking change (as agreed with user)
- Old hardcoded prompts are removed
- Users must create `schmart.config.yaml` to run
- Example config provided in plan output

**Migration Path:**
- Example `schmart.config.yaml` included in plan
- README updated with config structure
- Error messages guide users to create config if missing

---

## Example schmart.config.yaml

```yaml
# Research field configurations
# Each field defines the prompt template and expected response type

fields:
  employees:
    prompt: "What is the most recent figure of employees of {{company}}?"
    type: "number"

  revenue:
    prompt: "What is the most recent figure of the revenue of {{company}}?"
    type: "number"

  eam_tool:
    prompt: "Which, if any, Enterprise Architecture Management (EAM) tool does {{company}} use?"
    type: "enum"
    options:
      - LeanIX
      - Ardoq
      - Alfabet
      - ADOIT
      - ArchiMate
      - LUY
      - Bee360
      - ServiceNow Enterprise Architecture
      - GBTEC BIC
      - Bizzdesign
      - MEGA HOPEX
      - Planview
      - other
      - unknown

  eam_practice:
    prompt: "Does {{company}} have an enterprise architecture (EA) department? Often also called Business Architecture, something IT-Enterprise-Architecture, Group EA, Unternehmensarchitektur."
    type: "enum"
    options:
      - established
      - unknown

  itBp_practice:
    prompt: "Does {{company}} have the role of IT Business Partner or IT Demand Manager? Something they are also referred to as IT Business Relation(s)/Relationship(s) Manager, IT Coordinator, Requirements Engineer, or IT Business Analyst."
    type: "enum"
    options:
      - established
      - unknown

  itsm_tool:
    prompt: "Which, if any, IT Service Management (ITSM) tool does {{company}} use?"
    type: "enum"
    options:
      - Jira Service Management
      - ServiceNow ITSM
      - Ivanti
      - Matrix42
      - Freshworks Freshservice
      - USU ITSM
      - BMC Helix ITSM
      - Omnitracker
      - other
      - unknown

  sam_practice:
    prompt: "Does {{company}} have a Software Asset Management (SAM), IT License Management, or IT Asset Management department?"
    type: "enum"
    options:
      - established
      - unknown

  sam_tool:
    prompt: "Which, if any, Software Asset Management (SAM)/IT License Management Tools tool does {{company}} use?"
    type: "enum"
    options:
      - Flexera
      - ServiceNow Software Asset Management (SAM)
      - ManageEngine AssetExplorer
      - Atera
      - Ivanti
      - USU Software Asset Management
      - Zluri
      - other
      - unknown
```
