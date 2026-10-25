const products = [
  {
    id: "night-shift-hoodie",
    name: "Night Shift Hoodie",
    category: "tops",
    price: 120,
    image: "images/hoodie.png",
    alt: "Washed black hoodie with a small embroidered crescent moon",
    description:
      "400gsm brushed fleece, dropped shoulders and an embroidered crescent on the chest. Garment dyed washed black.",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "phase-tee",
    name: "Phase Tee",
    category: "tops",
    price: 55,
    image: "images/tee.png",
    alt: "Boxy bone white t-shirt with a moon phase print on the back",
    description:
      "Boxy 240gsm cotton tee in bone with a moon phase print across the back.",
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: "orbit-cargo",
    name: "Orbit Cargo",
    category: "bottoms",
    price: 140,
    image: "images/cargo.png",
    alt: "Slate grey relaxed fit nylon cargo pants",
    description:
      "Relaxed nylon cargos in slate with articulated knees, six pockets and adjustable cuffs.",
    sizes: ["28", "30", "32", "34", "36"],
  },
];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

// Header: solid background once the hero is scrolled past
const header = document.querySelector(".site-header");
const updateHeader = () =>
  header.classList.toggle("is-scrolled", window.scrollY > 40);
window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

// Mobile nav
const navToggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("site-nav");

navToggle.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(open));
  header.classList.add("is-scrolled");
});

nav.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }
});

// Product grid
const grid = document.getElementById("product-grid");

function renderProducts(filter = "all") {
  const visible = products.filter(
    (p) => filter === "all" || p.category === filter
  );

  grid.innerHTML = visible
    .map(
      (p) => `
      <li class="product-card reveal">
        <button type="button" data-id="${p.id}" aria-label="View ${p.name}">
          <div class="product-media">
            <img src="${p.image}" alt="${p.alt}" loading="lazy" />
          </div>
          <div class="product-meta">
            <div>
              <p class="product-name">${p.name}</p>
              <p class="product-tag">${p.category === "tops" ? "Top" : "Bottom"}</p>
            </div>
            <span>${currency.format(p.price)}</span>
          </div>
        </button>
      </li>`
    )
    .join("");

  grid.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
}

document.querySelectorAll(".filter").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach((b) => {
      const active = b === btn;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    renderProducts(btn.dataset.filter);
  });
});

// Quick view dialog
const dialog = document.getElementById("quick-view");
const qv = {
  image: document.getElementById("qv-image"),
  category: document.getElementById("qv-category"),
  title: document.getElementById("qv-title"),
  price: document.getElementById("qv-price"),
  desc: document.getElementById("qv-desc"),
  sizes: document.getElementById("qv-sizes"),
  status: document.getElementById("qv-status"),
};

function openQuickView(product) {
  qv.image.src = product.image;
  qv.image.alt = product.alt;
  qv.category.textContent = product.category === "tops" ? "Tops" : "Bottoms";
  qv.title.textContent = product.name;
  qv.price.textContent = currency.format(product.price);
  qv.desc.textContent = product.description;
  qv.status.textContent = "Select a size to check availability.";
  qv.sizes.innerHTML = product.sizes
    .map((s) => `<button type="button" aria-pressed="false">${s}</button>`)
    .join("");
  dialog.showModal();
}

qv.sizes.addEventListener("click", (event) => {
  const btn = event.target.closest("button");
  if (!btn) return;
  qv.sizes
    .querySelectorAll("button")
    .forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
  qv.status.textContent = `Size ${btn.textContent} is available in Drop 01.`;
});

grid.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-id]");
  if (!btn) return;
  const product = products.find((p) => p.id === btn.dataset.id);
  if (product) openQuickView(product);
});

document.getElementById("qv-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

// Next drop countdown: drops go live on the next full moon
const SYNODIC_MONTH_MS = 29.530588853 * 86400000;
const KNOWN_FULL_MOON = Date.UTC(2000, 0, 21, 4, 40);

function nextFullMoon(from = Date.now()) {
  const cycles = Math.ceil((from - KNOWN_FULL_MOON) / SYNODIC_MONTH_MS);
  return new Date(KNOWN_FULL_MOON + cycles * SYNODIC_MONTH_MS);
}

const dropDate = nextFullMoon();
document.getElementById("drop-date").textContent = `Full moon \u2014 ${dropDate.toLocaleDateString(
  undefined,
  { weekday: "long", month: "long", day: "numeric" }
)}`;

const cd = {
  days: document.getElementById("cd-days"),
  hours: document.getElementById("cd-hours"),
  mins: document.getElementById("cd-mins"),
  secs: document.getElementById("cd-secs"),
};
const pad = (n) => String(n).padStart(2, "0");

function tick() {
  const diff = Math.max(0, dropDate - Date.now());
  const s = Math.floor(diff / 1000);
  cd.days.textContent = pad(Math.floor(s / 86400));
  cd.hours.textContent = pad(Math.floor((s % 86400) / 3600));
  cd.mins.textContent = pad(Math.floor((s % 3600) / 60));
  cd.secs.textContent = pad(s % 60);
}
tick();
setInterval(tick, 1000);

// Reveal on scroll
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

document.getElementById("year").textContent = new Date().getFullYear();
renderProducts();
