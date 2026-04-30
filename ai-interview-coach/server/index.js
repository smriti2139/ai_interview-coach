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
  previousQuestions.length = 0;
  res.json({ message: "Interview started" });
});
app.get("/history", async (req, res) => {
  try {
    const interviews = await Interview.find().sort({ createdAt: -1 });
    res.json(interviews);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});
let previousQuestions = [];


const questionBank = {
  "software engineer": [
    "What is OOP?",
    "Explain REST API.",
    "What is time complexity?",
    "Difference between stack and queue?",
    "What is multithreading?"
  ],
  "frontend developer": [
    "What is React?",
    "Explain useEffect hook.",
    "Difference between var, let, const?",
    "What is DOM?",
    "What is CSS Flexbox?"
  ],
  "backend developer": [
    "What is Node.js?",
    "Explain middleware in Express.",
    "What is JWT?",
    "What is REST API?",
    "Difference between SQL and NoSQL?"
  ],
  "hr": [
    "Tell me about yourself.",
    "Why should we hire you?",
    "What are your strengths?",
    "Describe a challenge you faced.",
    "Where do you see yourself in 5 years?"
  ]
};

app.get("/question", async (req, res) => {
  try {
    currentRole = req.query.role || "software engineer";

    const topics = rolePrompts[currentRole].split(",");
    const randomTopic =
      topics[Math.floor(Math.random() * topics.length)];

    let question = await askAI(`
Ask ONE interview question for ${currentRole}.
Topic: ${randomTopic}
Only return the question.
`);

    // 🔥 AI FAIL → fallback to random bank
    if (
  !question ||
  !question.trim() ||
  question.toLowerCase().includes("score") ||
  question.toLowerCase().includes("strength") ||
  question.length < 10 ||
  question.includes("\n")
)
    {
      const list = questionBank[currentRole] || questionBank["software engineer"];

      // remove recently asked
      const filtered = list.filter(q => !previousQuestions.includes(q));

      const randomQ =
        filtered.length > 0
          ? filtered[Math.floor(Math.random() * filtered.length)]
          : list[Math.floor(Math.random() * list.length)];

      question = randomQ;
    }

    // store to avoid repetition
    previousQuestions.push(question);
    if (previousQuestions.length > 5) previousQuestions.shift();

    res.json({ question });

  } catch (err) {
    console.log("QUESTION ERROR:", err);

    res.json({
      question: "Tell me about yourself."
    });
  }
});
// 🎯 2. Evaluate Route
app.post("/evaluate", async (req, res) => {
  try {
    const { answer } = req.body;

  if (process.env.NODE_ENV !== "production") {
  console.log("Answer:", answer);
}

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