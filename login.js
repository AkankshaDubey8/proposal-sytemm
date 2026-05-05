const API = "http://localhost:3000";

document.getElementById("loginForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;
  const remember = document.getElementById("remember").checked;

  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, role })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error);
    return;
  }

  if (remember) {
    localStorage.setItem("userRole", data.role);
    localStorage.setItem("username", data.username);
  } else {
    sessionStorage.setItem("userRole", data.role);
    sessionStorage.setItem("username", data.username);
  }

  location.href = data.role === "admin" ? "admin.html" : "student.html";
});