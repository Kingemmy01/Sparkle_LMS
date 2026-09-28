const $ = selector => document.querySelector(selector);
const params = new URLSearchParams(location.search);
let role = ["student", "facilitator"].includes(params.get("role")) ? params.get("role") : "admin";
const saved = JSON.parse(localStorage.getItem("classroomlyData") || "null") || {};
let adminPassword = saved.adminPassword || "Sparkle@2024";
const facilitators = saved.facilitators || [];

function updateRole() {
  document.querySelectorAll("[data-role]").forEach(button => button.classList.toggle("active", button.dataset.role === role));
  const isStudent = role === "student";
  $("#nameLabel").firstChild.textContent = role === "admin" ? "Admin name" : role === "facilitator" ? "Facilitator name" : "Student name";
  $("#loginForm input").placeholder = role === "admin" ? "e.g. Amaka Okafor" : role === "facilitator" ? "e.g. Tolu Adeyemi" : "e.g. Aisha Bello";
  $("#passwordLabel").hidden = isStudent;
  $("#passwordLabel input").required = !isStudent;
  $("#loginHint").textContent = role === "admin" ? "Use your administrator name and password to enter the dashboard." : role === "facilitator" ? "Use the account created by your administrator." : "Use your learner name to enter the student portal.";
  $("#loginError").textContent = "";
  $("#loginForm input").value = role === "admin" ? (saved.adminName || "") : "";
  $("#showPasswordSetup").hidden = role !== "admin";
}

document.querySelectorAll("[data-role]").forEach(button => button.addEventListener("click", () => { role = button.dataset.role; updateRole(); }));
$("#loginForm").addEventListener("submit", event => {
  event.preventDefault();
  const name = new FormData(event.target).get("name").trim();
  const password = new FormData(event.target).get("password");
  if (role === "admin") {
    if (password !== adminPassword) { $("#loginError").textContent = "Incorrect admin password."; return; }
    saved.adminName = name;
    localStorage.setItem("classroomlyData", JSON.stringify(saved));
  } else if (role === "facilitator") {
    const facilitator = facilitators.find(account => account.name.toLowerCase() === name.toLowerCase() && account.password === password);
    if (!facilitator) { $("#loginError").textContent = "That facilitator name or password is incorrect."; return; }
    sessionStorage.setItem("sparkleAuth", JSON.stringify({role, name: facilitator.name, id: facilitator.id}));
    location.href = "index.html";
    return;
  }
  sessionStorage.setItem("sparkleAuth", JSON.stringify({role, name}));
  location.href = role === "admin" ? "index.html" : "student.html";
});
$("#showPasswordSetup").addEventListener("click", () => { const form = $("#passwordSetupForm"); form.hidden = !form.hidden; $("#showPasswordSetup").textContent = form.hidden ? "Register admin password" : "Hide password registration"; });
$("#passwordSetupForm").addEventListener("submit", event => {
  event.preventDefault();
  const details = Object.fromEntries(new FormData(event.target));
  if (details.currentPassword !== adminPassword) { $("#setupError").textContent = "Current password is incorrect."; return; }
  if (details.newPassword !== details.confirmPassword) { $("#setupError").textContent = "New passwords do not match."; return; }
  adminPassword = details.newPassword;
  saved.adminPassword = adminPassword;
  localStorage.setItem("classroomlyData", JSON.stringify(saved));
  event.target.reset();
  event.target.hidden = true;
  $("#showPasswordSetup").textContent = "Register admin password";
  $("#setupError").textContent = "";
  $("#loginError").textContent = "Admin password saved. You can now log in.";
});
updateRole();
