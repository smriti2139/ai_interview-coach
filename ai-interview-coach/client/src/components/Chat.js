import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Message from "./Message";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [role, setRole] = useState("software engineer");

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (started) {
      axios
        .get(`http://localhost:5000/question?role=${role}`)
        .then((res) => {
          setMessages([{ text: res.data.question, sender: "bot" }]);
        });
    }
  }, [started, role]);

 const sendMessage = async () => {
  if (!input.trim()) return;

  const userAnswer = input; // ✅ FIRST
  console.log("Sending:", userAnswer);

  const userMsg = { text: input, sender: "user" };
  setMessages((prev) => [...prev, userMsg]);

  setInput("");
  setLoading(true);

  try {
    const evalRes = await axios.post(
      "http://localhost:5000/evaluate",
      { answer: userAnswer }
    );

    console.log("Eval response:", evalRes.data);

    const feedbackMsg = {
      text: evalRes.data.feedback,
      sender: "bot",
    };

    const qRes = await axios.get(
      `http://localhost:5000/question?role=${role}`
    );

    const nextQ = {
      text: qRes.data.question,
      sender: "bot",
    };

    setMessages((prev) => [...prev, feedbackMsg, nextQ]);

  } catch (err) {
    console.log("ERROR:", err);
  }

  setLoading(false);
};
  // START SCREEN
  if (!started) {
    return (
      <div style={startContainer}>
        <div style={startCard}>
          <h2>🤖 AI Interview Coach</h2>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={selectStyle}
          >
            <option value="software engineer">Software Engineer</option>
            <option value="frontend developer">Frontend Developer</option>
            <option value="backend developer">Backend Developer</option>
            <option value="data analyst">Data Analyst</option>
            <option value="data scientist">Data Scientist</option>
            <option value="product manager">Product Manager</option>
            <option value="hr">HR</option>
          </select>

          <button
            onClick={async () => {
              await axios.get("http://localhost:5000/start");
              setStarted(true);
            }}
            style={startBtn}
          >
            Start Interview 🚀
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={mainContainer}>
      {/* Header */}
      <div style={header}>
        🤖 AI Interview Coach ({role})
      </div>

      {/* Chat */}
      <div style={chatArea}>
        {messages.map((msg, i) => (
          <Message key={i} text={msg.text} sender={msg.sender} />
        ))}

        {loading && <div style={{ color: "#94a3b8" }}>AI is typing...</div>}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={inputArea}>
        <div style={inputWrapper}>
          <input
            style={inputStyle}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your answer..."
          />

          <button onClick={sendMessage} style={btnBlue}>
            Send
          </button>

          <button
            onClick={async () => {
              const res = await axios.get("http://localhost:5000/result");
              setResult(res.data);
              setHistory([]); // 🔥 clear history
            }}
            style={btnRed}
          >
            End
          </button>

          <button
            onClick={async () => {
              const res = await axios.get("http://localhost:5000/history");
              setHistory(res.data);
              setResult(null); // 🔥 clear result
            }}
            style={btnPurple}
          >
            History
          </button>
        </div>
      </div>

      {/* RESULT */}
      {result && (
        <div style={dashboard}>
          <h2>🎯 Interview Summary</h2>

          <div style={cards}>
            <div style={card}>
              <h4>⭐ Score</h4>
              <p>{result.averageScore}/10</p>
            </div>

            <div style={card}>
              <h4>📊 Questions</h4>
              <p>{result.totalQuestions}</p>
            </div>

            <div style={card}>
              <h4>📈 Level</h4>
              <p>
                {result.averageScore >= 8
                  ? "Advanced"
                  : result.averageScore >= 5
                  ? "Intermediate"
                  : "Beginner"}
              </p>
            </div>
          </div>

          <div style={feedback}>
            <h4>💡 Feedback</h4>
            <p>
              {result.totalQuestions === 0
                ? "⚠️ No questions attempted"
                : result.feedback || "Good attempt! Keep practicing."}
            </p>
          </div>
        </div>
      )}

      {/* HISTORY */}
      {history.length > 0 && (
        <div style={historyBox}>
          <h3>📊 Past Interviews</h3>

          {history.map((item, i) => (
            <div key={i} style={historyItem}>
              📅 {new Date(item.createdAt).toLocaleDateString()} | 🎯{" "}
              {item.role} | ⭐ {item.averageScore}/10
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Chat;

/* 🎨 STYLES */

const mainContainer = {
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  background: "#020617",
  color: "white",
};

const header = {
  padding: "15px 25px",
  borderBottom: "1px solid #1e293b",
  fontSize: "20px",
  fontWeight: "bold",
};

const chatArea = {
  flex: 1,
  overflowY: "auto",
  padding: "20px",
  maxWidth: "800px",
  margin: "auto",
  width: "100%",
};

const inputArea = {
  borderTop: "1px solid #1e293b",
  padding: "15px",
  display: "flex",
  justifyContent: "center",
};

const inputWrapper = {
  display: "flex",
  width: "800px",
  gap: "10px",
};

const inputStyle = {
  flex: 1,
  padding: "14px",
  borderRadius: "10px",
  border: "none",
  background: "#1e293b",
  color: "white",
};

const btnBlue = {
  padding: "12px 16px",
  background: "#3b82f6",
  border: "none",
  borderRadius: "8px",
  color: "white",
  cursor: "pointer",
};

const btnRed = {
  ...btnBlue,
  background: "#ef4444",
};

const btnPurple = {
  ...btnBlue,
  background: "#9333ea",
};

const dashboard = {
  maxWidth: "800px",
  margin: "20px auto",
  padding: "20px",
  background: "#020617",
  border: "1px solid #1e293b",
  borderRadius: "12px",
};

const cards = {
  display: "flex",
  gap: "10px",
};

const card = {
  flex: 1,
  background: "#1e293b",
  padding: "10px",
  borderRadius: "10px",
  textAlign: "center",
};

const feedback = {
  marginTop: "10px",
};

const historyBox = {
  maxWidth: "800px",
  margin: "20px auto",
  padding: "20px",
  background: "#020617",
  border: "1px solid #1e293b",
  borderRadius: "12px",
};

const historyItem = {
  padding: "10px",
  borderBottom: "1px solid #1e293b",
};

/* START SCREEN */

const startContainer = {
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "linear-gradient(135deg, #020617, #0f172a)",
};

const startCard = {
  background: "#020617",
  padding: "40px",
  borderRadius: "16px",
  textAlign: "center",
};

const selectStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "15px",
};

const startBtn = {
  marginTop: "20px",
  padding: "12px",
  width: "100%",
  background: "#3b82f6",
  border: "none",
  borderRadius: "10px",
  color: "white",
  cursor: "pointer",
};