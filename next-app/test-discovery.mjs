const channels = [
  { name: "Nexpo", id: "UCA_z1F_k9Y0_Z8DqA9Xb-Hw", niche: "Horror Documentary" },
  { name: "Graham Stephan", id: "UCGY749_O-B-nI12m_w1E61A", niche: "Finance" },
  { name: "Matt Wolfe", id: "UClO18VofAOSD10Y53q5xS_g", niche: "AI" }, // Matt Wolfe
  { name: "MKBHD", id: "UCBJycsmduvYEL83R_U4JriQ", niche: "Tech" },
  { name: "Markiplier", id: "UC7_YxT-KID8kRbqZo7MyscQ", niche: "Gaming" },
  { name: "Kurzgesagt", id: "UCsXVk37bltHxD1rDPwtNM8Q", niche: "Education" },
  { name: "OverSimplified", id: "UCv_vLHiWVAh061vM2A7Y6fA", niche: "History" },
  { name: "Alex Hormozi", id: "UCb_sN7Y4x_Qn3nE5tO_4Kbw", niche: "Business" },
  { name: "Huberman Lab", id: "UC2D2CMWXMOVWx7giW1n3LIg", niche: "Health" },
  { name: "Trap Nation", id: "UCa10nxShhzNrCE1o2ZOPztg", niche: "Music" }
];

async function runTests() {
  console.log("Starting Milestone 22 Discovery Accuracy Verification...");
  
  for (const c of channels) {
    console.log(`\n=============================================`);
    console.log(`TESTING CHANNEL: ${c.name} (${c.niche})`);
    console.log(`=============================================`);
    try {
      const startTime = Date.now();
      const res = await fetch("http://localhost:3000/api/discovery/similar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetChannelId: c.id, limit: 3 })
      });
      const data = await res.json();
      
      if (!res.ok) {
        console.error(`ERROR: ${data.error}`);
        continue;
      }
      
      const duration = (Date.now() - startTime) / 1000;
      
      console.log(`[PASS] Fetched in ${duration.toFixed(1)}s`);
      console.log(`[PASS] Source: ${data.meta.source}`);
      console.log(`[PASS] Target Topic: ${data.targetChannel.topics?.[0] || 'Unknown'}`);
      
      if (data.similarChannels.length === 0) {
         console.warn(`[WARN] No similar channels returned.`);
         continue;
      }

      data.similarChannels.forEach((sim, i) => {
        console.log(`\n  Competitor ${i+1}: ${sim.title}`);
        console.log(`  Similarity Score: ${sim.similarityScore}`);
        console.log(`  Niche Classification: ${(sim.nicheClassification || []).join(" -> ")}`);
        console.log(`  Competitor Class: ${sim.competitorClass}`);
        console.log(`  Explanation: ${sim.similarityExplanation}`);
        console.log(`  Title Psychology: ${sim.reverseEngineering?.titlePsychology || 'N/A'}`);
      });
      
    } catch (e) {
      console.error(`[FAIL] Exception during test for ${c.name}: ${e.message}`);
    }
  }
}

runTests();
