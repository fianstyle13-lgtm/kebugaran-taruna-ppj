const pageContent = document.getElementById("pageContent");
const breadcrumbCurrent = document.getElementById("breadcrumbCurrent");
const userAvatar = document.getElementById("userAvatar");
const sidebar = document.getElementById("sidebar");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
const appShell = document.querySelector(".app-shell");


let currentRole = "taruna";
let currentPage = "dashboard";

const pageNames = {
  dashboard: "Dashboard",
  jadwal: "Jadwal Latihan",
  hasil: "Hasil Latihan",
  bidang: "Bidang Kebugaran",
  rekomendasi: "Rekomendasi",
  progres: "Progres Kebugaran",
  taruna: "Data Taruna"
};

const categories = [
  { icon: "🏃", name: "Lari", description: "Melatih daya tahan jantung dan paru-paru." },
  { icon: "💪", name: "Push-up", description: "Melatih kekuatan otot dada, bahu, dan lengan." },
  { icon: "↕", name: "Sit-up", description: "Melatih kekuatan dan daya tahan otot perut." },
  { icon: "⬆", name: "Pull-up", description: "Melatih kekuatan punggung dan lengan." },
  { icon: "🏊", name: "Renang", description: "Melatih daya tahan dan koordinasi tubuh." },
  { icon: "⚡", name: "Shuttle run", description: "Melatih kecepatan dan perubahan arah." },
  { icon: "🎯", name: "Kelincahan", description: "Melatih koordinasi, keseimbangan, dan respons." },
  { icon: "🧘", name: "Kelenturan", description: "Mendukung rentang gerak dan mobilitas tubuh." },
  { icon: "🏋", name: "Angkat beban", description: "Melatih kekuatan otot secara bertahap." }
];

function getTodayLabel() {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());
}

function dashboardTemplate() {
  const isAdmin = currentRole === "admin";
  const profile = currentProfile || (window.AeroFitAuth && window.AeroFitAuth.getProfile ? window.AeroFitAuth.getProfile() : null);
  const readCache = key => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch { return []; }
  };
  const schedules = readCache("aerofit_schedules_v1");
  const results = readCache("aerofit_results_v1");
  const recommendations = readCache("aerofit_coach_recommendations_v1");
  const targets = readCache("aerofit_targets_v1");
  const profiles = window.AeroFitCloud ? window.AeroFitCloud.getProfiles() : [];
  const currentName = profile ? profile.displayName : "";
  const currentUid = profile ? profile.uid : "";

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  const mondayOffset = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - mondayOffset);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const inThisWeek = dateText => {
    if (!dateText) return false;
    const [year, month, day] = dateText.split("-").map(Number);
    const date = new Date(year, month - 1, day, 12);
    return date >= weekStart && date < weekEnd;
  };

  const myResults = isAdmin ? results : results.filter(item =>
    item.ownerUid === currentUid || item.athleteName === currentName
  );
  const myTargets = isAdmin ? targets : targets.filter(item =>
    item.athleteUid === currentUid || item.athleteName === currentName
  );
  const weekSchedules = schedules.filter(item => inThisWeek(item.date));
  const stats = isAdmin
    ? [
        ["Total Taruna", String(profiles.filter(item => item.role === "taruna").length), "Akun taruna terdaftar", "♙"],
        ["Sesi Minggu Ini", String(weekSchedules.length), "Jadwal pada minggu berjalan", "▣"],
        ["Hasil Tes Tercatat", String(results.length), "Seluruh hasil yang tersimpan", "✓"],
        ["Program Pelatih", String(recommendations.length), "Rekomendasi tersimpan", "✦"]
      ]
    : [
        ["Jadwal Minggu Ini", String(weekSchedules.length), "Agenda pada minggu berjalan", "▣"],
        ["Hasil Tes Tercatat", String(myResults.length), "Hasil pada akun ini", "✓"],
        ["Bidang Tercatat", String(new Set(myResults.map(item => item.category)).size), "Bidang dengan hasil tes", "↗"],
        ["Target Kebugaran", String(myTargets.length), "Target dari pelatih", "◎"]
      ];

  const greeting = isAdmin ? "Panel Pengelolaan Kebugaran" : `Selamat datang, ${currentName || "Taruna"}!`;
  const description = isAdmin
    ? "Pantau akun taruna, jadwal, hasil tes, dan program latihan dari satu tempat."
    : "Jaga konsistensi latihan. Pantau jadwal, hasil tes, dan target kebugaran akun pribadi.";

  return `
    <div class="welcome-row">
      <div>
        <p class="eyebrow">AEROFIT · FITNESS OVERVIEW</p>
        <h1 class="page-title">${greeting}</h1>
        <p class="welcome-description">${description}</p>
      </div>
      <div class="date-chip"><span>◷</span><span>${getTodayLabel()}</span></div>
    </div>

    <div class="demo-note">
      <span>ⓘ</span>
      <div><strong>Data tersinkronisasi:</strong> ringkasan dashboard diambil dari akun, jadwal, hasil tes, dan rekomendasi yang tersimpan di Firebase. Grafik menampilkan jumlah jadwal latihan per hari.</div>
    </div>

    <div class="stats-grid">
      ${stats.map(([label, value, foot, icon]) => `
        <article class="stat-card">
          <div class="stat-top">
            <span class="stat-label">${label}</span>
            <span class="stat-icon">${icon}</span>
          </div>
          <div class="stat-value">${value}</div>
          <div class="stat-foot">${foot}</div>
        </article>
      `).join("")}
    </div>

    <div class="dashboard-grid">
      <section class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">${isAdmin ? "Agenda Latihan Terjadwal" : "Jadwal Latihan Berikutnya"}</h2>
            <p class="panel-subtitle">Agenda yang tersimpan di database</p>
          </div>
          <button class="text-link" data-go="jadwal">Lihat semua →</button>
        </div>
        <div class="schedule-list">
          ${window.JadwalApp ? window.JadwalApp.dashboardPreview() : ""}
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Aktivitas Mingguan</h2>
            <p class="panel-subtitle">Jumlah jadwal latihan pada minggu berjalan</p>
          </div>
          <span class="status-pill">Minggu ini</span>
        </div>
        <div class="chart-area" role="img" aria-label="Grafik jumlah jadwal latihan dari Senin sampai Minggu">
          ${(() => {
            const labels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
            const counts = labels.map((label, dayIndex) => {
              const dayDate = new Date(weekStart);
              dayDate.setDate(weekStart.getDate() + ((dayIndex + 6) % 7));
              const key = `${dayDate.getFullYear()}-${String(dayDate.getMonth()+1).padStart(2,"0")}-${String(dayDate.getDate()).padStart(2,"0")}`;
              return schedules.filter(item => item.date === key).length;
            });
            const maxCount = Math.max(1, ...counts);
            return counts.map((count, index) => {
              const height = count ? Math.max(12, (count / maxCount) * 100) : 4;
              return [labels[index], height, count];
            });
          })().map(([day, height, count], index) => `
            <div class="chart-column">
              <div class="chart-bar-wrap"><div class="chart-bar ${index === (new Date().getDay()) ? "current" : ""}" style="height:${height}%" title="${count} jadwal"></div></div>
              <span class="chart-day">${day}</span>
            </div>
          `).join("")}
        </div>
        <div class="chart-legend"><span class="legend-dot"></span> Jumlah jadwal latihan tersimpan</div>
      </section>
    </div>

    <div class="section-heading">
      <div>
        <h2>Bidang Kebugaran</h2>
        <p>Pilih bidang latihan untuk melihat fokus kemampuan fisik.</p>
      </div>
      <button class="text-link" data-go="bidang">Lihat semua →</button>
    </div>
    <div class="category-grid">
      ${categories.map(item => `
        <article class="category-card">
          <div class="category-icon">${item.icon}</div>
          <div><h3>${item.name}</h3><p>${item.description}</p></div>
        </article>
      `).join("")}
    </div>
  `;
}

const placeholderPages = {
  bidang: {
    eyebrow: "FITNESS CATEGORIES",
    title: "Bidang Kebugaran",
    description: "Sembilan bidang latihan disiapkan untuk membantu pengembangan kemampuan fisik taruna.",
    cards: [
      ["Daya tahan", "Lari dan renang untuk mendukung kemampuan aerobik dan ketahanan fisik."],
      ["Kekuatan", "Push-up, sit-up, pull-up, dan angkat beban dengan peningkatan beban bertahap."],
      ["Kecepatan & koordinasi", "Shuttle run dan latihan kelincahan untuk melatih perubahan arah dan respons."],
      ["Mobilitas", "Latihan kelenturan untuk membantu rentang gerak dan persiapan pemulihan."]
    ],
    emptyTitle: "Detail program latihan menyusul",
    emptyText: "Setiap bidang nantinya memiliki panduan, durasi, tingkat kesulitan, target, dan catatan keselamatan latihan."
  },
  rekomendasi: {
    eyebrow: "PERSONAL TRAINING PLAN",
    title: "Rekomendasi Latihan",
    description: "Program latihan dirancang berdasarkan hasil tes, riwayat latihan, dan masukan pelatih.",
    cards: [
      ["Rekomendasi sistem", "Sistem akan membaca hasil latihan dan membandingkannya dengan target untuk menyarankan latihan berikutnya."],
      ["Rekomendasi pelatih", "Pelatih dapat menambahkan, mengubah, atau menyetujui program latihan sesuai kondisi taruna."]
    ],
    emptyTitle: "Mesin rekomendasi belum diaktifkan",
    emptyText: "Fitur ini akan dikembangkan setelah data hasil latihan dan jadwal tersedia agar rekomendasi tidak dibuat secara asal."
  },
  progres: {
    eyebrow: "PERFORMANCE TRACKING",
    title: "Progres Kebugaran",
    description: "Lihat perubahan performa dari waktu ke waktu melalui catatan latihan dan hasil evaluasi.",
    cards: [
      ["Riwayat hasil latihan", "Catatan waktu lari, jumlah repetisi, durasi renang, dan hasil tes bidang lainnya."],
      ["Grafik perkembangan", "Perbandingan hasil awal, hasil terbaru, dan target yang ingin dicapai."]
    ],
    emptyTitle: "Pemantauan progres menyusul",
    emptyText: "Grafik perkembangan akan menggunakan data hasil latihan yang dimasukkan secara berkala, bukan angka ilustrasi."
  },
  taruna: {
    eyebrow: "CADET MANAGEMENT",
    title: "Data Taruna",
    description: "Area pengelolaan profil taruna untuk admin/pelatih dan informasi akun untuk taruna.",
    cards: [
      ["Profil taruna", "Data identitas internal, kelas atau angkatan, dan informasi kebugaran yang diperlukan."],
      ["Hak akses", "Admin/pelatih dan taruna akan memiliki tampilan serta kewenangan yang berbeda."]
    ],
    emptyTitle: "Pengelolaan akun belum tersedia",
    emptyText: "Fitur akun, login, hak akses, dan database akan ditambahkan setelah fondasi tampilan selesai."
  }
};

function placeholderTemplate(pageKey) {
  const page = placeholderPages[pageKey];
  return `
    <div class="page-intro">
      <p class="eyebrow">${page.eyebrow}</p>
      <h1 class="page-title">${page.title}</h1>
      <p class="welcome-description">${page.description}</p>
    </div>
    <div class="placeholder-grid">
      ${page.cards.map(([title, description]) => `
        <article class="placeholder-card">
          <h3>${title}</h3>
          <p>${description}</p>
          <span class="coming-soon">RENCANA FITUR</span>
        </article>
      `).join("")}
    </div>
    <div class="empty-state">
      <div class="empty-icon">✦</div>
      <h3>${page.emptyTitle}</h3>
      <p>${page.emptyText}</p>
    </div>
  `;
}


function dataTarunaTemplate() {
  const profile = window.AeroFitAuth ? window.AeroFitAuth.getProfile() : null;
  const isStaff = currentRole === "admin";
  if (!isStaff) {
    return `
      <div class="page-intro">
        <p class="eyebrow">MY ACCOUNT</p>
        <h1 class="page-title">Profil Akun</h1>
        <p class="welcome-description">Informasi akun yang digunakan untuk menyimpan hasil dan perkembangan kebugaran.</p>
      </div>
      <section class="panel account-profile-panel">
        <div class="account-profile-avatar">${escapeHtmlApp((profile && profile.displayName || "T").charAt(0).toUpperCase())}</div>
        <div class="account-profile-details">
          <h2>${escapeHtmlApp(profile && profile.displayName || "Taruna")}</h2>
          <p>${escapeHtmlApp(profile && profile.email || "")}</p>
          <span class="profile-role-pill">Taruna</span>
          <p class="account-profile-note">Data profil dikelola melalui akun AeroFit. Untuk perubahan identitas resmi, hubungi admin/pelatih.</p>
        </div>
      </section>
    `;
  }

  const profiles = window.AeroFitCloud ? window.AeroFitCloud.getProfiles() : [];
  const cadets = profiles.filter(item => item.role === "taruna");
  const coaches = profiles.filter(item => item.role === "pelatih");
  const admins = profiles.filter(item => item.role === "admin");

  return `
    <div class="page-intro">
      <p class="eyebrow">USER MANAGEMENT</p>
      <h1 class="page-title">Data Pengguna</h1>
      <p class="welcome-description">Daftar akun yang terdaftar di AeroFit. Pembuatan akun dilakukan melalui registrasi, sedangkan hak akses staf dikelola melalui Firebase Console.</p>
    </div>
    <div class="schedule-stats">
      <article class="schedule-stat"><span>Total Taruna</span><strong>${cadets.length}</strong><small>Akun dengan akses taruna</small></article>
      <article class="schedule-stat"><span>Pelatih</span><strong>${coaches.length}</strong><small>Akun dengan akses pelatih</small></article>
      <article class="schedule-stat"><span>Admin</span><strong>${admins.length}</strong><small>Akun administrator</small></article>
    </div>
    <section class="panel user-management-panel">
      <div class="panel-header">
        <div><h2 class="panel-title">Daftar Akun Terdaftar</h2><p class="panel-subtitle">Data diambil langsung dari Firestore.</p></div>
        <span class="schedule-count">${profiles.length} akun</span>
      </div>
      ${profiles.length ? `
        <div class="user-table-wrap">
          <table class="user-table">
            <thead><tr><th>Nama</th><th>Email</th><th>Peran</th><th>UID</th></tr></thead>
            <tbody>
              ${profiles.map(item => `
                <tr>
                  <td><strong>${escapeHtmlApp(item.displayName || "-")}</strong></td>
                  <td>${escapeHtmlApp(item.email || "-")}</td>
                  <td><span class="profile-role-pill">${escapeHtmlApp(item.role || "taruna")}</span></td>
                  <td><code>${escapeHtmlApp(item.uid || "")}</code></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      ` : `<div class="schedule-empty"><h3>Belum ada akun lain</h3><p>Akun taruna yang mendaftar akan muncul di sini.</p></div>`}
    </section>
    <div class="auth-help-note">Untuk memberikan akses Admin atau Pelatih, buat akun melalui Firebase Authentication lalu ubah nilai <code>role</code> pada dokumen <code>users/{uid}</code> menjadi <code>admin</code> atau <code>pelatih</code>. Ikuti README untuk langkah lengkap.</div>
  `;
}

function escapeHtmlApp(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

function renderPage(pageKey) {
  currentPage = pageKey;
  breadcrumbCurrent.textContent = pageNames[pageKey] || "Dashboard";

  document.querySelectorAll(".nav-link").forEach(button => {
    button.classList.toggle("active", button.dataset.page === pageKey);
  });

  if (pageKey === "dashboard") {
    pageContent.innerHTML = dashboardTemplate();
  } else if (pageKey === "jadwal" && window.JadwalApp) {
    pageContent.innerHTML = window.JadwalApp.render(currentRole);
  } else if (pageKey === "hasil" && window.HasilApp) {
    pageContent.innerHTML = window.HasilApp.render(currentRole);
  } else if (pageKey === "rekomendasi" && window.RekomendasiApp) {
    pageContent.innerHTML = window.RekomendasiApp.render(currentRole);
  } else if (pageKey === "progres" && window.ProgresApp) {
    pageContent.innerHTML = window.ProgresApp.render(currentRole);
  } else if (pageKey === "taruna") {
    pageContent.innerHTML = dataTarunaTemplate();
  } else {
    pageContent.innerHTML = placeholderTemplate(pageKey);
  }

  closeMobileSidebar();
}

function setAuthenticatedProfile(profile) {
  currentProfile = profile;
  currentRole = ["admin", "pelatih"].includes(profile.role) ? "admin" : "taruna";
  const accountName = document.getElementById("accountName");
  const accountRole = document.getElementById("accountRole");
  if (accountName) accountName.textContent = profile.displayName || "Pengguna";
  if (accountRole) accountRole.textContent = profile.role === "admin" ? "Administrator" : profile.role === "pelatih" ? "Pelatih" : "Taruna";
  userAvatar.textContent = (profile.displayName || "A").trim().charAt(0).toUpperCase();
  document.querySelectorAll(".nav-link[data-page='taruna']").forEach(button => {
    button.innerHTML = currentRole === "admin"
      ? '<span class="nav-icon">♙</span><span>Data Pengguna</span>'
      : '<span class="nav-icon">♙</span><span>Profil Akun</span>';
  });
  renderPage("dashboard");
}

function openMobileSidebar() {
  sidebar.classList.add("open");
  sidebarBackdrop.classList.add("show");
}

function closeMobileSidebar() {
  sidebar.classList.remove("open");
  sidebarBackdrop.classList.remove("show");
}

document.querySelectorAll(".nav-link").forEach(button => {
  button.addEventListener("click", () => renderPage(button.dataset.page));
});

const logoutButton = document.getElementById("logoutButton");
if (logoutButton) logoutButton.addEventListener("click", () => {
  if (window.AeroFitAuth) window.AeroFitAuth.logout().catch(error => window.alert(error.message));
});

pageContent.addEventListener("click", event => {
  if (currentPage === "jadwal" && window.JadwalApp) {
    const handled = window.JadwalApp.handleClick(event, currentRole, renderPage);
    if (handled) return;
  }

  if (currentPage === "hasil" && window.HasilApp) {
    const handled = window.HasilApp.handleClick(event, currentRole, renderPage);
    if (handled) return;
  }

  if (currentPage === "rekomendasi" && window.RekomendasiApp) {
    const handled = window.RekomendasiApp.handleClick(event, currentRole, renderPage);
    if (handled) return;
  }

  if (currentPage === "progres" && window.ProgresApp) {
    const handled = window.ProgresApp.handleClick(event, currentRole, renderPage);
    if (handled) return;
  }

  const target = event.target.closest("[data-go]");
  if (target) renderPage(target.dataset.go);
});

pageContent.addEventListener("submit", event => {
  if (currentPage === "jadwal" && window.JadwalApp) {
    window.JadwalApp.handleSubmit(event, currentRole, renderPage);
  }

  if (currentPage === "hasil" && window.HasilApp) {
    window.HasilApp.handleSubmit(event, currentRole, renderPage);
  }

  if (currentPage === "rekomendasi" && window.RekomendasiApp) {
    window.RekomendasiApp.handleSubmit(event, currentRole, renderPage);
  }

  if (currentPage === "progres" && window.ProgresApp) {
    window.ProgresApp.handleSubmit(event, currentRole, renderPage);
  }
});

pageContent.addEventListener("input", event => {
  if (currentPage === "jadwal" && window.JadwalApp) window.JadwalApp.handleInput(event);
  if (currentPage === "hasil" && window.HasilApp) window.HasilApp.handleInput(event, currentRole);
  if (currentPage === "rekomendasi" && window.RekomendasiApp) window.RekomendasiApp.handleInput(event);
});

pageContent.addEventListener("change", event => {
  if (currentPage === "jadwal" && window.JadwalApp) window.JadwalApp.handleChange(event);
  if (currentPage === "hasil" && window.HasilApp) window.HasilApp.handleChange(event, currentRole, renderPage);
  if (currentPage === "rekomendasi" && window.RekomendasiApp) window.RekomendasiApp.handleChange(event, renderPage);
  if (currentPage === "progres" && window.ProgresApp) window.ProgresApp.handleChange(event, renderPage);
});

document.addEventListener("keydown", event => {
  if (window.JadwalApp) window.JadwalApp.handleKeydown(event, renderPage);
  if (window.HasilApp) window.HasilApp.handleKeydown(event, renderPage);
  if (window.RekomendasiApp) window.RekomendasiApp.handleKeydown(event, renderPage);
  if (window.ProgresApp) window.ProgresApp.handleKeydown(event, renderPage);
});

document.getElementById("openSidebar").addEventListener("click", openMobileSidebar);
document.getElementById("closeSidebar").addEventListener("click", closeMobileSidebar);
sidebarBackdrop.addEventListener("click", closeMobileSidebar);

let currentProfile = null;

window.AeroFitApp = {
  start(profile) {
    setAuthenticatedProfile(profile);
  },
  stop() {
  appShell.hidden = true;

  currentProfile = null;
  currentRole = "taruna";
  currentPage = "dashboard";

  pageContent.innerHTML = "";
},
  refresh(error) {
    if (error) {
      console.error("AeroFit sync:", error);
      return;
    }
    if (!appShell.hidden) renderPage(currentPage);
  }
};

if (window.AeroFitAuth) {
  window.AeroFitAuth.init();
} else {
  console.error("AeroFitAuth tidak ditemukan. Periksa urutan script pada index.html.");
}
