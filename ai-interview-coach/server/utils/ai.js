const Groq = require("groq-sdk");

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function askAI(prompt) {
  try {
    console.log("🚀 USING GROQ");

    const response = await client.chat.completions.create({
      model: "llama-3.1-8b-instant", // ✅ current working model
      messages: [
        {
          role: "system",
          content: "You are a strict interviewer. Give specific and non-generic feedback."
        },
        {
          role: "user",
          content: prompt
        }
      ],
    });

    const content = response.choices[0].message.content;

    console.log("🔥 GROQ RESPONSE:", content);

    return content;

  } catch (err) {
    console.log("❌ GROQ ERROR:", err.message);
    return null;
  }
}

module.exports = { askAI };