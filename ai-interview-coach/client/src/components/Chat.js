import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Message from "./Message";

const BASE_URL = "https://ai-interview-coach-zi6o.onrender.com";

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
        .get(`${BASE_URL}/question?role=${role}`)
        .then((res) => {
          setMessages([{ text: res.data.question, sender: "bot" }]);
        });
    }
  }, [started, role]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userAnswer = input;

    const userMsg = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);

    setInput("");
    setLoading(true);

    try {
      const evalRes = await axios.post(
        `${BASE_URL}/evaluate`,
        { answer: userAnswer }
      );

      const feedbackMsg = {
        text: evalRes.data.feedback,
        sender: "bot",
      };

      const qRes = await axios.get(
        `${BASE_URL}/question?role=${role}`
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
              await axios.get(`${BASE_URL}/start`);
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
              const res = await axios.get(`${BASE_URL}/result`);
              setResult(res.data);
              setHistory([]);
            }}
            style={btnRed}
          >
            End
          </button>

          <button
            onClick={async () => {
              const res = await axios.get(`${BASE_URL}/history`);
              setHistory(res.data);
              setResult(null);
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
                : "Good attempt! Keep practicing."}
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