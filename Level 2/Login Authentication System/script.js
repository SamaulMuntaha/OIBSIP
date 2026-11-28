
document.addEventListener("DOMContentLoaded", () => {
  const USERS_KEY = "taskflow_users_v3";
  const SESSION_KEY = "taskflow_session_v3";

  const readJSON = (key, fallback = []) => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  };

  const showMessage = (element, message, success = false) => {
    if (!element) return;
    element.textContent = message;
    element.classList.toggle("success", success);
  };

  // REGISTER
  const registerForm = document.getElementById("registerForm");

  if (registerForm) {
    registerForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const username = document.getElementById("regUsername").value.trim();
      const email = document.getElementById("regEmail").value.trim().toLowerCase();
      const password = document.getElementById("regPassword").value;
      const confirmPassword = document.getElementById("regConfirm").value;
      const message = document.getElementById("registerMessage");

      if (username.length < 3) {
        showMessage(message, "Username must contain at least 3 characters.");
        return;
      }

      if (password.length < 8 || !/\d/.test(password)) {
        showMessage(message, "Password needs at least 8 characters and 1 number.");
        return;
      }

      if (password !== confirmPassword) {
        showMessage(message, "Your passwords do not match.");
        return;
      }

      const users = readJSON(USERS_KEY);
      const duplicate = users.some(user =>
        user.username.toLowerCase() === username.toLowerCase() ||
        user.email.toLowerCase() === email
      );

      if (duplicate) {
        showMessage(message, "This username or email is already registered.");
        return;
      }

      users.push({
        username,
        email,
        password,
        createdAt: new Date().toISOString()
      });

      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      showMessage(message, "Account created successfully! Redirecting...", true);
      registerForm.reset();

      setTimeout(() => {
        window.location.href = "login.html";
      }, 900);
    });
  }

  // LOGIN
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const identity = document.getElementById("loginIdentity").value.trim().toLowerCase();
      const password = document.getElementById("loginPassword").value;
      const message = document.getElementById("loginMessage");

      const users = readJSON(USERS_KEY);
      const matchedUser = users.find(user =>
        (
          user.username.toLowerCase() === identity ||
          user.email.toLowerCase() === identity
        ) && user.password === password
      );

      if (!matchedUser) {
        showMessage(message, "Incorrect username/email or password.");
        return;
      }

      localStorage.setItem(SESSION_KEY, JSON.stringify({
        username: matchedUser.username,
        email: matchedUser.email
      }));

      showMessage(message, "Welcome back! Opening your workspace...", true);

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 650);
    });
  }

  // DASHBOARD ACCESS PROTECTION
  const dashboard = document.querySelector(".dashboard-body");

  if (dashboard) {
    const session = readJSON(SESSION_KEY, null);
    const users = readJSON(USERS_KEY);

    const currentUser = session
      ? users.find(user =>
          user.username === session.username &&
          user.email === session.email
        )
      : null;

    if (!currentUser) {
      localStorage.removeItem(SESSION_KEY);
      window.location.replace("login.html");
      return;
    }

    const username = currentUser.username;
    const profileName = document.getElementById("profileName");

    profileName.textContent = username.toUpperCase();

    const today = new Date();
    document.getElementById("todayDate").textContent =
      today.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }).toUpperCase();

    // USER-SPECIFIC TASK STORAGE
    const TASK_KEY = "taskflow_tasks_v3_" + currentUser.username;

    const getTasks = () => readJSON(TASK_KEY);

    const saveTasks = (tasks) => {
      localStorage.setItem(TASK_KEY, JSON.stringify(tasks));
    };

    const taskList = document.getElementById("taskList");
    const taskForm = document.getElementById("taskForm");
    const taskInput = document.getElementById("taskInput");

    const renderTasks = () => {
      const tasks = getTasks();
      const completed = tasks.filter(task => task.done).length;
      const pending = tasks.length - completed;
      const percent = tasks.length
        ? Math.round((completed / tasks.length) * 100)
        : 0;

      document.getElementById("totalTasks").textContent = tasks.length;
      document.getElementById("completedTasks").textContent = completed;
      document.getElementById("pendingTasks").textContent = pending;
      document.getElementById("progressPercent").textContent = percent + "%";
      document.getElementById("taskCount").textContent =
        tasks.length + (tasks.length === 1 ? " TASK" : " TASKS");

      if (tasks.length === 0) {
        taskList.innerHTML = `
          <div class="command-empty">
            <span>✳</span>
            <b>Nothing on the board yet.</b>
            <p>Add your first task above and get moving.</p>
          </div>
        `;
        return;
      }

      taskList.innerHTML = "";

      tasks.forEach(task => {
        const row = document.createElement("div");
        row.className = "command-task-item" + (task.done ? " done" : "");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.done;
        checkbox.setAttribute("aria-label", "Complete task");

        const title = document.createElement("span");
        title.className = "task-name";
        title.textContent = task.title;

        const status = document.createElement("span");
        status.className = "task-state";
        status.textContent = task.done ? "DONE" : "ACTIVE";

        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "×";
        remove.setAttribute("aria-label", "Delete task");

        checkbox.addEventListener("change", () => {
          const updated = getTasks().map(item =>
            item.id === task.id
              ? { ...item, done: checkbox.checked }
              : item
          );

          saveTasks(updated);
          renderTasks();
        });

        remove.addEventListener("click", () => {
          const updated = getTasks().filter(item => item.id !== task.id);
          saveTasks(updated);
          renderTasks();
        });

        row.append(checkbox, title, status, remove);
        taskList.appendChild(row);
      });
    };

    taskForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const title = taskInput.value.trim();
      if (!title) return;

      const tasks = getTasks();

      tasks.unshift({
        id: Date.now().toString() + Math.random().toString(16).slice(2),
        title,
        done: false
      });

      saveTasks(tasks);
      taskInput.value = "";
      renderTasks();
    });

    document.getElementById("logoutBtn").addEventListener("click", () => {
      localStorage.removeItem(SESSION_KEY);
      window.location.replace("login.html");
    });

    renderTasks();
  }
});
