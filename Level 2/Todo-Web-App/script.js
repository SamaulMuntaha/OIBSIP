
const KEY = "taskflow-purple-pro-v2";

const initialTasks = [
  {id:1,name:"Complete website homepage design",category:"Design",priority:"High",due:"",status:"progress",created:Date.now()},
  {id:2,name:"Review project requirements",category:"Work",priority:"Medium",due:"",status:"done",created:Date.now()},
  {id:3,name:"Prepare presentation slides",category:"Planning",priority:"High",due:"",status:"todo",created:Date.now()},
  {id:4,name:"Update portfolio projects",category:"Personal",priority:"Low",due:"",status:"done",created:Date.now()},
  {id:5,name:"Explore new UI inspiration",category:"Creative",priority:"Medium",due:"",status:"progress",created:Date.now()}
];

let stored = {};
try {
  stored = JSON.parse(localStorage.getItem(KEY) || "{}") || {};
} catch (error) {
  stored = {};
}

let tasks = Array.isArray(stored.tasks) ? stored.tasks : initialTasks;
let notes = Array.isArray(stored.notes) ? stored.notes : [];
let profile = stored.profile || "S";

let filter = "all";
let editingId = null;
let monthCursor = new Date();
let timer = 25 * 60;
let timerRun = null;
let isRunning = false;
let draggingId = null;
let lastReminderDate = "";

function $(id) {
  return document.getElementById(id);
}

function localDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function persist() {
  localStorage.setItem(KEY, JSON.stringify({
    tasks,
    notes,
    profile,
    theme: document.body.classList.contains("light") ? "light" : "dark"
  }));
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
}

function goTo(id) {
  const section = $(id);
  if (section) section.scrollIntoView({behavior:"smooth"});
}

function activateNav(link) {
  document.querySelectorAll(".nav a").forEach(item => {
    item.classList.remove("active");
  });

  link.classList.add("active");
  $("crumb").textContent = link.innerText.trim();
}

document.querySelectorAll(".nav a").forEach(link => {
  link.addEventListener("click", () => activateNav(link));
});

function isOverdue(task) {
  return task.due &&
    task.due < localDateString() &&
    task.status !== "done";
}

/* DASHBOARD */
function updateStats() {
  const total = tasks.length;
  const done = tasks.filter(t => t.status === "done").length;
  const active = tasks.filter(t => t.status !== "done").length;
  const overdue = tasks.filter(isOverdue).length;
  const percent = total ? Math.round(done / total * 100) : 0;

  $("total").textContent = total;
  $("completed").textContent = done;
  $("active").textContent = active;
  $("overdue").textContent = overdue;
  $("percent").textContent = percent + "%";

  $("ring").style.background =
    `conic-gradient(#b28aff 0 ${percent}%,#342940 ${percent}% 100%)`;

  $("legendDone").textContent = done;
  $("legendLeft").textContent = active;

  $("doneBar").style.width = percent + "%";
  $("activeBar").style.width = (total ? active / total * 100 : 0) + "%";
  $("lateBar").style.width = (total ? overdue / total * 100 : 0) + "%";
  $("totalBar").style.width = (total ? Math.min(100, total * 8) : 0) + "%";
}

/* TASKS */
function renderTasks() {
  const query = $("search").value.toLowerCase();
  const list = $("taskList");
  list.innerHTML = "";

  const filtered = tasks.filter(task => {
    const match = (task.name + " " + task.category).toLowerCase().includes(query);

    return match && (
      filter === "all" ||
      (filter === "active" && task.status !== "done") ||
      (filter === "done" && task.status === "done") ||
      (filter === "overdue" && isOverdue(task))
    );
  });

  if (!filtered.length) {
    list.innerHTML = '<div class="empty">No matching tasks. Create a new task ✦</div>';
  }

  filtered.forEach(task => {
    const row = document.createElement("div");
    row.className = "task" + (task.status === "done" ? " done" : "");

    const check = document.createElement("button");
    check.className = "check";
    check.textContent = task.status === "done" ? "✓" : "";
    check.setAttribute("aria-label", "Toggle task completion");

    check.onclick = () => {
      task.status = task.status === "done" ? "todo" : "done";
      persist();
      renderAll();
      showToast("Task status updated");
    };

    const info = document.createElement("div");
    info.className = "task-info";

    const title = document.createElement("strong");
    title.textContent = task.name;

    const meta = document.createElement("small");
    meta.textContent =
      (task.category || "General") + " · " +
      (task.due ? "Due " + task.due : "No deadline") + " · " +
      task.status;

    info.append(title, meta);

    const tag = document.createElement("span");
    tag.className = "tag " + task.priority;
    tag.textContent = task.priority;

    const edit = document.createElement("button");
    edit.className = "trash";
    edit.textContent = "✎";
    edit.title = "Edit task";
    edit.onclick = () => openTaskModal(task.id);

    const del = document.createElement("button");
    del.className = "trash";
    del.textContent = "×";
    del.title = "Delete task";
    del.onclick = () => deleteTask(task.id);

    row.append(check, info, tag, edit, del);
    list.append(row);
  });

  updateStats();
}

function setFilter(value, button) {
  filter = value;

  document.querySelectorAll(".filter").forEach(item => {
    item.classList.remove("active");
  });

  button.classList.add("active");
  renderTasks();
}

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    setFilter(button.dataset.filter, button);
  });
});

$("search").addEventListener("input", renderTasks);

function openTaskModal(id) {
  editingId = id || null;
  const task = tasks.find(item => item.id === id);

  $("taskModalTitle").textContent = task ? "Edit task ✦" : "Create a new task ✦";
  $("taskName").value = task?.name || "";
  $("taskCategory").value = task?.category || "";
  $("taskPriority").value = task?.priority || "Medium";
  $("taskDate").value = task?.due || "";
  $("taskStatus").value = task?.status || "todo";

  $("taskModal").classList.add("open");
  setTimeout(() => $("taskName").focus(), 100);
}

function closeTaskModal() {
  $("taskModal").classList.remove("open");
  editingId = null;
}

function saveTask() {
  const name = $("taskName").value.trim();

  if (!name) {
    showToast("Please enter a task name");
    $("taskName").focus();
    return;
  }

  const data = {
    name,
    category: $("taskCategory").value.trim() || "General",
    priority: $("taskPriority").value,
    due: $("taskDate").value,
    status: $("taskStatus").value
  };

  if (editingId !== null) {
    tasks = tasks.map(task =>
      task.id === editingId ? {...task, ...data} : task
    );
    showToast("Task updated ✦");
  } else {
    tasks.unshift({
      id: Date.now(),
      ...data,
      created: Date.now()
    });
    showToast("New task created ✦");
  }

  persist();
  closeTaskModal();
  renderAll();
}

function deleteTask(id) {
  if (!confirm("Delete this task?")) return;

  tasks = tasks.filter(task => task.id !== id);
  persist();
  renderAll();
  showToast("Task deleted");
}

/* KANBAN */
function renderBoard() {
  const statuses = ["todo", "progress", "done"];

  statuses.forEach(status => {
    const zone = $("zone-" + status);
    zone.innerHTML = "";

    const group = tasks.filter(task => task.status === status);
    $("count-" + status).textContent = group.length;

    if (!group.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "No tasks here";
      zone.append(empty);
    }

    group.forEach(task => {
      const card = document.createElement("div");
      card.className = "board-card";
      card.draggable = true;

      const title = document.createElement("strong");
      title.textContent = task.name;

      const meta = document.createElement("small");
      meta.textContent = (task.category || "General") + " · " + task.priority;

      card.append(title, meta);

      card.addEventListener("dragstart", () => {
        draggingId = task.id;
      });

      card.addEventListener("dragend", () => {
        draggingId = null;
      });

      zone.append(card);
    });
  });
}

document.querySelectorAll(".board-col").forEach(column => {
  column.addEventListener("dragover", event => {
    event.preventDefault();
    column.classList.add("dragover");
  });

  column.addEventListener("dragleave", () => {
    column.classList.remove("dragover");
  });

  column.addEventListener("drop", event => {
    event.preventDefault();
    column.classList.remove("dragover");

    if (draggingId === null) return;

    const status = column.dataset.status;

    tasks = tasks.map(task =>
      task.id === draggingId ? {...task, status} : task
    );

    persist();
    renderAll();
    showToast("Task moved successfully");
  });
});

/* CALENDAR */
function changeMonth(step) {
  monthCursor.setMonth(monthCursor.getMonth() + step);
  renderCalendar();
}

$("prevMonth").addEventListener("click", () => changeMonth(-1));
$("nextMonth").addEventListener("click", () => changeMonth(1));

function renderCalendar() {
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();

  $("monthTitle").textContent = monthCursor.toLocaleDateString("en-US", {
    month:"long",
    year:"numeric"
  });

  const grid = $("calendarGrid");
  grid.innerHTML = "";

  ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(day => {
    const element = document.createElement("div");
    element.className = "dayname";
    element.textContent = day;
    grid.append(element);
  });

  const first = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();
  const previousCount = new Date(year, month, 0).getDate();
  const today = localDateString();

  for (let i = 0; i < 42; i++) {
    const dayNumber = i - first + 1;
    let date, muted = false, number;

    if (dayNumber < 1) {
      date = new Date(year, month - 1, previousCount + dayNumber);
      muted = true;
      number = previousCount + dayNumber;
    } else if (dayNumber > count) {
      date = new Date(year, month + 1, dayNumber - count);
      muted = true;
      number = dayNumber - count;
    } else {
      date = new Date(year, month, dayNumber);
      number = dayNumber;
    }

    const iso = localDateString(date);
    const cell = document.createElement("div");

    cell.className = "calendar-day" +
      (muted ? " muted" : "") +
      (iso === today ? " today" : "");

    const num = document.createElement("div");
    num.className = "num";
    num.textContent = number;
    cell.append(num);

    tasks.filter(task => task.due === iso).slice(0, 2).forEach(task => {
      const event = document.createElement("div");
      event.className = "event" + (isOverdue(task) ? " overdue" : "");
      event.textContent = task.name;
      event.title = task.name;
      cell.append(event);
    });

    grid.append(cell);
  }
}

/* NOTES */
function openNoteModal() {
  $("noteTitle").value = "";
  $("noteText").value = "";
  $("noteModal").classList.add("open");
}

function closeNoteModal() {
  $("noteModal").classList.remove("open");
}

function saveNote() {
  const title = $("noteTitle").value.trim();
  const text = $("noteText").value.trim();

  if (!title || !text) {
    showToast("Add a title and some note text");
    return;
  }

  notes.unshift({
    id: Date.now(),
    title,
    text,
    created: new Date().toLocaleDateString()
  });

  persist();
  closeNoteModal();
  renderNotes();
  showToast("Note saved ✦");
}

function renderNotes() {
  const grid = $("notesGrid");
  grid.innerHTML = "";

  if (!notes.length) {
    grid.innerHTML = '<div class="panel empty-note">No notes yet. Create your first note ✦</div>';
    return;
  }

  notes.forEach(note => {
    const card = document.createElement("article");
    card.className = "note-card";

    const title = document.createElement("h4");
    title.textContent = note.title;

    const body = document.createElement("p");
    body.textContent = note.text;

    const date = document.createElement("small");
    date.textContent = note.created;

    const del = document.createElement("button");
    del.textContent = "×";
    del.title = "Delete note";

    del.onclick = () => {
      if (!confirm("Delete this note?")) return;

      notes = notes.filter(item => item.id !== note.id);
      persist();
      renderNotes();
      showToast("Note deleted");
    };

    card.append(title, body, date, del);
    grid.append(card);
  });
}

/* FOCUS TIMER */
function timerDisplay() {
  $("timer").textContent =
    String(Math.floor(timer / 60)).padStart(2, "0") + ":" +
    String(timer % 60).padStart(2, "0");
}

function toggleTimer() {
  const button = $("timerBtn");

  if (isRunning) {
    clearInterval(timerRun);
    isRunning = false;
    button.textContent = "Resume";
    return;
  }

  if (timer <= 0) timer = 25 * 60;

  isRunning = true;
  button.textContent = "Pause";

  timerRun = setInterval(() => {
    timer--;
    timerDisplay();

    if (timer <= 0) {
      clearInterval(timerRun);
      isRunning = false;
      timer = 25 * 60;
      timerDisplay();
      button.textContent = "Start focus";

      showToast("Focus session complete! ✨");

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("TaskFlow", {
          body:"Your focus session is complete!"
        });
      }
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(timerRun);
  isRunning = false;
  timer = 25 * 60;
  timerDisplay();
  $("timerBtn").textContent = "Start focus";
}

/* NOTIFICATIONS */
async function enableNotifications() {
  if (!("Notification" in window)) {
    showToast("Browser notifications are not supported");
    return;
  }

  const permission = await Notification.requestPermission();

  $("notificationStatus").textContent =
    permission === "granted"
      ? "Notifications enabled ✓"
      : "Notification permission: " + permission;

  if (permission === "granted") {
    showToast("Notifications enabled ✦");
    checkReminders();
  }
}

function checkReminders() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const today = localDateString();
  const due = tasks.filter(task => task.due === today && task.status !== "done");

  if (due.length && lastReminderDate !== today) {
    new Notification("TaskFlow reminders", {
      body: due.length + " task(s) due today. Open your workspace to review."
    });

    lastReminderDate = today;
  }
}

function showReminders() {
  const due = tasks
    .filter(task => task.due && task.status !== "done")
    .sort((a, b) => a.due.localeCompare(b.due));

  if (!due.length) {
    showToast("No upcoming task reminders");
    return;
  }

  showToast(due.length + " task(s) have pending deadlines");
  goTo("tasks");
}

/* SETTINGS */
function toggleTheme() {
  document.body.classList.toggle("light");

  const light = document.body.classList.contains("light");
  $("themeToggle").classList.toggle("on", light);

  persist();
  showToast(light ? "Light theme enabled" : "Dark theme enabled");
}

function saveProfile() {
  const value = $("profileName").value.trim();

  if (!value) {
    showToast("Enter a profile name");
    return;
  }

  profile = value;
  $("avatar").textContent = value.charAt(0).toUpperCase();

  persist();
  showToast("Profile updated ✦");
}

function exportData() {
  const data = {
    tasks,
    notes,
    profile,
    exportedAt: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type:"application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "taskflow-backup.json";
  link.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast("Workspace backup downloaded");
}

function clearCompleted() {
  const count = tasks.filter(task => task.status === "done").length;

  if (!count) {
    showToast("No completed tasks to clear");
    return;
  }

  if (!confirm("Remove " + count + " completed tasks?")) return;

  tasks = tasks.filter(task => task.status !== "done");

  persist();
  renderAll();
  showToast("Completed tasks cleared");
}

/* WEEKLY CHART */
function renderChart() {
  const element = $("weeklyChart");
  element.innerHTML = "";

  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const values = [35,60,45,85,55,75,30];

  days.forEach((day, index) => {
    const column = document.createElement("div");
    column.className = "chart-col";

    const bar = document.createElement("i");
    bar.style.height = values[index] + "%";

    const label = document.createElement("small");
    label.textContent = day;

    column.append(bar, label);
    element.append(column);
  });
}

/* STREAK */
function updateStreak() {
  const streakKey = "taskflow-daily-streak";
  let data = {};

  try {
    data = JSON.parse(localStorage.getItem(streakKey) || "{}");
  } catch (error) {
    data = {};
  }

  const today = localDateString();

  if (data.lastDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayString = localDateString(yesterday);

    data.count = data.lastDate === yesterdayString
      ? (data.count || 0) + 1
      : 1;

    data.lastDate = today;
    localStorage.setItem(streakKey, JSON.stringify(data));
  }

  $("streakCount").textContent = data.count || 1;

  $("streakMessage").textContent =
    data.count > 1
      ? "Amazing! You're building a consistent routine."
      : "Start today. Come back tomorrow to build your streak.";
}

/* COMMAND CENTER */
function openCommandCenter() {
  $("commandOverlay").classList.add("open");
  $("commandSearch").value = "";
  filterCommands();
  setTimeout(() => $("commandSearch").focus(), 80);
}

function closeCommandCenter() {
  $("commandOverlay").classList.remove("open");
}

function filterCommands() {
  const query = $("commandSearch").value.toLowerCase();

  document.querySelectorAll(".command-item").forEach(item => {
    item.style.display =
      item.textContent.toLowerCase().includes(query) ? "flex" : "none";
  });
}

function runCommand(action) {
  closeCommandCenter();

  const actions = {
    task: () => openTaskModal(),
    board: () => goTo("board"),
    calendar: () => goTo("calendar"),
    focus: () => goTo("focus"),
    notes: () => goTo("notes"),
    theme: () => toggleTheme()
  };

  if (actions[action]) actions[action]();
}

$("commandSearch").addEventListener("input", filterCommands);

$("commandList").addEventListener("click", event => {
  const item = event.target.closest(".command-item");
  if (item) runCommand(item.dataset.action);
});

$("commandOverlay").addEventListener("click", event => {
  if (event.target.id === "commandOverlay") closeCommandCenter();
});

/* SCROLL PROGRESS */
function updateScrollProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;

  $("scrollProgress").style.width = progress + "%";
}

window.addEventListener("scroll", updateScrollProgress, {passive:true});

/* PARTICLES */
function createAmbientParticles() {
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < 17; i++) {
    const particle = document.createElement("span");
    particle.className = "ambient-particle";
    particle.style.left = Math.random() * 100 + "%";
    particle.style.setProperty("--duration", (12 + Math.random() * 16) + "s");
    particle.style.setProperty("--delay", (-Math.random() * 25) + "s");
    fragment.appendChild(particle);
  }

  document.body.appendChild(fragment);
}

/* REVEAL ANIMATION */
function observe() {
  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal").forEach(element => {
      element.classList.add("show");
    });
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
        observer.unobserve(entry.target);
      }
    });
  }, {threshold:0.1});

  document.querySelectorAll(".reveal").forEach(element => {
    observer.observe(element);
  });
}

/* NAVIGATION SCROLL TRACKING */
const navSections = [
  "home","tasks","board","calendar",
  "analytics","notes","focus","settings"
];

if ("IntersectionObserver" in window) {
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const link = document.querySelector(
          '.nav a[href="#' + entry.target.id + '"]'
        );

        if (link) activateNav(link);
      }
    });
  }, {rootMargin:"-25% 0px -65% 0px"});

  navSections.forEach(id => {
    const section = $(id);
    if (section) navObserver.observe(section);
  });
}

/* MODAL EVENTS */
$("taskModal").addEventListener("click", event => {
  if (event.target.id === "taskModal") closeTaskModal();
});

$("noteModal").addEventListener("click", event => {
  if (event.target.id === "noteModal") closeNoteModal();
});

/* KEYBOARD SHORTCUTS */
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeTaskModal();
    closeNoteModal();
    closeCommandCenter();
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openCommandCenter();
  }
});

/* RENDER ALL */
function renderAll() {
  renderTasks();
  renderBoard();
  renderCalendar();
  renderNotes();
}

/* INITIALIZE */
function initialize() {
  const today = new Date();

  $("today").textContent = today.toLocaleDateString("en-US", {
    month:"short",
    day:"numeric",
    year:"numeric"
  });

  $("profileName").value = profile;
  $("avatar").textContent = profile.charAt(0).toUpperCase();

  if (stored.theme === "light") {
    document.body.classList.add("light");
  }

  $("themeToggle").classList.toggle(
    "on",
    document.body.classList.contains("light")
  );

  renderAll();
  renderChart();
  timerDisplay();
  updateStreak();
  observe();
  updateScrollProgress();
  createAmbientParticles();

  if ("Notification" in window && Notification.permission === "granted") {
    $("notificationStatus").textContent = "Notifications enabled ✓";
    checkReminders();
  }
}

initialize();
