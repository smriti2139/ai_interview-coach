let lastAnswer = "";
let currentRole = "software engineer";

require("dotenv").config();
const rolePrompts = {
  "software engineer": "DSA, OOP, system design basics",
  "frontend developer": "React, HTML, CSS, JavaScript",
  "backend developer": "Node.js, APIs, databases",
  "data analyst": "SQL, Excel, statistics",
  "data scientist": "machine learning, Python, statistics",
  "product manager": "product thinking, case studies",
  "hr": "behavioral questions"
};

const express = require("express");
const cors = require("cors");
const { askAI } = require("./utils/ai");
const Interview = require("./models/Interview");

const app = express();  // ✅ FIRST create app
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("Mongo error:", err));
  
app.use(cors());
app.use(express.json());

let session = [];
app.get("/start", (req, res) => {
  session = [];  // 🔥 reset scores
  previousQuestions = [];
  res.json({ message: "Interview started" });
});

let previousQuestions = [];


app.get("/question", async (req, res) => {
  try {
    currentRole = req.query.role || "software engineer";

    const topics = rolePrompts[currentRole].split(",");
    const randomTopic =
      topics[Math.floor(Math.random() * topics.length)];

    const prompt = `
You are an interviewer.

Your task:
- Ask ONLY ONE interview question
- Do NOT give feedback
- Do NOT give score
- Do NOT give explanation
- Do NOT include words like "Score", "Strengths", "Weaknesses"

Format:
Just return the question in 1 line.

Role: ${currentRole}
Topic: ${randomTopic}
`;

    let question = await askAI(prompt);

    // 🧠 SAFETY FILTER (VERY IMPORTANT)
    if (
      !question ||
      question.includes("Score") ||
      question.includes("Strengths")
    ) {
      question = `Explain ${randomTopic} in simple terms.`;
    }

    res.json({ question });

  } catch (err) {
    console.log("QUESTION ERROR:", err);

    res.json({
      question: "Tell me about yourself.",
    });
  }
});
app.get("/history", async (req, res) => {
  try {
    const interviews = await Interview.find().sort({ createdAt: -1 });
    res.json(interviews);
  } catch (err) {
    console.log("History error:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});
// 🎯 2. Evaluate Route
app.post("/evaluate", async (req, res) => {
  try {
    const { answer } = req.body;

    console.log("Answer received:", answer);

    lastAnswer = answer; // 🔥 IMPORTANT

    const prompt = `
You are an interview evaluator.

Evaluate this answer:

"${answer}"

Return:
Score: X/10
Strengths:
- ...
Weaknesses:
- ...
Suggestions:
- ...
`;

    const feedback = await askAI(prompt);

    console.log("AI Feedback:", feedback);

    const scoreMatch = feedback.match(/(\d+)\/10/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;

    session.push(score);

    res.json({ feedback, score });

  } catch (err) {
    console.log("❌ EVALUATE ERROR:", err);

    res.json({
      feedback: "⚠️ AI failed. Try again.",
      score: 5
    });
  }
});


app.get("/result", async (req, res) => {
  if (session.length === 0) {
    return res.json({
      averageScore: 0,
      totalQuestions: 0
    });
  }

  const avg =
    session.reduce((a, b) => a + b, 0) / session.length;

  try {
    await Interview.create({
      role: currentRole, // you can make dynamic later
      scores: session,
      averageScore: avg
    });

    console.log("✅ Saved to MongoDB");

  } catch (err) {
    console.log("❌ DB ERROR:", err);
  }

  res.json({
    averageScore: avg.toFixed(2),
    totalQuestions: session.length
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});