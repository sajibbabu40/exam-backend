const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* ---------------- CONFIG ---------------- */
const EXAM_DURATION_SEC = 600; // 10 minutes

/* ---------------- TEST ROUTE ---------------- */
app.get("/api/test", (req, res) => {
  res.json({ message: "Exam backend running" });
});

/* ---------------- IN-MEMORY STORE ---------------- */
const attempts = {};

/* ---------------- START EXAM ---------------- */
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
    durationSec: EXAM_DURATION_SEC,
  });
});
/* ---------------- TAB SWITCH LOG ---------------- */
app.post("/api/tab-switch", (req, res) => {
  const { examToken } = req.body;

  const attempt = attempts[examToken];

  if (!attempt) {
    return res.status(400).json({ error: "Invalid token" });
  }

  if (!attempt.tabSwitchCount) {
    attempt.tabSwitchCount = 0;
  }

  attempt.tabSwitchCount += 1;

  res.json({
    message: "Tab switch logged",
    tabSwitchCount: attempt.tabSwitchCount,
  });
});
/* ---------------- SUBMIT EXAM ---------------- */
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
  const elapsedSec = Math.floor((submitTime - attempt.startTime) / 1000);

  // ⛔ time over check
  if (elapsedSec > EXAM_DURATION_SEC) {
    attempt.submitted = true;
    return res.status(403).json({
      error: "Time over",
      elapsedSec,
    });
  }

  attempt.submitted = true;
  attempt.submitTime = submitTime;
  attempt.durationSec = elapsedSec;

  res.json({
    message: "Exam submitted",
    durationSec: elapsedSec,
  });
});

/* ---------------- SERVER ---------------- */
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
