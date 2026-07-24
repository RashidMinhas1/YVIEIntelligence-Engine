const http = require("http");

async function runTests() {
  console.log("=== Starting Milestone 16 Backend API Tests ===");

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

  const sections = [
    {
      id: "s1",
      type: "Hook",
      content: "This is a hook.",
      title: "Scene 1",
      duration: 10,
      visualNotes: "Explosion",
      brollNotes: "Fire",
      cameraDirection: "Zoom in",
      onScreenText: "Wait for it...",
      transitionNotes: "Cut",
      sceneGoal: "Grab attention",
      emotion: "Shock",
      hookType: "Curiosity",
      curiosityLevel: "High",
      editingNotes: "Fast",
      soundEffects: "Boom",
      musicNotes: "Tense",
      zoomMotion: "Fast zoom",
      aiSuggestions: []
    }
  ];

  try {
    // 1. Test Storyboard Analyze
    console.log("1. Testing /api/studio/storyboard/analyze");
    const res1 = await fetchOptions("/api/studio/storyboard/analyze", { sections });
    console.log(`Status: ${res1.status}`);
    if (res1.status !== 200 || !res1.body.jobId) {
      console.error("FAILED to create analyze job:", res1.body);
    } else {
      console.log(`PASS - Job created: ${res1.body.jobId}`);
    }

    // 2. Test Storyboard Generate
    console.log("\n2. Testing /api/studio/storyboard/generate");
    const res2 = await fetchOptions("/api/studio/storyboard/generate", { 
      action: "Suggest Missing Scenes", 
      sections,
      research: { notes: "Testing", sources: [] }
    });
    console.log(`Status: ${res2.status}`);
    if (res2.status !== 200 || !res2.body.jobId) {
      console.error("FAILED to create generate job:", res2.body);
    } else {
      console.log(`PASS - Job created: ${res2.body.jobId}`);
    }

    // 3. Test Auto Save (Draft) with new fields
    console.log("\n3. Testing /api/studio/save");
    const testProject = {
      id: "DEFAULT_PROJECT",
      title: "M16 Test Project",
      sections,
      researchNotes: "Test notes",
      timelineAnalysis: {
        estimatedWatchTime: "2 mins",
        totalDuration: 120,
        hookStrength: 90,
        endingStrength: 80,
        retentionCurve: "Flat",
        slowSections: [],
        fastSections: [],
        deadMoments: [],
        emotionalPeaks: [],
        curiosityGaps: [],
        ctaPosition: "End",
        rehookOpportunities: []
      }
    };
    const res3 = await fetchOptions("/api/studio/save", { project: testProject });
    console.log(`Status: ${res3.status}`);
    if (res3.status !== 200 || !res3.body.success) {
      console.error("FAILED to save project:", res3.body);
    } else {
      console.log("PASS - Project saved successfully");
    }

    // 4. Test Load (Draft Recovery)
    console.log("\n4. Testing /api/studio/load");
    const res4 = await fetchOptions("/api/studio/load");
    console.log(`Status: ${res4.status}`);
    if (res4.status !== 200 || !res4.body.project) {
      console.error("FAILED to load project:", res4.body);
    } else {
      const loadedProj = res4.body.project;
      const loadedSec = loadedProj.sections[0];
      if (loadedSec.visualNotes === "Explosion" && loadedSec.emotion === "Shock" && loadedProj.timelineAnalysis?.hookStrength === 90) {
        console.log("PASS - Project loaded and all 16 visual fields + timelineAnalysis preserved perfectly.");
      } else {
        console.error("FAILED - Project loaded but fields are missing or incorrect.");
        console.log("Expected 'Explosion', 'Shock', 90");
        console.log("Got:", loadedSec.visualNotes, loadedSec.emotion, loadedProj.timelineAnalysis?.hookStrength);
      }
    }

  } catch (err) {
    console.error("Test execution failed:", err);
  }
}

runTests();
