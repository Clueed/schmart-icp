import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const client = new OpenAI({
    apiKey: process.env.MOONSHOT_API_KEY || process.env.OPENAI_API_KEY,
    baseURL: "https://api.moonshot.ai/v1",
});

const completion = await client.chat.completions.create({
    model: "kimi-k2-turbo-preview",
    messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "What is Microsoft's employee count?" }
    ],
    tools: [{
        type: "function",
        function: {
            name: "submit_result",
            description: "Submit the result",
            parameters: {
                type: "object",
                properties: {
                    employees: { type: "number" },
                    explanation: { type: "string" }
                }
            }
        }
    }, {
        type: "builtin_function",
        function: {
            name: "$web_search"
        }
    }],
    temperature: 1
});

console.log("Finish reason:", completion.choices[0].finish_reason);
console.log("\n=== Full message ===");
console.log(JSON.stringify(completion.choices[0].message, null, 2));

if (completion.choices[0].message.tool_calls) {
    console.log("\n=== Tool calls ===");
    for (const tc of completion.choices[0].message.tool_calls) {
        console.log("Type:", tc.type);
        console.log("ID:", tc.id);
        if (tc.type === "function") {
            console.log("Function name:", tc.function?.name);
            console.log("Function arguments:", tc.function?.arguments);
        }
        console.log("Full:", JSON.stringify(tc, null, 2));
        console.log("---");
    }
}
