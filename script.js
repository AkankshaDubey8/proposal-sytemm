const API = "http://localhost:3000";

// 🔐 ROLE CHECK
const role =
  localStorage.getItem("userRole") ||
  sessionStorage.getItem("userRole");

const username =
  localStorage.getItem("username") ||
  sessionStorage.getItem("username");

if (location.pathname.includes("admin") && role !== "admin")
  location.href = "login.html";

if (location.pathname.includes("student") && role !== "student")
  location.href = "login.html";

// 🌙 DARK MODE
function toggleTheme() {
  document.body.classList.toggle("light");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("light")
  );
}

function applyTheme() {
  if (localStorage.getItem("theme") === "true") {
    document.body.classList.add("light");
  }
}

// 🔓 LOGOUT
function logout() {
  localStorage.clear();
  sessionStorage.clear();
  location.href = "login.html";
}

// 🚀 INIT
document.addEventListener("DOMContentLoaded", () => {
  applyTheme();

  const form = document.getElementById("proposalForm");

  // 👨‍🎓 STUDENT PANEL
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const data = {
        title: document.getElementById("title").value,
        description: document.getElementById("description").value,
        proposer: username || document.getElementById("proposer").value,
        priority: document.getElementById("priority").value,
        deadline: document.getElementById("deadline").value
      };

      const res = await fetch(`${API}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        alert("Server error ❌");
        return;
      }

      alert("✅ Proposal Submitted!");
      form.reset();
      loadMyProposals();
    });

    // Auto-fill proposer
    if (username) {
      const nameInput = document.getElementById("proposer");
      if (nameInput) nameInput.value = username;
    }

    loadMyProposals();
  }

  // 👨‍💼 ADMIN PANEL
  if (document.getElementById("proposals")) {
    load();
    loadLogs();
  }
});

// ================= 👨‍🎓 STUDENT =================
async function loadMyProposals() {
  const res = await fetch(`${API}/proposals`);
  if (!res.ok) return;

  const data = await res.json();

  // 📊 STATS
  document.getElementById("total").innerText =
    `📥 ${data.length}`;

  document.getElementById("approvedCount").innerText =
    `✅ ${data.filter(p => p.status === "Approved").length}`;

  document.getElementById("rejectedCount").innerText =
    `❌ ${data.filter(p => p.status === "Rejected").length}`;

  const box = document.getElementById("myProposals");
  if (!box) return;

  box.innerHTML = "";

  const search = document.getElementById("search")?.value.toLowerCase() || "";

  const myData = data
    .filter(p => p.proposer === username)
    .filter(p => p.title.toLowerCase().includes(search));

  // 🟡 EMPTY STATE
  if (myData.length === 0) {
    box.innerHTML = "<p>No proposals yet 😶</p>";
    return;
  }

  myData.forEach(p => {
    const overdue =
      p.deadline && new Date(p.deadline) < new Date();

    const div = document.createElement("div");
    div.className = "proposal";

    if (overdue) div.style.border = "2px solid red";

    div.innerHTML = `
      <h3>🚀 ${p.title}</h3>
      <p>${p.description}</p>

      <p class="status ${p.status}">
        ${p.status}
      </p>

      <p>⚡ Priority: ${p.priority}</p>
      <p>📅 Deadline: ${p.deadline || "None"}</p>

      <p>💬 ${p.feedback || "No feedback yet"}</p>

      <p>🤖 AI Score: ${p.aiScore || 0}/100</p>

      <p>
      💡 Suggestions:<br>
      ${(p.aiSuggestions || []).join("<br>")}
      </p>
    `;

    box.appendChild(div);
  });
}

// ================= 👨‍💼 ADMIN =================
async function load() {
  const res = await fetch(`${API}/proposals`);
  if (!res.ok) return;

  let data = await res.json();

  data.sort((a, b) => (b.pinned === true) - (a.pinned === true));

  const pBox = document.getElementById("proposals");
  const aBox = document.getElementById("approved");
  const dBox = document.getElementById("development");


  if (!pBox || !aBox || !dBox) return;

  pBox.innerHTML = "";
  aBox.innerHTML = "";
  dBox.innerHTML = "";

  // 📊 STATS
  document.getElementById("total").innerText = `📥 ${data.length}`;
  document.getElementById("approvedCount").innerText =
    `✅ ${data.filter(p => p.status === "Approved").length}`;
  document.getElementById("rejectedCount").innerText =
    `❌ ${data.filter(p => p.status === "Rejected").length}`;

  data.forEach(p => {
    const div = document.createElement("div");
    div.className = "proposal";

    div.innerHTML = `
      <h3>${p.title}</h3>
      <p>${p.description}</p>
      <p>👤 ${p.proposer}</p>

      <p>⚡ ${p.priority}</p>

      ${p.pinned ? "<p>📌 Pinned</p>" : ""}

      <textarea id="f-${p.id}" placeholder="Feedback">${p.feedback || ""}</textarea>

      <select id="s-${p.id}">
        <option value="Submitted" ${p.status === "Submitted" ? "selected" : ""}>Submitted</option>
        <option value="Approved" ${p.status === "Approved" ? "selected" : ""}>Approved</option>
        <option value="Rejected" ${p.status === "Rejected" ? "selected" : ""}>Rejected</option>
      </select>

      <div class="btn-group">
        <button onclick="update(${p.id})">Update</button>
        <button onclick="togglePin(${p.id})">📌 Pin</button>
        <button onclick="del(${p.id})" class="delete">Delete</button>
      </div>
    `;

    if (p.status === "Approved") {

  // DEVELOPMENT CARD
  const devDiv = document.createElement("div");
  devDiv.className = "proposal";

  devDiv.innerHTML = `
  <h3>🚀 ${p.title}</h3>
  <p>${p.description}</p>

  <p>👤 ${p.proposer}</p>

  <p>📊 Progress: ${p.progress || 0}%</p>

  <input type="range" min="0" max="100" value="${p.progress || 0}"
    onchange="updateProgress(${p.id}, this.value)">

  <!-- TEAM -->
  <h4>👥 Team</h4>
  <p>${(p.team || []).join(", ") || "No team yet"}</p>

  <input id="team-${p.id}" placeholder="Add member name">
  <button onclick="addTeam(${p.id})">➕ Add</button>

  <!-- COMMENTS -->
  <h4>💬 Comments</h4>
  <div>
    ${(p.comments || [])
      .map(c => `<p>🗨️ ${c}</p>`)
      .join("")}
  </div>

  <h4>📝 Tasks</h4>

<input id="task-${p.id}" placeholder="New task">
<button onclick="addTask(${p.id})">➕ Add Task</button>

<div class="task-board">

  <div class="task-col">
    <h5>Todo</h5>
    ${(p.tasks || [])
      .filter(t => t.status === "todo")
      .map(t => `
        <div class="task">
          ${t.text}
          <button onclick="moveTask(${p.id}, '${t.id}', 'progress')">➡️</button>
        </div>
      `).join("")}
  </div>

  <div class="task-col">
    <h5>In Progress</h5>
    ${(p.tasks || [])
      .filter(t => t.status === "progress")
      .map(t => `
        <div class="task">
          ${t.text}
          <button onclick="moveTask(${p.id}, '${t.id}', 'done')">➡️</button>
        </div>
      `).join("")}
  </div>

  <div class="task-col">
    <h5>Done</h5>
    ${(p.tasks || [])
      .filter(t => t.status === "done")
      .map(t => `
        <div class="task">
          ${t.text}
          <button onclick="deleteTask(${p.id}, '${t.id}')">❌</button>
        </div>
      `).join("")}
  </div>

</div>

  <input id="c-${p.id}" placeholder="Write comment">
  <button onclick="addComment(${p.id})">💬 Add</button>

  <button onclick="complete(${p.id})">✅ Mark Completed</button>
`;

  dBox.appendChild(devDiv);

  aBox.appendChild(div);

} else {
  pBox.appendChild(div);
}
  });
}

// 🔄 UPDATE
async function update(id) {
  const status = document.getElementById(`s-${id}`).value;
  const feedback = document.getElementById(`f-${id}`).value;

  const res = await fetch(`${API}/proposals/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, feedback })
  });

  if (!res.ok) {
    alert("Update failed ❌");
    return;
  }

  load();
  loadLogs();
}

// 📌 PIN
async function togglePin(id) {
  const res = await fetch(`${API}/proposals`);
  const data = await res.json();

  const p = data.find(x => x.id == id);

  await fetch(`${API}/proposals/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pinned: !p.pinned })
  });

  load();
}

// ❌ DELETE
async function del(id) {
  const res = await fetch(`${API}/proposals/${id}`, {
    method: "DELETE"
  });

  if (!res.ok) {
    alert("Delete failed ❌");
    return;
  }

  load();
  loadLogs();
  loadCharts();
  loadNotifications();
}

// 🧾 LOGS
async function loadLogs() {
  const res = await fetch(`${API}/logs`);
  if (!res.ok) return;

  const logs = await res.json();

  const box = document.getElementById("logs");
  if (!box) return;

  box.innerHTML = "";



  logs.slice().reverse().forEach(l => {
    const div = document.createElement("div");
    div.className = "proposal";
    div.innerText = l;
    box.appendChild(div);
  });
}

// 📊 UPDATE PROGRESS
async function updateProgress(id, value) {
  await fetch(`${API}/proposals/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ progress: value })
  });

  load();
}

// ✅ COMPLETE PROJECT
async function complete(id) {
  await fetch(`${API}/proposals/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "Completed", progress: 100 })
  });

  load();
}
// 👥 ADD TEAM MEMBER
async function addTeam(id) {
  const input = document.getElementById(`team-${id}`);
  const name = input.value.trim();
  if (!name) return;

  const res = await fetch(`${API}/proposals`);
  const data = await res.json();

  const p = data.find(x => x.id == id);

  const updatedTeam = [...(p.team || []), name];

  await fetch(`${API}/proposals/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ team: updatedTeam })
  });

  load();
}

// 💬 ADD COMMENT
async function addComment(id) {
  const input = document.getElementById(`c-${id}`);
  const text = input.value.trim();
  if (!text) return;

  const res = await fetch(`${API}/proposals`);
  const data = await res.json();

  const p = data.find(x => x.id == id);

  const updatedComments = [...(p.comments || []), text];

  await fetch(`${API}/proposals/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comments: updatedComments })
  });

  load();
}

// 📊 LOAD CHARTS
async function loadCharts() {
  const res = await fetch(`${API}/proposals`);
  if (!res.ok) return;

  const data = await res.json();

  // STATUS COUNT
  const submitted = data.filter(p => p.status === "Submitted").length;
  const approved = data.filter(p => p.status === "Approved").length;
  const rejected = data.filter(p => p.status === "Rejected").length;
  const completed = data.filter(p => p.status === "Completed").length;

  // PRIORITY COUNT
  const low = data.filter(p => p.priority === "Low").length;
  const medium = data.filter(p => p.priority === "Medium").length;
  const high = data.filter(p => p.priority === "High").length;

  // STATUS BAR CHART
  new Chart(document.getElementById("statusChart"), {
    type: "bar",
    data: {
      labels: ["Submitted", "Approved", "Rejected", "Completed"],
      datasets: [{
        label: "Proposals",
        data: [submitted, approved, rejected, completed]
      }]
    }
  });

  // PRIORITY PIE CHART
  new Chart(document.getElementById("priorityChart"), {
    type: "pie",
    data: {
      labels: ["Low", "Medium", "High"],
      datasets: [{
        data: [low, medium, high]
      }]
    }
  });
}

async function addTask(id) {
  const input = document.getElementById(`task-${id}`);
  const text = input.value.trim();
  if (!text) return;

  const res = await fetch(`${API}/proposals`);
  const data = await res.json();

  const p = data.find(x => x.id == id);

  const newTask = {
    id: Date.now().toString(),
    text,
    status: "todo"
  };

  const updated = [...(p.tasks || []), newTask];

  await fetch(`${API}/proposals/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tasks: updated })
  });

  load();
}

async function moveTask(pid, tid, newStatus) {
  const res = await fetch(`${API}/proposals`);
  const data = await res.json();

  const p = data.find(x => x.id == pid);

  const updated = p.tasks.map(t =>
    t.id == tid ? { ...t, status: newStatus } : t
  );

  await fetch(`${API}/proposals/${pid}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tasks: updated })
  });

  load();
}

async function deleteTask(pid, tid) {
  const res = await fetch(`${API}/proposals`);
  const data = await res.json();

  const p = data.find(x => x.id == pid);

  const updated = p.tasks.filter(t => t.id != tid);

  await fetch(`${API}/proposals/${pid}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tasks: updated })
  });

  load();
}

async function loadNotifications() {
  const res = await fetch(`${API}/notifications`);
  const data = await res.json();

  const unread = data.filter(n => !n.read).length;
  document.getElementById("notifCount").innerText = unread;

  const box = document.getElementById("notifBox");
  if (!box) return;

  box.innerHTML = "";

  data.slice().reverse().forEach(n => {
    const div = document.createElement("div");
    div.innerText = n.text;
    box.appendChild(div);
  });
}

setInterval(loadNotifications, 3000);