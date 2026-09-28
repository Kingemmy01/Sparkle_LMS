const auth = JSON.parse(sessionStorage.getItem("sparkleAuth") || "null");
if (!auth || auth.role !== "student") location.replace("login.html?role=student");
const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? "").replace(/[&<>"']/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[character]));
const saved = JSON.parse(localStorage.getItem("classroomlyData") || "null") || {schools: [], resources: []};
const resources = saved.resources || [];
const schools = saved.schools?.filter(school => school.name !== "Lighthouse Academy").length ? saved.schools.filter(school => school.name !== "Lighthouse Academy") : [{name: "Sparkle Foundation School"}];
const activeSession = saved.activeSession || "2024/25";

$("#portalSchoolSelect").innerHTML = schools.map(school => `<option value="${esc(school.name)}">${esc(school.name)}</option>`).join("");
$("#studentSession").textContent = activeSession;
$("#studentWelcome").textContent = `Welcome, ${auth?.name || "student"}`;
$("#studentPortalForm [name=name]").value = auth?.name || "";
window.addEventListener("storage", event => { if (event.key !== "classroomlyData" || !event.newValue) return; const latest = JSON.parse(event.newValue); $("#studentSession").textContent = latest.activeSession || "2024/25"; });

function toast(message) {
  const element = $("#toast");
  element.querySelector("strong").textContent = message;
  element.classList.add("show");
  setTimeout(() => element.classList.remove("show"), 2800);
}

function showResult(details) {
  const label = details.type === "first" ? "Test 1" : "Test 2";
  const match = resources.find(resource => resource.kind === "assessment" && resource.class === details.class && resource.type === details.type);
  const lessons = resources.filter(resource => resource.kind === "lesson" && resource.class === details.class).slice().reverse();
  const lessonMarkup = lessons.length ? `<section class="student-lessons"><div class="student-section-heading"><p class="eyebrow">WEEKLY LESSON NOTES</p><span>${esc(details.class)}</span></div>${lessons.map(lesson => `<article class="student-lesson"><div class="student-lesson-meta"><strong>${esc(lesson.week)}</strong><small>${esc(lesson.fileName)}</small></div><h3>Lesson content</h3><p>${esc(lesson.content || "Content not provided.")}</p><h3>Assignment</h3><p>${esc(lesson.assignment || "No assignment provided.")}</p></article>`).join("")}</section>` : `<section class="student-lessons empty-lesson"><p class="eyebrow">WEEKLY LESSON NOTES</p><p class="muted">No lesson note has been published for ${esc(details.class)} yet.</p></section>`;
  const assessmentMarkup = match ? `<div class="assessment-resource"><span class="resource-type assessment">▣</span><div><strong>${esc(match.title || match.fileName)}</strong><small>${match.questions?.length || 0} questions · ${match.duration || 0} minutes</small></div></div><button class="btn btn-primary" type="button" id="beginAssessment">Begin ${label} <span>→</span></button>` : `<div class="portal-placeholder"><span class="portal-placeholder-icon">◷</span><h2>${label} is not available yet</h2><p class="muted">Ask your administrator to publish the ${label} for ${esc(details.class)}.</p></div>`;
  $("#portalResult").innerHTML = `<div class="portal-ready"><span class="ready-mark">✓</span><p class="eyebrow">${match ? `${label} IS READY` : "WELCOME"}</p><h2>Welcome, ${esc(details.name)}</h2><p class="muted">${esc(details.class)} · ${esc(details.school)}</p>${assessmentMarkup}</div>${lessonMarkup}`;
  $("#beginAssessment")?.addEventListener("click", () => startQuiz(match, details, label));
}

let quizTimer;
function startQuiz(resource, details, label) {
  if (!resource.questions?.length) return toast("This assessment has no questions yet");
  const questions = resource.questions.map(question => ({...question, options: [...question.options]}));
  if (resource.order === "random") questions.sort(() => Math.random() - 0.5);
  const state = {questions, current: 0, answers: Array(questions.length).fill(null), seconds: (resource.duration || 20) * 60};
  const quiz = $("#quizArea");
  quiz.hidden = false;
  quiz.scrollIntoView({behavior: "smooth", block: "start"});
  function renderQuestion() {
    const question = state.questions[state.current];
    quiz.innerHTML = `<div class="quiz-head"><div><p class="eyebrow">${esc(label)}</p><h2>${esc(resource.title || "Multiple-choice assessment")}</h2></div><strong class="quiz-timer" id="quizTimer">${formatTime(state.seconds)}</strong></div><div class="quiz-progress"><span>Question ${state.current + 1} of ${state.questions.length}</span><div><i style="width:${((state.current + 1) / state.questions.length) * 100}%"></i></div></div><article class="quiz-question"><h3>${esc(question.text)}</h3><div class="quiz-options">${question.options.map((option, index) => `<label class="quiz-option ${state.answers[state.current] === index ? "selected" : ""}"><input type="radio" name="quizAnswer" value="${index}" ${state.answers[state.current] === index ? "checked" : ""} /> <span>${String.fromCharCode(65 + index)}</span>${esc(option)}</label>`).join("")}</div></article><div class="quiz-actions"><button class="btn btn-ghost" type="button" id="quizPrevious" ${state.current === 0 ? "disabled" : ""}>← Previous</button><button class="btn btn-primary" type="button" id="quizNext">${state.current === state.questions.length - 1 ? "Submit assessment" : "Next question →"}</button></div>`;
    quiz.querySelectorAll("input[name=quizAnswer]").forEach(input => input.addEventListener("change", event => { state.answers[state.current] = Number(event.target.value); renderQuestion(); }));
    quiz.querySelector("#quizPrevious").addEventListener("click", () => { state.current -= 1; renderQuestion(); });
    quiz.querySelector("#quizNext").addEventListener("click", () => { if (state.current === state.questions.length - 1) finishQuiz(); else { state.current += 1; renderQuestion(); } });
  }
  function finishQuiz() { clearInterval(quizTimer); const score = state.answers.reduce((total, answer, index) => total + (answer === state.questions[index].answer ? 1 : 0), 0); quiz.innerHTML = resource.showScore ? `<div class="quiz-complete"><span class="ready-mark">✓</span><p class="eyebrow">ASSESSMENT SUBMITTED</p><h2>Well done, ${esc(details.name)}</h2><strong class="quiz-score">${score}/${state.questions.length}</strong><p class="muted">Your score has been recorded.</p></div>` : `<div class="quiz-complete"><span class="ready-mark">✓</span><p class="eyebrow">ASSESSMENT SUBMITTED</p><h2>Thank you, ${esc(details.name)}</h2><p class="muted">Your assessment has been submitted. Your administrator will share your result.</p></div>`; }
  function formatTime(seconds) { return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`; }
  renderQuestion();
  quizTimer = setInterval(() => { state.seconds -= 1; const timer = $("#quizTimer"); if (timer) timer.textContent = formatTime(state.seconds); if (state.seconds <= 0) finishQuiz(); }, 1000);
}

$("#studentPortalForm").addEventListener("submit", event => {
  event.preventDefault();
  showResult(Object.fromEntries(new FormData(event.target)));
});
$("[data-logout]").addEventListener("click", () => { sessionStorage.removeItem("sparkleAuth"); location.href = "login.html?role=student"; });
