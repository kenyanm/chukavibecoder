// ============================================================
// Chuka Vibecoders — app.js
// Handles: registration form submission (to Google Apps Script),
// PWA install prompt, service worker registration, small UI bits.
// ============================================================

// -----------------------------------------------------------
// 1. CONFIG — paste your deployed Google Apps Script Web App URL here.
//    See apps-script/Code.gs and README.md for setup instructions.
// -----------------------------------------------------------
const CONFIG = {
  SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwMquZuHeVcqMwKYW1kUCNkEr1v48DnkrheAYlhXuNmi2Gybnadetu2etrvbXVLUDrnPw/exec",
};

// -----------------------------------------------------------
// Footer year
// -----------------------------------------------------------
document.getElementById("year").textContent = new Date().getFullYear();

// -----------------------------------------------------------
// Registration form
// -----------------------------------------------------------
const form = document.getElementById("reg-form");
const submitBtn = document.getElementById("submit-btn");
const statusEl = document.getElementById("form-status");
const toast = document.getElementById("toast");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3200);
}

function setFieldError(name, message) {
  const el = form.querySelector(`[data-error-for="${name}"]`);
  if (el) el.textContent = message || "";
}

function clearErrors() {
  form.querySelectorAll(".field-error").forEach((el) => (el.textContent = ""));
}

function validate(data) {
  let valid = true;
  clearErrors();

  if (!data.name.trim()) {
    setFieldError("name", "Enter your full name.");
    valid = false;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    setFieldError("email", "Enter a valid email address.");
    valid = false;
  }
  if (!data.regNumber.trim()) {
    setFieldError("regNumber", "Enter your registration number.");
    valid = false;
  }
  if (!data.course.trim()) {
    setFieldError("course", "Enter your course or programme.");
    valid = false;
  }
  if (!/^[0-9+\s-]{7,15}$/.test(data.phone.trim())) {
    setFieldError("phone", "Enter a valid phone number.");
    valid = false;
  }
  return valid;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.textContent = "";
  statusEl.className = "form-status";

  const data = {
    name: form.name.value,
    email: form.email.value,
    regNumber: form.regNumber.value,
    course: form.course.value,
    phone: form.phone.value,
  };

  if (!validate(data)) return;

  if (CONFIG.SCRIPT_URL.includes("PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE")) {
    statusEl.textContent = "Setup needed: add your Google Apps Script URL in app.js (see README.md).";
    statusEl.classList.add("error");
    return;
  }

  submitBtn.classList.add("loading");
  submitBtn.disabled = true;

  try {
    const res = await fetch(CONFIG.SCRIPT_URL, {
      method: "POST",
      // text/plain avoids a CORS preflight so Apps Script can respond directly
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (result.result === "success") {
      form.reset();
      statusEl.textContent = "You're in! Check your email for what's next.";
      statusEl.classList.add("success");
      showToast("Registered — welcome to the community 🎉");
    } else if (result.result === "duplicate") {
      statusEl.textContent = "This email or registration number is already registered.";
      statusEl.classList.add("error");
    } else {
      throw new Error(result.message || "Unknown error");
    }
  } catch (err) {
    statusEl.textContent = "Something went wrong. Please try again in a moment.";
    statusEl.classList.add("error");
  } finally {
    submitBtn.classList.remove("loading");
    submitBtn.disabled = false;
  }
});

// -----------------------------------------------------------
// Live member count (optional — reads from the same Apps Script via GET)
// -----------------------------------------------------------
const statMembers = document.getElementById("stat-members");
if (CONFIG.SCRIPT_URL && !CONFIG.SCRIPT_URL.includes("PASTE_YOUR")) {
  fetch(`${CONFIG.SCRIPT_URL}?action=count`)
    .then((r) => r.json())
    .then((d) => {
      if (typeof d.count === "number") statMembers.textContent = d.count;
    })
    .catch(() => {
      statMembers.textContent = "50+";
    });
} else {
  statMembers.textContent = "50+";
}

// -----------------------------------------------------------
// PWA: service worker registration
// -----------------------------------------------------------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}

// -----------------------------------------------------------
// PWA: install prompt
// -----------------------------------------------------------
let deferredPrompt = null;
const installBtn = document.getElementById("install-btn");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});

installBtn?.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});

window.addEventListener("appinstalled", () => {
  installBtn.hidden = true;
  showToast("App installed — find it on your home screen.");
});
