require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { askAI } = require("./utils/ai");
const Interview = require("./models/Interview");

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("Mongo error:", err));

// 🔥 GLOBAL STATE
let session = [];
let previousQuestions = [];
let currentRole = "software engineer";

// 🔥 ROLE TOPICS
const rolePrompts = {
  "software engineer": "DSA, OOP, system design basics",
  "frontend developer": "React, HTML, CSS, JavaScript",
  "backend developer": "Node.js, APIs, databases",
  "data analyst": "SQL, Excel, statistics",
  "data scientist": "machine learning, Python, statistics",
  "product manager": "product thinking, case studies",
  "hr": "behavioral questions"
};

// 🚀 START
app.get("/start", (req, res) => {
  session = [];
  previousQuestions = [];
  res.json({ message: "Interview started" });
});

// 🚀 QUESTION
app.get("/question", async (req, res) => {
  try {
    currentRole = req.query.role || "software engineer";

    const topics = rolePrompts[currentRole].split(",");
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    let question = await askAI(`
Ask ONE interview question for a ${currentRole} fresher.
Topic: ${randomTopic}
Keep it short (1 line).
`);

    if (!question || question.length < 10) {
      question = "Tell me about yourself.";
    }

    res.json({ question });

  } catch (err) {
    console.log("QUESTION ERROR:", err);
    res.json({ question: "Tell me about yourself." });
  }
});

// 🚀 EVALUATE
app.post("/evaluate", async (req, res) => {
  try {
    const { answer } = req.body;

    console.log("🔥 EVALUATE API HIT");

    let feedback = await askAI(`
Evaluate this answer:

"${answer}"

Rules:
- Be strict
- No generic lines
- Give specific feedback

Format:

Score: X/10

Strengths:
- ...

Weaknesses:
- ...

Suggestions:
- ...
`);

    console.log("🔥 FEEDBACK FROM AI:", feedback);

    if (!feedback) {
      feedback = `
Score: 5/10

Strengths:
- Attempted answer

Weaknesses:
- Lacks depth

Suggestions:
- Add examples
`;
    }

    const scoreMatch = feedback.match(/(\d+)\/10/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;

    session.push(score);

    res.json({ feedback, score });

  } catch (err) {
    console.log("❌ EVALUATE ERROR:", err);

    res.json({
      feedback: "⚠️ AI failed",
      score: 5
    });
  }
});

// 🚀 RESULT
app.get("/result", async (req, res) => {
  const avg =
    session.length > 0
      ? session.reduce((a, b) => a + b, 0) / session.length
      : 0;

  try {
    await Interview.create({
      role: currentRole,
      scores: session,
      averageScore: avg
    });
  } catch (err) {
    console.log("DB ERROR:", err);
  }

  res.json({
    averageScore: avg.toFixed(2),
    totalQuestions: session.length
  });
});

// 🚀 HISTORY
app.get("/history", async (req, res) => {
  const data = await Interview.find().sort({ createdAt: -1 });
  res.json(data);
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});