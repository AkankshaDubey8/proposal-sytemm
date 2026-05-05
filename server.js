const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

let notifications = [];

let proposals = [];
let logs = [];
let users = []; 

function evaluateProposal(p) {
  let score = 0;
  let suggestions = [];

  if (p.title.length > 5) score += 20;
  else suggestions.push("Improve title");

  if (p.description.length > 20) score += 30;
  else suggestions.push("Add more details");

  if (p.priority === "High") score += 20;

  if (p.deadline) score += 10;
  else suggestions.push("Add deadline");

  return { score, suggestions };
}

// ================= LOAD/SAVE =================
function saveData() {
  fs.writeFileSync(
    "data.json",
    JSON.stringify({ proposals, logs, users }, null, 2)
  );
}

function loadData() {
  if (fs.existsSync("data.json")) {
    const data = JSON.parse(fs.readFileSync("data.json"));
    proposals = data.proposals || [];
    logs = data.logs || [];
    users = data.users || []; // ✅ NEW
  }
}
loadData();

// ================= REGISTER =================
app.post("/register", (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const exists = users.find(u => u.username === username);
  if (exists) {
    return res.status(400).json({ error: "User already exists" });
  }

  const user = { username, password, role };
  users.push(user);

  logs.push(`🆕 User "${username}" registered`);

  saveData();

  res.json({ message: "Registered successfully" });
});

// ================= LOGIN =================
app.post("/login", (req, res) => {
  const { username, password, role } = req.body;

  const user = users.find(
    u =>
      u.username === username &&
      u.password === password &&
      u.role === role
  );

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  res.json({ role: user.role, username: user.username });
});

// ================= PROPOSALS =================
app.get("/proposals", (req, res) => res.json(proposals));
app.get("/logs", (req, res) => res.json(logs));

app.post("/proposals", (req, res) => {
  const proposal = {
    id: Date.now(),
    title: req.body.title || "",
    description: req.body.description || "",
    proposer: req.body.proposer || "",
    priority: req.body.priority || "Low",
    deadline: req.body.deadline || "",
    status: "Submitted",
    progress: 0,
    team: [],
    tasks: [],
    comments: [],
    feedback: "",
    pinned: false,
    createdAt: new Date()
    
  };

  notifications.push({
  id: Date.now(),
  text: `New proposal submitted: ${proposal.title}`,
  read: false
  });
  

  const ai = evaluateProposal(proposal);

  proposal.aiScore = ai.score;
  proposal.aiSuggestions = ai.suggestions;

  proposals.push(proposal);
  logs.push(`📥 Proposal "${proposal.title}" submitted`);

  saveData();
  res.json(proposal);
});

app.get('/notifications', (req, res) => {
  res.json(notifications);
});

app.put('/notifications/read', (req, res) => {
  notifications = notifications.map(n => ({ ...n, read: true }));
  res.json({ ok: true });
  notifications.push({
  id: Date.now(),
  text: `Proposal "${p.title}" updated to ${p.status}`,
  read: false
});
});

app.put("/proposals/:id", (req, res) => {
  const p = proposals.find(x => x.id == req.params.id);
  if (!p) return res.status(404).json({ error: "Not found" });

  Object.assign(p, req.body);
  logs.push(`✏️ Proposal "${p.title}" updated`);

  saveData();
  res.json(p);
});

app.delete("/proposals/:id", (req, res) => {
  proposals = proposals.filter(p => p.id != req.params.id);
  logs.push(`❌ Proposal deleted`);

  saveData();
  res.json({ message: "Deleted" });

  notifications.push({
  id: Date.now(),
  text: `A proposal was deleted`,
  read: false
});
});

// ================= START =================
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});