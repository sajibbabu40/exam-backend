const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* ---------------- TEST ROUTE ---------------- */
app.get("/api/test", (req, res) => {
  res.json({ message: "Exam backend running" });
});

/* ---------------- IN-MEMORY STORE (TEMP) ---------------- */
const attempts = {};

/* ---------------- START EXAM API ---------------- */
app.post("/api/start-exam", (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email required" });
  }

  const examToken = crypto.randomBytes(16).toString("hex");
  const startTime = Date.now();

  attempts[examToken] = {
    name,
    email,
    startTime,
    submitted: false,
  };

  res.json({
    examToken,
    startTime,
  });
});

/* ---------------- SUBMIT EXAM API ---------------- */
app.post("/api/submit-exam", (req, res) => {
  const { examToken } = req.body;

  const attempt = attempts[examToken];

  if (!attempt) {
    return res.status(400).json({ error: "Invalid token" });
  }

  if (attempt.submitted) {
    return res.status(400).json({ error: "Already submitted" });
  }

  const submitTime = Date.now();
  const durationSec = Math.floor((submitTime - attempt.startTime) / 1000);

  attempt.submitted = true;
  attempt.submitTime = submitTime;
  attempt.durationSec = durationSec;

  res.json({
    message: "Exam submitted",
    durationSec,
  });
});

/* ---------------- SERVER START ---------------- */
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
