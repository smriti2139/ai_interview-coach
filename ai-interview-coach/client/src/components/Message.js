import React from "react";

function Message({ text, sender }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: sender === "user" ? "flex-end" : "flex-start",
        marginBottom: "10px",
      }}
    >
      <div
        style={{
          padding: "10px 15px",
          borderRadius: "12px",
          maxWidth: "60%",
          background:
            sender === "user"
              ? "#3b82f6"
              : "#1e293b",
        }}
      >
        {text}
      </div>
    </div>
  );
}

export default Message;