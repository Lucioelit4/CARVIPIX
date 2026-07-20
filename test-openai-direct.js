const { OpenAIAdapterV2 } = require('./app/ai/cadpV2/openAIAdapterV2.ts');

async function testOpenAI() {
  const adapter = new OpenAIAdapterV2();
  
  const testPrompt = "¿Cuál es el precio del oro?";
  
  try {
    console.log("Testing OpenAI API...");
    const result = await adapter.analyze({
      promptText: testPrompt,
      responseSchemaName: "TestResponse",
      responseSchema: {
        type: "object",
        properties: {
          answer: { type: "string" }
        },
        required: ["answer"]
      }
    });
    
    console.log("✅ OpenAI Response:", result.response);
  } catch (err) {
    console.error("❌ OpenAI Error:", err instanceof Error ? err.message : String(err));
    if (err instanceof Error && err.providerDetails) {
      console.error("Provider Details:", err.providerDetails);
    }
  }
}

testOpenAI();
