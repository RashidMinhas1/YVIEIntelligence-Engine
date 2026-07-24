const http = require("http");

async function runTests() {
  console.log("=== Starting Backward Compatibility Tests ===");

  const fetchOptions = (path, body = null) => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: "localhost",
        port: 3000,
        path,
        method: body ? "POST" : "GET",
        headers: { "Content-Type": "application/json" }
      };

      const req = http.request(options, (res) => {
        let data = "";
        res.on("data", chunk => data += chunk);
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, body: data });
          }
        });
      });

      req.on("error", reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  };

  try {
    console.log("1. Testing /api/library/items (Library)");
    const res1 = await fetchOptions("/api/library/items");
    console.log(`Status: ${res1.status}`);
    
    console.log("\n2. Testing /api/stats/dashboard (Dashboard)");
    const res2 = await fetchOptions("/api/stats/dashboard");
    console.log(`Status: ${res2.status}`);

    console.log("3. Testing /api/scripts/generate (Builder Job)");
    const res3 = await fetchOptions("/api/scripts/generate", { 
      topic: "test", 
      titleFormat: { patternName: "Test", template: "Test", psychologyFormula: "Test" },
      scriptFormat: { scriptFormatName: "Test", hookFormula: "Test" },
      customInstructions: "test",
      knowledgeItems: [],
      provider: "mock"
    });
    console.log(`Status: ${res3.status}`);
    console.log(`Body:`, res3.body);

    console.log("\n4. Testing /api/titles/generate (Wizard Job)");
    const res4 = await fetchOptions("/api/titles/generate", {
      topic: "test",
      prompt: "test",
      provider: "mock",
      niche: "general",
      count: 3
    });
    console.log(`Status: ${res4.status}`);
    console.log(`Body:`, res4.body);

    console.log("\nBackward Compatibility Check Complete.");
  } catch (err) {
    console.error("Test execution failed:", err);
  }
}

runTests();
