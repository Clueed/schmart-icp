# Decisions - JSON File Support

## Session: ses_40b232bf6ffesD3lk75U8XUwPz
- No decisions made yet

## Task 0: Setup Test Infrastructure (TDD RED Phase)
- Keep existing test structure rather than rewriting
- Use module-level vi.mock() for external dependencies (Logger, researchCompany, globalTokenTracker)
- Preserve backward compatibility test (passes)
- Maintain failing JSON detection test (RED phase)
- Test approach: Verify researchCompany is NOT called with JSON filename
- This implies JSON files should be parsed before passing to researchCompany

## Task 3: JSON File Reading and Validation Design
- Use fs.readFileSync for synchronous file reading (consistent with isJsonFile)
- Use JSON.parse for parsing JSON content (simple, built-in)
- Use Zod schema for validation (consistent with existing patterns in schemas.ts)
- Validate with CompanyInputArraySchema to ensure type safety and required fields
- Preserve extra keys using .passthrough() on array items (preserves CompanyInput & Record<string, unknown> structure)
- Throw errors automatically (fs.readFileSync, JSON.parse, Zod.parse all throw on errors)
- No custom error handling - let built-in errors propagate with descriptive messages
- Export function with typed return: readJsonFile(filePath: string): CompanyInputArray

## Task 50-56: End-to-End Manual Verification
- Verified all Definition of Done criteria are met
- Confirmed implementation is production-ready
- No additional changes needed
