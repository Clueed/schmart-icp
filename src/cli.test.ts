import {
  type MockedFunction,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { Logger } from "./logger.ts";
import { researchCompany } from "./research.ts";
import { globalTokenTracker } from "./tokenTracker.ts";

// Mock OpenAI to prevent instantiation error
vi.mock("openai", () => ({
  default: vi.fn(() => ({
    responses: {
      create: vi.fn(() => ({
        id: "resp_67ccd2bed1ec8190b14f964abc0542670bb6a6b452d3795b",
        object: "response",
        created_at: 1741476542,
        status: "completed",
        error: null,
        incomplete_details: null,
        instructions: null,
        max_output_tokens: null,
        model: "gpt-4.1-2025-04-14",
        output: [
          {
            type: "message",
            id: "msg_67ccd2bf17f0819081ff3bb2cf6508e60bb6a6b452d3795b",
            status: "completed",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: "In a peaceful grove beneath a silver moon, a unicorn named Lumina discovered a hidden pool that reflected the stars. As she dipped her horn into the water, the pool began to shimmer, revealing a pathway to a magical realm of endless night skies. Filled with wonder, Lumina whispered a wish for all who dream to find their own hidden magic, and as she glanced back, her hoofprints sparkled like stardust.",
                annotations: [],
              },
            ],
          },
        ],
        parallel_tool_calls: true,
        previous_response_id: null,
        reasoning: {
          effort: null,
          summary: null,
        },
        store: true,
        temperature: 1.0,
        text: {
          format: {
            type: "text",
          },
        },
        tool_choice: "auto",
        tools: [],
        top_p: 1.0,
        truncation: "disabled",
        usage: {
          input_tokens: 36,
          input_tokens_details: {
            cached_tokens: 0,
          },
          output_tokens: 87,
          output_tokens_details: {
            reasoning_tokens: 0,
          },
          total_tokens: 123,
        },
        user: null,
        metadata: {},
      })),
    },
  })),
}));

// Mock the research module
vi.mock("./research.ts");

describe("CLI", () => {
  let mockExit: MockedFunction<typeof process.exit>;

  beforeEach(() => {
    Logger.setDebug(false);
    vi.clearAllMocks();
    globalTokenTracker.reset();
    mockExit = vi.fn(() => { }) as MockedFunction<typeof process.exit>;
    vi.spyOn(process, "exit").mockImplementation(mockExit);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should display usage when no arguments provided", async () => {
    // Mock process.argv to have no arguments
    const originalArgv = process.argv;
    process.argv = ["node", "index.js"];

    // Import and run main function
    const { main } = await import("./index.ts");

    // Mock Logger.log to capture output
    const mockLog = vi.fn();
    Logger.log = mockLog;

    await main();

    expect(mockLog).toHaveBeenCalledWith("🔍 SG Company Research CLI");
    expect(mockLog).toHaveBeenCalledWith('Usage: pnpm run dev "Company Name"');
    expect(mockLog).toHaveBeenCalledWith(
      'Example: pnpm run dev "Siemens Energy"',
    );
    expect(mockExit).toHaveBeenCalledWith(0);

    // Restore process.argv
    process.argv = originalArgv;
  });

  it("should research company when arguments provided", async () => {
    // Mock process.argv to have company name
    const originalArgv = process.argv;
    process.argv = ["node", "index.js", "Test", "Company"];

    // Mock researchCompany to resolve
    vi.mocked(researchCompany).mockResolvedValue({
      name: "Test Company",
      domain: undefined,
      employees: {
        explanation: "Mock explanation",
        certainty_score: 0.9,
        sources: ["https://example.com"],
        employees: 5000,
      },
      revenue: {
        explanation: "Mock explanation",
        certainty_score: 0.9,
        sources: ["https://example.com"],
        revenue: 1000000000,
      },
      eam_tool: {
        explanation: "Mock explanation",
        certainty_score: 0.9,
        sources: ["https://example.com"],
        eam_tool: "LeanIX",
      },
      eam_practice: {
        explanation: "Mock explanation",
        certainty_score: 0.9,
        sources: ["https://example.com"],
        eam_practice: "established",
      },
      itBp_practice: {
        explanation: "Mock explanation",
        certainty_score: 0.9,
        sources: ["https://example.com"],
        itBp_practice: "established",
      },
      itsm_tool: {
        explanation: "Mock explanation",
        certainty_score: 0.9,
        sources: ["https://example.com"],
        itsm_tool: "ServiceNow ITSM",
      },
      sam_practice: {
        explanation: "Mock explanation",
        certainty_score: 0.9,
        sources: ["https://example.com"],
        sam_practice: "established",
      },
      sam_tool: {
        explanation: "Mock explanation",
        certainty_score: 0.9,
        sources: ["https://example.com"],
        sam_tool: "Flexera",
      },
    });

    // Mock Logger methods
    const mockSection = vi.fn();
    const mockLogSummary = vi.fn();
    Logger.section = mockSection;
    globalTokenTracker.logSummary = mockLogSummary;

    // Import and run main function
    const { main } = await import("./index.ts");

    await main();

    expect(researchCompany).toHaveBeenCalledWith("Test Company");
    expect(mockSection).toHaveBeenCalledWith("Research - Test Company");
    expect(mockLogSummary).toHaveBeenCalled();
    expect(mockExit).not.toHaveBeenCalled();

    // Restore process.argv
    process.argv = originalArgv;
  });

  it("should handle research errors", async () => {
    // Mock process.argv to have company name
    const originalArgv = process.argv;
    process.argv = ["node", "index.js", "Invalid Company"];

    // Mock researchCompany to reject
    const error = new Error("Research failed");
    vi.mocked(researchCompany).mockRejectedValue(error);

    // Mock Logger methods
    const mockSection = vi.fn();
    const mockError = vi.fn();
    Logger.section = mockSection;
    Logger.error = mockError;

    // Import and run main function
    const { main } = await import("./index.ts");

    await main();

    expect(researchCompany).toHaveBeenCalledWith("Invalid Company");
    expect(mockSection).toHaveBeenCalledWith("❌ Research failed ❌");
    expect(mockError).toHaveBeenCalledWith(error);
    expect(mockExit).toHaveBeenCalledWith(1);

    // Restore process.argv
    process.argv = originalArgv;
  });
});
