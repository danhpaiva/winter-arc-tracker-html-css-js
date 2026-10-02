(() => {
  "use strict";

  const STORAGE_KEY = "winterArcData";

  const PILLARS = [
    { key: "fitness", label: "Fitness", color: "#ff6b35" },
    { key: "mente", label: "Mente", color: "#ffd60a" },
    { key: "produtividade", label: "Produtividade", color: "#2ecc71" },
    { key: "habitos", label: "Hábitos Diários", color: "#9b59b6" },
  ];

  // ---------- Date helpers ----------

  function toDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  }

  function getArcRange(today) {
    const y = today.getFullYear();
    const m = today.getMonth(); // Oct = 9, Jan = 0
    let startYear;
    if (m >= 9) startYear = y;
    else if (m === 0) startYear = y - 1;
    else startYear = y;
    const start = new Date(startYear, 9, 1);
    const end = new Date(startYear + 1, 0, 1);
    return { start, end };
  }

  const today = startOfDay(new Date());
  const { start: arcStart, end: arcEnd } = getArcRange(today);
  const todayKey = toDateKey(today);

  const arcDays = [];
  for (let d = new Date(arcStart); d <= arcEnd; d = addDays(d, 1)) {
    arcDays.push(new Date(d));
  }

  // ---------- Storage ----------

  let storageAvailable = true;

  function loadData() {
    const empty = {};
    PILLARS.forEach((p) => (empty[p.key] = []));
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return empty;
      const parsed = JSON.parse(raw);
      PILLARS.forEach((p) => {
        if (!Array.isArray(parsed[p.key])) parsed[p.key] = [];
      });
      return parsed;
    } catch (e) {
      storageAvailable = false;
      return empty;
    }
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      storageAvailable = false;
      showToast("Não foi possível salvar: armazenamento local indisponível ou cheio.");
    }
  }

  let data = loadData();
  if (!storageAvailable) {
    showToast("Armazenamento local indisponível. Seu progresso não será salvo.");
  }

  // ---------- Data access ----------

  function isCompleted(pillarKey, dateKey) {
    return data[pillarKey].some((e) => e.date === dateKey && e.completed);
  }

  function setCompleted(pillarKey, dateKey, completed) {
    const list = data[pillarKey];
    const idx = list.findIndex((e) => e.date === dateKey);
    if (idx >= 0) {
      list[idx].completed = completed;
    } else {
      list.push({ date: dateKey, completed });
    }
    saveData();
  }

  function isFutureKey(dateKey) {
    return dateKey > todayKey;
  }

  function computeStreak(pillarKey) {
    let streak = 0;
    for (let i = arcDays.length - 1; i >= 0; i--) {
      const key = toDateKey(arcDays[i]);
      if (key > todayKey) continue; // skip future days
      if (isCompleted(pillarKey, key)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  // ---------- Toast ----------

  let toastTimer = null;
  function showToast(message) {
    const el = document.getElementById("toast");
    el.textContent = message;
    el.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("visible"), 3500);
  }

  // ---------- Render: countdown ----------

  function renderCountdown() {
    const labelEl = document.getElementById("countdownLabel");
    const numberEl = document.getElementById("countdownNumber");
    const subEl = document.getElementById("countdownSub");
    const totalDays = arcDays.length;
    const msPerDay = 86400000;

    labelEl.textContent = `Winter Arc ${arcStart.getFullYear()}/${arcEnd.getFullYear()}`;

    if (today < arcStart) {
      const daysUntilStart = Math.round((arcStart - today) / msPerDay);
      numberEl.textContent = daysUntilStart;
      subEl.textContent = `dias até o início do Winter Arc`;
      return;
    }

    if (today > arcEnd) {
      numberEl.textContent = "0";
      subEl.textContent = "Winter Arc concluído";
      return;
    }

    const daysRemaining = Math.round((arcEnd - today) / msPerDay);
    const dayIndex = Math.round((today - arcStart) / msPerDay) + 1;
    numberEl.textContent = daysRemaining;
    subEl.textContent = `dias restantes · Dia ${dayIndex} de ${totalDays}`;
  }

  // ---------- Render: pillar cards ----------

  function renderPillars() {
    const grid = document.getElementById("pillarsGrid");
    grid.innerHTML = "";

    PILLARS.forEach((pillar) => {
      const completedToday = isCompleted(pillar.key, todayKey);
      const streak = computeStreak(pillar.key);

      const card = document.createElement("div");
      card.className = "pillar-card" + (completedToday ? " completed" : "");
      card.dataset.pillar = pillar.key;
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute(
        "aria-label",
        `${pillar.label}: ${completedToday ? "completo" : "incompleto"} hoje, streak de ${streak} dias`
      );

      card.innerHTML = `
        <div class="pillar-top">
          <span class="pillar-name">${pillar.label}</span>
          <span class="pillar-status">${completedToday ? "✓" : "✗"}</span>
        </div>
        <div>
          <div class="pillar-streak">${streak}</div>
          <div class="pillar-streak-label">dias seguidos</div>
        </div>
      `;

      card.addEventListener("click", () => togglePillarToday(pillar.key, card));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          togglePillarToday(pillar.key, card);
        }
      });

      grid.appendChild(card);
    });
  }

  function togglePillarToday(pillarKey, cardEl) {
    const current = isCompleted(pillarKey, todayKey);
    setCompleted(pillarKey, todayKey, !current);
    renderPillars();
    renderHeatmap();
    renderStats();

    if (!current) {
      const newCard = document.querySelector(`.pillar-card[data-pillar="${pillarKey}"]`);
      if (newCard) {
        newCard.classList.add("pulse");
        setTimeout(() => newCard.classList.remove("pulse"), 400);
      }
    }
  }

  // ---------- Render: heatmap ----------

  const tooltipEl = () => document.getElementById("heatmapTooltip");

  function renderHeatmapLegend() {
    const legend = document.getElementById("heatmapLegend");
    legend.innerHTML = PILLARS.map(
      (p) => `<span><span class="swatch" style="background:${p.color}"></span>${p.label}</span>`
    ).join("");
  }

  function renderHeatmap() {
    const grid = document.getElementById("heatmapGrid");
    grid.innerHTML = "";

    arcDays.forEach((day) => {
      const key = toDateKey(day);
      const future = isFutureKey(key);
      const completedPillars = PILLARS.filter((p) => isCompleted(p.key, key));

      const cell = document.createElement("div");
      cell.className = "heatmap-day" + (future ? " future" : "");

      if (!future && completedPillars.length > 0) {
        if (completedPillars.length === 1) {
          cell.style.background = completedPillars[0].color;
        } else {
          const stops = completedPillars
            .map((p, i) => {
              const pct1 = (i / completedPillars.length) * 100;
              const pct2 = ((i + 1) / completedPillars.length) * 100;
              return `${p.color} ${pct1}%, ${p.color} ${pct2}%`;
            })
            .join(", ");
          cell.style.background = `linear-gradient(135deg, ${stops})`;
        }
      }

      cell.addEventListener("mouseenter", (e) => {
        const tip = tooltipEl();
        const names = completedPillars.length
          ? completedPillars.map((p) => p.label).join(", ")
          : "nenhum pilar completo";
        tip.textContent = `${key} — ${names}`;
        tip.classList.add("visible");
      });
      cell.addEventListener("mousemove", (e) => {
        const tip = tooltipEl();
        tip.style.left = e.clientX + 14 + "px";
        tip.style.top = e.clientY + 14 + "px";
      });
      cell.addEventListener("mouseleave", () => {
        tooltipEl().classList.remove("visible");
      });

      grid.appendChild(cell);
    });
  }

  // ---------- Render: stats ----------

  function renderStats() {
    const elapsedDays = arcDays.filter((d) => toDateKey(d) <= todayKey);
    const elapsedCount = Math.max(elapsedDays.length, 1);

    let totalCompleted = 0;
    let bestPillar = null;
    let bestStreak = -1;
    let overallPercentSum = 0;

    PILLARS.forEach((pillar) => {
      const completedCount = elapsedDays.filter((d) => isCompleted(pillar.key, toDateKey(d))).length;
      totalCompleted += completedCount;
      overallPercentSum += completedCount / elapsedCount;

      const streak = computeStreak(pillar.key);
      if (streak > bestStreak) {
        bestStreak = streak;
        bestPillar = pillar;
      }
    });

    const overallPercent = Math.round((overallPercentSum / PILLARS.length) * 100);

    document.getElementById("statOverall").textContent = `${overallPercent}%`;
    document.getElementById("statBestPillar").textContent =
      bestPillar && bestStreak > 0 ? `${bestPillar.label} (${bestStreak})` : "-";
    document.getElementById("statTotalDays").textContent = totalCompleted;
  }

  // ---------- Init ----------

  function init() {
    renderCountdown();
    renderPillars();
    renderHeatmapLegend();
    renderHeatmap();
    renderStats();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
