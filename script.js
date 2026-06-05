const STORAGE_KEY = "studentPerformanceDashboard.v1";

const sampleSubjects = [
  {
    subject: "ECN",
    marks: 32,
    maxMarks: 100,
    attendance: 68,
    chaptersDone: 2,
    totalChapters: 7,
    examDate: "2026-11-27",
  },
  {
    subject: "Applied Physics",
    marks: 41,
    maxMarks: 60,
    attendance: 74,
    chaptersDone: 4,
    totalChapters: 6,
    examDate: "2026-12-03",
  },
  {
    subject: "ECD",
    marks: 38,
    maxMarks: 60,
    attendance: 82,
    chaptersDone: 3,
    totalChapters: 6,
    examDate: "2026-12-08",
  },
  {
    subject: "DCSD",
    marks: 44,
    maxMarks: 60,
    attendance: 79,
    chaptersDone: 4,
    totalChapters: 6,
    examDate: "2026-12-11",
  },
  {
    subject: "IML",
    marks: 35,
    maxMarks: 60,
    attendance: 72,
    chaptersDone: 3,
    totalChapters: 5,
    examDate: "2026-12-15",
  },
];

let subjects = loadSubjects();

const subjectForm = document.getElementById("subjectForm");
const resetDataBtn = document.getElementById("resetData");

function loadSubjects() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return sampleSubjects;
  }

  try {
    return JSON.parse(saved);
  } catch {
    return sampleSubjects;
  }
}

function saveSubjects() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
}

function percentage(value, total) {
  if (!total || Number(total) <= 0) {
    return 0;
  }

  return Math.round((Number(value) / Number(total)) * 100);
}

function average(numbers) {
  if (!numbers.length) {
    return 0;
  }

  return Math.round(numbers.reduce((sum, n) => sum + n, 0) / numbers.length);
}

function getStatus(score, attendance, syllabus) {
  if (score < 40 || attendance < 70 || syllabus < 40) {
    return "High Risk";
  }

  if (score < 60 || attendance < 75 || syllabus < 60) {
    return "Needs Work";
  }

  return "On Track";
}

function statusClass(status) {
  if (status === "High Risk") {
    return "bad";
  }

  if (status === "Needs Work") {
    return "mid";
  }

  return "good";
}

function daysToExam(dateText) {
  const today = new Date();
  const exam = new Date(dateText);

  const diff =
    exam.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0);

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function riskScore(item) {
  const score = percentage(item.marks, item.maxMarks);
  const syllabus = percentage(item.chaptersDone, item.totalChapters);

  let risk = 0;

  risk += Math.max(0, 70 - score) * 1.2;
  risk += Math.max(0, 75 - item.attendance) * 0.8;
  risk += Math.max(0, 65 - syllabus);

  const days = daysToExam(item.examDate);

  if (days >= 0 && days <= 20) {
    risk += 20 - days;
  }

  return Math.round(risk);
}

function render() {
  const scores = subjects.map((s) => percentage(s.marks, s.maxMarks));
  const attendanceValues = subjects.map((s) => Number(s.attendance));
  const syllabusValues = subjects.map((s) =>
    percentage(s.chaptersDone, s.totalChapters)
  );

  const overall = average(scores);
  const attendance = average(attendanceValues);
  const syllabus = average(syllabusValues);

  const riskSubjects = subjects.filter((s) => {
    const score = percentage(s.marks, s.maxMarks);
    const syllabusPercent = percentage(s.chaptersDone, s.totalChapters);

    return getStatus(score, s.attendance, syllabusPercent) === "High Risk";
  });

  document.getElementById("overallScore").textContent = `${overall}%`;
  document.getElementById("avgAttendance").textContent = `${attendance}%`;
  document.getElementById("syllabusDone").textContent = `${syllabus}%`;
  document.getElementById("riskCount").textContent = riskSubjects.length;

  document.getElementById("overallLabel").textContent =
    overall >= 70
      ? "Strong performance"
      : overall >= 50
        ? "Improving, but needs push"
        : "Needs focused recovery";

  document.getElementById("attendanceLabel").textContent =
    attendance >= 75 ? "Attendance safe" : "Attendance needs attention";

  document.getElementById("syllabusLabel").textContent =
    syllabus >= 70
      ? "Good syllabus progress"
      : "Plan more completion slots";

  renderFocus();
  renderChart();
  renderPriorityList();
  renderTable();
  renderInsights();
}

function renderFocus() {
  if (!subjects.length) {
    document.getElementById("focusSubject").textContent = "No subjects yet";
    document.getElementById("focusReason").textContent =
      "Add a subject to begin.";
    return;
  }

  const sorted = [...subjects].sort((a, b) => riskScore(b) - riskScore(a));
  const focus = sorted[0];

  const score = percentage(focus.marks, focus.maxMarks);
  const syllabus = percentage(focus.chaptersDone, focus.totalChapters);

  document.getElementById("focusSubject").textContent = focus.subject;
  document.getElementById("focusReason").textContent =
    `Score ${score}%, attendance ${focus.attendance}%, syllabus ${syllabus}%.`;
}

function renderChart() {
  const chart = document.getElementById("performanceChart");

  chart.innerHTML = "";

  if (!subjects.length) {
    chart.innerHTML = `<p>No subjects added yet.</p>`;
    return;
  }

  subjects.forEach((item) => {
    const score = percentage(item.marks, item.maxMarks);

    const row = document.createElement("div");

    row.className = "chart-row";

    row.innerHTML = `
      <strong>${item.subject}</strong>
      <div class="bar">
        <div class="bar-fill" style="width:${Math.min(score, 100)}%"></div>
      </div>
      <span>${score}%</span>
    `;

    chart.appendChild(row);
  });
}

function renderPriorityList() {
  const box = document.getElementById("priorityList");

  box.innerHTML = "";

  const sorted = [...subjects]
    .sort((a, b) => riskScore(b) - riskScore(a))
    .slice(0, 4);

  sorted.forEach((item, index) => {
    const score = percentage(item.marks, item.maxMarks);
    const syllabus = percentage(item.chaptersDone, item.totalChapters);
    const days = daysToExam(item.examDate);
    const status = getStatus(score, item.attendance, syllabus);

    const div = document.createElement("div");

    div.className = "priority-item";

    div.innerHTML = `
      <h4>
        ${index + 1}. ${item.subject}
        <span class="${statusClass(status)}">• ${status}</span>
      </h4>
      <p>
        Score: ${score}%,
        Attendance: ${item.attendance}%,
        Syllabus: ${syllabus}%,
        Exam: ${days >= 0 ? `${days} days left` : "date passed"}.
      </p>
    `;

    box.appendChild(div);
  });
}

function renderTable() {
  const rows = document.getElementById("subjectRows");

  rows.innerHTML = "";

  subjects.forEach((item, index) => {
    const score = percentage(item.marks, item.maxMarks);
    const syllabus = percentage(item.chaptersDone, item.totalChapters);
    const status = getStatus(score, item.attendance, syllabus);
    const days = daysToExam(item.examDate);

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><strong>${item.subject}</strong></td>
      <td>${score}%</td>
      <td>${item.attendance}%</td>
      <td>${syllabus}%</td>
      <td>${days >= 0 ? `${days} days` : "Passed"}</td>
      <td><span class="${statusClass(status)}">${status}</span></td>
      <td>
        <button class="delete-btn" onclick="deleteSubject(${index})">
          Delete
        </button>
      </td>
    `;

    rows.appendChild(tr);
  });
}

function renderInsights() {
  const box = document.getElementById("insightsBox");

  const scores = subjects.map((s) => percentage(s.marks, s.maxMarks));
  const attendanceValues = subjects.map((s) => Number(s.attendance));
  const syllabusValues = subjects.map((s) =>
    percentage(s.chaptersDone, s.totalChapters)
  );

  const overall = average(scores);
  const attendance = average(attendanceValues);
  const syllabus = average(syllabusValues);

  let scoreMessage =
    overall >= 70
      ? "Your marks are currently strong. Maintain revision and test practice."
      : overall >= 50
        ? "Your marks are in the middle zone. Focus on weak chapters and repeated mistakes."
        : "Your marks need recovery. Study fewer topics deeply and solve more basic questions.";

  let attendanceMessage =
    attendance >= 75
      ? "Attendance is currently safe. Keep it stable."
      : "Attendance is risky. Avoid missing lectures unless absolutely necessary.";

  let syllabusMessage =
    syllabus >= 70
      ? "Syllabus completion is healthy. Start revision cycles."
      : "Syllabus completion is behind. Make a weekly chapter completion plan.";

  box.innerHTML = `
    <div class="insight">
      <h4>Marks Insight</h4>
      <p>${scoreMessage}</p>
    </div>
    <div class="insight">
      <h4>Attendance Insight</h4>
      <p>${attendanceMessage}</p>
    </div>
    <div class="insight">
      <h4>Syllabus Insight</h4>
      <p>${syllabusMessage}</p>
    </div>
  `;
}

function deleteSubject(index) {
  subjects.splice(index, 1);
  saveSubjects();
  render();
}

subjectForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const newSubject = {
    subject: document.getElementById("subject").value.trim(),
    marks: Number(document.getElementById("marks").value),
    maxMarks: Number(document.getElementById("maxMarks").value),
    attendance: Number(document.getElementById("attendance").value),
    chaptersDone: Number(document.getElementById("chaptersDone").value),
    totalChapters: Number(document.getElementById("totalChapters").value),
    examDate: document.getElementById("examDate").value,
  };

  const existingIndex = subjects.findIndex(
    (s) => s.subject.toLowerCase() === newSubject.subject.toLowerCase()
  );

  if (existingIndex >= 0) {
    subjects[existingIndex] = newSubject;
  } else {
    subjects.push(newSubject);
  }

  saveSubjects();
  subjectForm.reset();
  render();
});

resetDataBtn.addEventListener("click", () => {
  subjects = sampleSubjects;
  saveSubjects();
  render();
});

render();
