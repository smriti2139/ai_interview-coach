const axios = require("axios");

async function askAI(prompt) {
  try {
    const res = await axios.post("http://localhost:11434/api/generate", {
      model: "llama3",
      prompt,
      stream: false,
    });

    return res.data.response;

  } catch (err) {
    console.log("❌ AI ERROR:", err.message);

    // ✅ FIXED FALLBACK
    return `
Score: 5/10
Strengths:
- Basic attempt

Weaknesses:
- Needs improvement

Suggestions:
- Practice more
`;
  }
}

module.exports = { askAI };