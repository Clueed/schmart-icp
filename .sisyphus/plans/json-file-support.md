# JSON File Support for Company Research

## Context

### Original Request
"Make this work with json files. That have lists of companies and domains and where the result should be added as keys for each company."

### Interview Summary
**Key Discussions**:
- Input JSON: Array of company objects with preserved extra keys
- File specified via CLI argument (e.g., `pnpm dev companies.json`)
- Output: Create new file `{basename}-researched.json` with research results
- Error handling: Stop on first error
- Backward compatibility: Single company name via CLI should still work
- Test strategy: TDD with Vitest

**Research Findings**:
- Current CLI: Takes company name from `process.argv.slice(2)`, calls `researchCompany()`
- `researchCompany()` returns object with `name`, `domain`, and research fields
- Output currently logged to console, not saved to file
- No existing tests, but Vitest is configured
- Zod is used for schema validation
- Token tracking via `globalTokenTracker`
- Logger used for console output

### Metis Review
**Identified Gaps** (addressed in this plan):
- File detection logic: Check if argument is an existing JSON file (`.json` extension)
- Input schema validation: Validate JSON structure before processing
- Output file handling: Overwrite existing output file if it exists
- Edge cases: Empty arrays, missing files, invalid JSON, missing required fields
- Error handling: Stop on first error as specified
- Guardrails: No changes to `researchCompany()`, no new CLI options, no parallel processing

---

## Work Objectives

### Core Objective
Add JSON file support to the company research CLI, enabling batch processing of multiple companies while preserving existing single-company CLI behavior.

### Concrete Deliverables
- Modified `src/index.ts` with file detection and batch processing logic
- New `src/types.ts` type for input company array
- Test suite covering all functionality (TDD approach)
- Example JSON input file for testing
- Backward compatible CLI (single company name still works)

### Definition of Done
- [x] `pnpm test` → All tests pass (≥90% coverage)
- [x] `pnpm dev companies.json` → Creates `companies-researched.json` with research results
- [x] `pnpm dev "Company Name"` → Still works (backward compatibility)
- [x] Output file contains all input fields plus research results
- [x] Invalid input → Appropriate error message, exit code 1
- [x] Empty array → Empty output array

### Must Have
- JSON file detection via CLI argument (check if path ends with `.json` and file exists)
- Batch processing of companies from JSON (sequential, not parallel)
- Preserve extra keys from input objects
- Write results to `{basename}-researched.json` (overwrite if exists)
- Input validation: Must be array, each item must have `name` field
- Error handling: Stop on first error, clear error messages
- Backward compatibility: Single company name via CLI still works
- Full TDD test coverage

### Must NOT Have (Guardrails)
- **NO** changes to `researchCompany()` signature or behavior
- **NO** modifications to core research logic in `src/research.ts`
- **NO** new CLI options or flags beyond file detection
- **NO** database integration or caching
- **NO** parallel processing or rate limiting
- **NO** retry logic or advanced error recovery
- **NO** progress bars or status indicators
- **NO** configuration files for this feature
- **NO** support for CSV, YAML, or other formats (JSON only)

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (Vitest configured)
- **User wants tests**: YES (TDD)
- **Framework**: Vitest
- **QA approach**: TDD workflow (RED-GREEN-REFACTOR)

### TDD Implementation

Each TODO follows RED-GREEN-REFACTOR:

**Task Structure:**
1. **RED**: Write failing test first
   - Test file: `src/index.test.ts` (main test file for CLI)
   - Test command: `pnpm test`
   - Expected: FAIL (test exists, implementation doesn't)
2. **GREEN**: Implement minimum code to pass
   - Command: `pnpm test`
   - Expected: PASS
3. **REFACTOR**: Clean up while keeping green
   - Command: `pnpm test`
   - Expected: PASS (still)

### Manual Execution Verification (ALWAYS include, even with tests)

For CLI changes:
- [x] Using bash commands:
  - Create test input file: `echo '[{"name": "Test Company"}]' > test-companies.json`
  - Run command: `pnpm dev test-companies.json`
  - Verify output file exists: `ls test-companies-researched.json`
  - Verify output content: `cat test-companies-researched.json`
  - Verify backward compatibility: `pnpm dev "Single Company"`
  - Cleanup: `rm test-companies.json test-companies-researched.json`

---

## Task Flow

```
Task 0 (Test Setup) → Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6
                      ↓         ↓         ↓         ↓         ↓         ↓
                   [tests]  [types]   [detect]  [process]  [write]   [edge cases]
```

## Parallelization

| Group | Tasks | Reason |
|-------|-------|--------|
| - | None (sequential only) | Each task depends on previous |

| Task | Depends On | Reason |
|------|------------|--------|
| 1 | 0 | Need test infrastructure first |
| 2 | 0 | Need test infrastructure first |
| 3 | 2 | Types must exist for implementation |
| 4 | 3 | Detection must work before processing |
| 5 | 4 | Processing must complete before writing |
| 6 | 5 | Core logic must work before edge cases |

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> Specify parallelizability for EVERY task.

- [x] 0. Setup Test Infrastructure (TDD - RED first)

  **What to do**:
  - Create `src/index.test.ts` with basic test structure
  - Mock `researchCompany()` and `globalTokenTracker` for testing
  - Add test for backward compatibility (single company name)
  - Add test for JSON file detection

  **Must NOT do**:
  - Write any implementation code (tests first!)
  - Modify production code in this task

  **Parallelizable**: NO (must be first)

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - `src/index.ts:6-30` - Current CLI argument handling pattern
  - `src/index.ts:1-4` - Import pattern (dotenv, Logger, researchCompany, globalTokenTracker)

  **API/Type References** (contracts to implement against):
  - `src/types.ts:CompanyInput` - Input type for individual company

  **Test References** (testing patterns to follow):
  - `vitest.config.ts:3-7` - Test environment configuration (node environment)
  - No existing test files - use Vitest standard patterns (describe, it, expect)

  **Documentation References** (specs and requirements):
  - Vitest docs: https://vitest.dev/guide/ - Basic test syntax and mocking

  **External References** (libraries and frameworks):
  - Vitest mocking: https://vitest.dev/api/mock.html - vi.mock, vi.fn

  **WHY Each Reference Matters** (explain the relevance):
  - `src/index.ts` - Shows current CLI flow and imports needed for tests
  - `src/types.ts` - Defines the shape of company data we'll be testing
  - Vitest docs - Since no test files exist, we need the framework syntax

  **Acceptance Criteria**:

  > CRITICAL: Acceptance = EXECUTION, not just "it should work".
  > The executor MUST run these commands and verify output.

  **TDD RED Phase:**
  - [ ] Test file created: `src/index.test.ts`
  - [ ] Test imports mocked correctly (vi.mock)
  - [ ] `pnpm test` → FAIL (tests exist, implementation doesn't)

  **Manual Verification:**
  - [ ] Test file exists: `ls src/index.test.ts`
  - [ ] Test file contains at least 2 test cases (single company, JSON file)

  **Commit**: NO (part of larger feature)

- [x] 1. Add Types for JSON Input (TDD - RED first)

  **What to do**:
  - Add `CompanyInputArray` type to `src/types.ts`
  - Type should be array of `CompanyInput` with index signature for extra keys
  - Write test for type validation

  **Must NOT do**:
  - Modify existing `CompanyInput` type

  **Parallelizable**: NO (depends on test setup)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `src/types.ts:1-5` - Existing `CompanyInput` type definition

  **API/Type References** (contracts to implement against):
  - User requirement: Extra keys must be preserved (use `Record<string, unknown>` or similar)

  **Test References** (testing patterns to follow):
  - `src/index.test.ts` - Add type validation tests here

  **WHY Each Reference Matters**:
  - `src/types.ts` - Shows the base type we need to extend as an array
  - Extra key preservation is critical user requirement

  **Acceptance Criteria**:

  **TDD RED Phase:**
  - [ ] Type added: `export type CompanyInputArray = Array<CompanyInput & Record<string, unknown>>`
  - [ ] Test for array type validation added
  - [ ] `pnpm test` → FAIL (type exists but no implementation uses it)

  **Manual Verification:**
  - [ ] Type defined in `src/types.ts`
  - [ ] Type is exported and can be imported

  **Commit**: NO (part of larger feature)

- [x] 2. Implement JSON File Detection Logic (TDD - RED then GREEN)

  **What to do**:
  - In `src/index.ts`, detect if argument is a JSON file path
  - Check: argument ends with `.json` AND file exists (using `fs.existsSync`)
  - Write test: Valid JSON file → returns true, missing file → returns false, non-JSON argument → returns false
  - Import `fs` module from Node.js

  **Must NOT do**:
  - Read the file yet (just detection)
  - Modify existing single-company behavior

  **Parallelizable**: NO (depends on types)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `src/index.ts:8-9` - Argument parsing pattern (`args = process.argv.slice(2)`)
  - `src/index.ts:11-16` - Error handling pattern (Logger.log, process.exit)

  **Test References** (testing patterns to follow):
  - Vitest mocking: https://vitest.dev/api/mock.html - Mock fs.existsSync for testing

  **Documentation References** (specs and requirements):
  - Node.js fs docs: https://nodejs.org/api/fs.html - fs.existsSync usage

  **External References** (libraries and frameworks):
  - None needed (Node.js built-in)

  **WHY Each Reference Matters**:
  - Argument parsing shows where to insert detection logic
  - Error handling pattern shows how to fail gracefully
  - fs.existsSync is the standard way to check file existence

  **Acceptance Criteria**:

  **TDD RED Phase:**
  - [ ] Test: Valid .json file exists → detect returns true
  - [ ] Test: .json file doesn't exist → detect returns false
  - [ ] Test: Non-.json argument → detect returns false
  - [ ] `pnpm test` → FAIL (tests exist, detection not implemented)

  **TDD GREEN Phase:**
  - [ ] `isJsonFile(filePath)` function implemented
  - [ ] `pnpm test` → PASS (detection logic works)

  **Manual Verification:**
  - [ ] Create test file: `touch test.json`
  - [ ] Run: `node -e "import('./dist/index.js').then(m => console.log('Loaded'))"` (or similar after build)
  - [ ] Delete test file: `rm test.json`

  **Commit**: NO (part of larger feature)

- [x] 3. Implement JSON File Reading and Validation (TDD - RED then GREEN)

  **What to do**:
  - Add function to read and parse JSON file
  - Use `fs.readFileSync` to read file
  - Use `JSON.parse` to parse content
  - Validate: must be array, each item must have `name` field
  - Write tests: valid file → returns parsed array, invalid JSON → throws error, missing names → throws error
  - Use Zod for validation (consistent with existing patterns)

  **Must NOT do**:
  - Process companies yet (just read and validate)
  - Write to file yet

  **Parallelizable**: NO (depends on file detection)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `src/api.ts:53` - JSON.parse usage pattern
  - `src/api.ts:1-3` - Import pattern for modules

  **API/Type References** (contracts to implement against):
  - `src/types.ts:CompanyInputArray` - Type to validate against
  - `src/schemas.ts` - Check if Zod patterns exist there

  **Test References** (testing patterns to follow):
  - `src/index.test.ts` - Add file reading tests

  **Documentation References** (specs and requirements):
  - Zod docs: https://zod.dev/ - Array validation, object validation

  **External References** (libraries and frameworks):
  - Zod (already installed): Schema validation

  **WHY Each Reference Matters**:
  - `src/api.ts` - Shows existing JSON parsing pattern
  - Zod is already in the project for validation
  - User requirement: Must validate input has `name` field

  **Acceptance Criteria**:

  **TDD RED Phase:**
  - [ ] Test: Valid JSON file → returns array of companies
  - [ ] Test: Invalid JSON → throws error with clear message
  - [ ] Test: Empty array → returns empty array
  - [ ] Test: Array missing `name` field → throws error
  - [ ] Test: Non-array JSON → throws error
  - [ ] `pnpm test` → FAIL (tests exist, reading not implemented)

  **TDD GREEN Phase:**
  - [ ] Zod schema created for `CompanyInputArray`
  - [ ] `readJsonFile(filePath)` function implemented
  - [ ] `pnpm test` → PASS (reading and validation works)

  **Manual Verification:**
  - [ ] Create valid test file: `echo '[{"name": "Test"}]' > valid.json`
  - [ ] Try to read (via test or manual): should succeed
  - [ ] Create invalid test file: `echo '{"not": "an array"}' > invalid.json`
  - [ ] Try to read (via test): should fail with error
  - [ ] Cleanup: `rm valid.json invalid.json`

  **Commit**: NO (part of larger feature)

- [x] 4. Implement Batch Processing Logic (TDD - RED then GREEN)

  **What to do**:
  - Add function to process array of companies
  - Loop through companies sequentially (for...of loop)
  - Call `researchCompany(company.name, company.domain)` for each
  - Merge results with original company object (preserve extra keys)
  - Use `Promise.all` is NOT allowed - must be sequential
  - Write test: 2 companies → returns array with 2 results, extra keys preserved

  **Must NOT do**:
  - Modify `researchCompany()` function
  - Add parallel processing
  - Handle errors (that's in the main flow)

  **Parallelizable**: NO (depends on file reading)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `src/research.ts:7-23` - `researchCompany` usage pattern
  - `src/research.ts:17` - Object merging pattern (`{ ...companyInput, ...results }`)

  **API/Type References** (contracts to implement against):
  - `src/research.ts:researchCompany` - Function signature and behavior
  - `src/types.ts:CompanyInput` - Input shape

  **Test References** (testing patterns to follow):
  - `src/index.test.ts` - Add batch processing tests
  - Mock `researchCompany` to avoid actual API calls in tests

  **WHY Each Reference Matters**:
  - `src/research.ts` - Shows exactly how to call the function and merge results
  - Object merging pattern shows how to preserve extra keys
  - User requirement: Preserve extra keys - must use spread operator pattern

  **Acceptance Criteria**:

  **TDD RED Phase:**
  - [ ] Test: 2 companies → calls researchCompany twice, returns merged results
  - [ ] Test: Extra keys in input → preserved in output
  - [ ] Test: Sequential processing (verify order maintained)
  - [ ] `pnpm test` → FAIL (tests exist, processing not implemented)

  **TDD GREEN Phase:**
  - [ ] `processCompanyArray(companies)` function implemented
  - [ ] Sequential loop using `for...of`
  - [ ] Result merging: `{ ...company, ...researchResult }`
  - [ ] `pnpm test` → PASS (batch processing works)

  **Manual Verification:**
  - [ ] Cannot manually test without API key, but test coverage is sufficient

  **Commit**: NO (part of larger feature)

- [x] 5. Implement Output File Writing (TDD - RED then GREEN)

  **What to do**:
  - Add function to write results to JSON file
  - Use `fs.writeFileSync` to write file
  - Output filename: `{inputBasename}-researched.json`
  - Format: Pretty-printed JSON (2-space indentation)
  - Write tests: Valid output → file created with correct content
  - Mock `fs.writeFileSync` in tests

  **Must NOT do**:
  - Use async file operations (use sync for simplicity)
  - Modify file naming pattern

  **Parallelizable**: NO (depends on batch processing)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `src/index.ts:24` - Logger output pattern (for logging write success)

  **Test References** (testing patterns to follow):
  - `src/index.test.ts` - Add file writing tests
  - Mock fs.writeFileSync

  **Documentation References** (specs and requirements):
  - Node.js fs docs: https://nodejs.org/api/fs.html - fs.writeFileSync usage
  - JSON.stringify: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify - Pretty printing

  **External References** (libraries and frameworks):
  - None needed (Node.js built-in)

  **WHY Each Reference Matters**:
  - fs.writeFileSync is the simplest way to write JSON files
  - JSON.stringify with `null, 2` creates pretty-printed output
  - User requirement: Output file should be readable JSON

  **Acceptance Criteria**:

  **TDD RED Phase:**
  - [ ] Test: Write valid results → file created with correct content
  - [ ] Test: Output filename pattern correct (`input-researched.json`)
  - [ ] Test: JSON is pretty-printed (2-space indent)
  - [ ] `pnpm test` → FAIL (tests exist, writing not implemented)

  **TDD GREEN Phase:**
  - [ ] `writeResults(inputPath, results)` function implemented
  - [ ] `fs.writeFileSync` used with pretty-printed JSON
  - [ ] `pnpm test` → PASS (file writing works)

  **Manual Verification:**
  - [ ] Run tests: Should pass
  - [ ] Check mock behavior in tests

  **Commit**: NO (part of larger feature)

- [x] 6. Integrate All Components into Main Flow (TDD - RED then GREEN)

  **What to do**:
  - Modify `src/index.ts` main function to use new components
  - Flow: Parse args → Detect JSON file → If JSON: read, process, write → Else: single company (existing behavior)
  - Update Logger calls for batch processing context
  - Write integration tests: End-to-end flow
  - Maintain `globalTokenTracker.logSummary()` call at end

  **Must NOT do**:
  - Remove existing single-company behavior
  - Modify `researchCompany` function
  - Add new CLI options

  **Parallelizable**: NO (integrates all previous work)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `src/index.ts:6-30` - Current main function structure
  - `src/index.ts:24` - Token tracking call (must preserve)
  - `src/index.ts:26-29` - Error handling pattern (process.exit(1))

  **API/Type References** (contracts to implement against):
  - All functions from previous tasks: `isJsonFile`, `readJsonFile`, `processCompanyArray`, `writeResults`

  **Test References** (testing patterns to follow):
  - `src/index.test.ts` - Add integration tests
  - Mock all external dependencies (fs, researchCompany, Logger)

  **WHY Each Reference Matters**:
  - `src/index.ts` - Shows existing flow that must be preserved/extended
  - Token tracking must be called in both single-company and batch modes
  - Error handling pattern must be consistent

  **Acceptance Criteria**:

  **TDD RED Phase:**
  - [ ] Test: JSON file with 2 companies → creates output file, returns correct exit code
  - [ ] Test: Single company name → preserves existing behavior (logs to console)
  - [ ] Test: Empty JSON array → creates empty output file
  - [ ] Test: Invalid JSON file → exits with code 1, shows error
  - [ ] Test: Nonexistent JSON file → exits with code 1, shows error
  - [ ] `pnpm test` → FAIL (integration not implemented)

  **TDD GREEN Phase:**
  - [ ] Main function updated with if/else logic (JSON file vs company name)
  - [ ] Batch flow: detect → read → process → write → log summary
  - [ ] Single company flow: existing behavior preserved
  - [ ] Error handling: try/catch with process.exit(1) on failure
  - [ ] `pnpm test` → PASS (all integration tests pass)

  **Manual Verification (CRITICAL - End-to-End Test)**:
  - [ ] Create test input file: `echo '[{"name": "Test Company"}]' > test-companies.json`
  - [ ] Run: `pnpm dev test-companies.json`
  - [ ] Verify: File `test-companies-researched.json` exists
  - [ ] Verify: Output contains original fields + research fields
  - [ ] Verify: Single company still works: `pnpm dev "Test"`
  - [ ] Verify: Invalid JSON: `echo "invalid" > bad.json && pnpm dev bad.json` → Should error
  - [ ] Cleanup: `rm test-companies.json test-companies-researched.json bad.json`
  - [ ] Capture terminal output showing success/error messages

  **Commit**: NO (part of larger feature)

- [x] 7. Add Edge Case Tests and Final Polish (TDD - RED then GREEN)

  **What to do**:
  - Add tests for edge cases identified in Metis review:
    - Empty JSON array
    - Company with null/undefined values
    - Company with missing required fields
    - Malformed JSON syntax
    - Company name that looks like a file path
    - Very long company names
    - Special characters in company names
  - Ensure all tests pass
  - Run full test suite with coverage

  **Must NOT do**:
  - Add new functionality beyond testing edge cases
  - Modify core logic

  **Parallelizable**: NO (final polish)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - Existing tests from previous tasks - maintain consistency

  **Test References** (testing patterns to follow):
  - `src/index.test.ts` - Add edge case tests

  **WHY Each Reference Matters**:
  - Metis identified these as critical edge cases
  - User requirement: "Stop on first error" - edge cases should trigger errors

  **Acceptance Criteria**:

  **TDD RED Phase:**
  - [ ] Test: Empty array `[]` → returns empty array
  - [ ] Test: Company with `null` name → throws error
  - [ ] Test: Missing `name` field → throws error
  - [ ] Test: Malformed JSON `{]` → throws error
  - [ ] Test: Company name `"test.json"` → treated as company name, not file
  - [ ] Test: Very long name (>100 chars) → handled without error
  - [ ] Test: Special chars in name (quotes, unicode) → handled correctly
  - [ ] `pnpm test` → FAIL (edge case handling not complete)

  **TDD GREEN Phase:**
  - [ ] All edge case tests pass
  - [ ] Error messages are clear and actionable
  - [ ] `pnpm test` → PASS (100% test coverage for new code)

  **Manual Verification:**
  - [ ] Run: `pnpm test --coverage` → Check coverage is ≥90%
  - [ ] Verify all edge case scenarios in terminal

  **Commit**: NO (part of larger feature)

- [x] 8. Final Verification and Cleanup

  **What to do**:
  - Run full test suite: `pnpm test`
  - Run typecheck: `pnpm typecheck`
  - Run linter: `pnpm lint:fix`
  - Run formatter: `pnpm format:fix`
  - Manual end-to-end test with real JSON file
  - Verify backward compatibility with single company
  - Check token tracking works in batch mode
  - Verify output JSON is valid and readable

  **Must NOT do**:
  - Modify code (this is verification only)
  - Add new tests

  **Parallelizable**: NO (final verification)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - Package.json scripts: `pnpm test`, `pnpm typecheck`, `pnpm lint:fix`, `pnpm format:fix`

  **Documentation References** (specs and requirements):
  - `AGENTS.md` - Project commands and code style

  **WHY Each Reference Matters**:
  - All CI checks must pass before considering feature complete
  - Code style must match project standards

  **Acceptance Criteria**:

  **Manual Verification (CRITICAL - Full CI Run)**:
  - [ ] `pnpm test` → All tests pass, no failures
  - [ ] `pnpm typecheck` → No type errors
  - [ ] `pnpm lint:fix` → No linting errors (or auto-fixed)
  - [ ] `pnpm format:fix` → Code properly formatted (or auto-fixed)
  - [ ] End-to-end test: Create real JSON file, run `pnpm dev`, verify output
  - [ ] Backward compatibility: `pnpm dev "Test Company"` works as before
  - [ ] Output JSON: Valid JSON, contains all expected fields
  - [ ] Token tracking: Shows total tokens for batch processing
  - [ ] Error handling: Invalid input shows clear error and exits with code 1

  **Evidence Required**:
  - [ ] All command outputs captured (copy-paste terminal output)
  - [ ] Screenshot of test results (optional but recommended)
  - [ ] Example output JSON file saved

  **Commit**: YES (group all changes)
  - Message: `feat(cli): add JSON file support for batch company research`
  - Files: `src/index.ts`, `src/types.ts`, `src/index.test.ts`
  - Pre-commit: `pnpm ci` (format + lint + typecheck + test)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 8 | `feat(cli): add JSON file support for batch company research` | src/index.ts, src/types.ts, src/index.test.ts | pnpm ci |

---

## Success Criteria

### Verification Commands
```bash
pnpm ci  # Expected: All checks pass (format + lint + typecheck + test)
```

### Final Checklist
- [x] JSON file detection works (`.json` extension + file exists)
- [x] Batch processing works for multiple companies
- [x] Extra keys from input preserved in output
- [x] Output file created with correct naming pattern
- [x] Backward compatibility maintained (single company name still works)
- [x] Input validation rejects invalid JSON and missing `name` fields
- [x] Error handling stops on first error with clear messages
- [x] Token tracking works in batch mode
- [x] All tests pass (≥90% coverage)
- [x] All CI checks pass (format, lint, typecheck, test)
- [x] Code follows project style (TypeScript, strict mode, tabs, double quotes)
