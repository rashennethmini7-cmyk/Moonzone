"use strict";

const SYNODIC_MONTH = 29.530588853;
const DAY_MS = 86400000;
const REFERENCE_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

const PHASES = [
  { name: "New Moon", max: 0.0339 },
  { name: "Waxing Crescent", max: 0.2161 },
  { name: "First Quarter", max: 0.2839 },
  { name: "Waxing Gibbous", max: 0.4661 },
  { name: "Full Moon", max: 0.5339 },
  { name: "Waning Gibbous", max: 0.7161 },
  { name: "Last Quarter", max: 0.7839 },
  { name: "Waning Crescent", max: 0.9661 },
  { name: "New Moon", max: 1 },
];

const KEY_PHASES = [
  { name: "New Moon", fraction: 0 },
  { name: "First Quarter", fraction: 0.25 },
  { name: "Full Moon", fraction: 0.5 },
  { name: "Last Quarter", fraction: 0.75 },
];

function getPhaseFraction(date) {
  const days = (date.getTime() - REFERENCE_NEW_MOON) / DAY_MS;
  const cycles = days / SYNODIC_MONTH;
  return cycles - Math.floor(cycles);
}

function getPhaseName(fraction) {
  return PHASES.find((phase) => fraction < phase.max).name;
}

function getIllumination(fraction) {
  return (1 - Math.cos(2 * Math.PI * fraction)) / 2;
}

function drawMoon(canvas, fraction) {
  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  const r = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;

  ctx.clearRect(0, 0, size, size);

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#1c2238";
  ctx.fill();

  const waxing = fraction < 0.5;
  const side = waxing ? 1 : -1;
  const terminator = side * Math.cos(2 * Math.PI * fraction);
  const steps = 90;

  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const y = -r + (2 * r * i) / steps;
    const x = side * Math.sqrt(r * r - y * y);
    i === 0 ? ctx.moveTo(cx + x, cy + y) : ctx.lineTo(cx + x, cy + y);
  }
  for (let i = steps; i >= 0; i--) {
    const y = -r + (2 * r * i) / steps;
    const x = terminator * Math.sqrt(r * r - y * y);
    ctx.lineTo(cx + x, cy + y);
  }
  ctx.closePath();

  const glow = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  glow.addColorStop(0, "#fbf6e9");
  glow.addColorStop(1, "#d9d2bf");
  ctx.fillStyle = glow;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function getUpcomingPhases(date) {
  const current = getPhaseFraction(date);
  return KEY_PHASES.map((phase) => {
    let delta = phase.fraction - current;
    if (delta <= 0) delta += 1;
    return {
      ...phase,
      date: new Date(date.getTime() + delta * SYNODIC_MONTH * DAY_MS),
    };
  }).sort((a, b) => a.date - b.date);
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
});

const longDateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

function toInputValue(date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function render(date, isToday) {
  const fraction = getPhaseFraction(date);
  const name = getPhaseName(fraction);
  const illumination = getIllumination(fraction);

  const moonCanvas = document.getElementById("moon");
  drawMoon(moonCanvas, fraction);
  moonCanvas.setAttribute(
    "aria-label",
    `${name}, ${Math.round(illumination * 100)} percent illuminated`
  );

  document.getElementById("date-label").textContent = isToday
    ? "Tonight"
    : longDateFormatter.format(date);
  document.getElementById("phase-name").textContent = name;
  document.getElementById("illumination").textContent = `${Math.round(illumination * 100)}%`;
  document.getElementById("age").textContent = `${(fraction * SYNODIC_MONTH).toFixed(1)} days`;
  document.getElementById("trend").textContent = fraction < 0.5 ? "Waxing" : "Waning";

  const list = document.getElementById("upcoming-list");
  list.replaceChildren(
    ...getUpcomingPhases(date).map((phase) => {
      const item = document.createElement("li");
      const icon = document.createElement("canvas");
      icon.width = 88;
      icon.height = 88;
      icon.setAttribute("aria-hidden", "true");
      drawMoon(icon, phase.fraction === 0 ? 0.001 : phase.fraction);

      const text = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = phase.name;
      const when = document.createElement("span");
      when.textContent = dateFormatter.format(phase.date);
      text.append(title, when);

      item.append(icon, text);
      return item;
    })
  );
}

function setupDatePicker() {
  const input = document.getElementById("date-input");
  const todayBtn = document.getElementById("today-btn");
  const form = document.getElementById("date-form");

  input.value = toInputValue(new Date());

  input.addEventListener("change", () => {
    if (!input.value) return;
    const [year, month, day] = input.value.split("-").map(Number);
    const picked = new Date(year, month - 1, day, 21);
    const isToday = input.value === toInputValue(new Date());
    render(isToday ? new Date() : picked, isToday);
  });

  todayBtn.addEventListener("click", () => {
    input.value = toInputValue(new Date());
    render(new Date(), true);
  });

  form.addEventListener("submit", (event) => event.preventDefault());
}

function setupStarfield() {
  const canvas = document.getElementById("stars");
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let stars = [];

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.round((window.innerWidth * window.innerHeight) / 4000);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.2 + 0.2,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.002 + 0.0005,
    }));
  }

  function draw(time) {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const star of stars) {
      const alpha = reduceMotion ? 0.7 : 0.35 + 0.55 * Math.abs(Math.sin(star.phase + time * star.speed));
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    }
    if (!reduceMotion) requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", () => {
    resize();
    if (reduceMotion) draw(0);
  });
  reduceMotion ? draw(0) : requestAnimationFrame(draw);
}

render(new Date(), true);
setupDatePicker();
setupStarfield();
