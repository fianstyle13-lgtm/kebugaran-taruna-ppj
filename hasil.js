(() => {
  "use strict";

  const STORAGE_KEY = "aerofit_results_v1";
  const CATEGORY_CONFIG = {
    "Lari": {
      description: "Catat jarak dan waktu tempuh. Gunakan jarak tes yang sama saat membandingkan hasil.",
      fields: [
        { name: "distanceKm", label: "Jarak tempuh", unit: "km", type: "number", min: "0.1", max: "100", step: "0.01", placeholder: "Contoh: 2.4" },
        { name: "durationSeconds", label: "Waktu tempuh", unit: "detik", type: "number", min: "1", max: "86400", step: "1", placeholder: "Contoh: 870 (14 menit 30 detik)" }
      ]
    },
    "Push-up": {
      description: "Masukkan jumlah repetisi dan durasi tes agar hasil dapat dibandingkan secara adil.",
      fields: [
        { name: "reps", label: "Jumlah repetisi", unit: "kali", type: "number", min: "0", max: "1000", step: "1", placeholder: "Contoh: 35" },
        { name: "testMinutes", label: "Durasi tes", unit: "menit", type: "number", min: "0.5", max: "60", step: "0.5", placeholder: "Contoh: 1" }
      ]
    },
    "Sit-up": {
      description: "Catat jumlah repetisi berdasarkan durasi tes yang digunakan.",
      fields: [
        { name: "reps", label: "Jumlah repetisi", unit: "kali", type: "number", min: "0", max: "1000", step: "1", placeholder: "Contoh: 40" },
        { name: "testMinutes", label: "Durasi tes", unit: "menit", type: "number", min: "0.5", max: "60", step: "0.5", placeholder: "Contoh: 1" }
      ]
    },
    "Pull-up": {
      description: "Catat jumlah repetisi dengan teknik gerakan yang konsisten.",
      fields: [
        { name: "reps", label: "Jumlah repetisi", unit: "kali", type: "number", min: "0", max: "500", step: "1", placeholder: "Contoh: 8" },
        { name: "testMinutes", label: "Durasi / batas tes", unit: "menit", type: "number", min: "0.5", max: "60", step: "0.5", placeholder: "Contoh: 1" }
      ]
    },
    "Renang": {
      description: "Masukkan jarak dan waktu renang. Catat juga gaya atau protokol tes pada catatan bila diperlukan.",
      fields: [
        { name: "distanceMeters", label: "Jarak renang", unit: "meter", type: "number", min: "1", max: "10000", step: "1", placeholder: "Contoh: 100" },
        { name: "durationSeconds", label: "Waktu tempuh", unit: "detik", type: "number", min: "1", max: "86400", step: "1", placeholder: "Contoh: 125" }
      ]
    },
    "Shuttle run": {
      description: "Catat waktu penyelesaian dan protokol jarak/putaran yang digunakan.",
      fields: [
        { name: "durationSeconds", label: "Waktu penyelesaian", unit: "detik", type: "number", min: "0.1", max: "3600", step: "0.01", placeholder: "Contoh: 12.5" },
        { name: "protocol", label: "Protokol tes", unit: "", type: "text", maxLength: "80", placeholder: "Contoh: 4 × 10 meter" }
      ]
    },
    "Kelincahan": {
      description: "Catat nama tes kelincahan dan waktu penyelesaian dengan protokol yang sama.",
      fields: [
        { name: "testName", label: "Nama tes", unit: "", type: "text", maxLength: "80", placeholder: "Contoh: T-Test" },
        { name: "durationSeconds", label: "Waktu penyelesaian", unit: "detik", type: "number", min: "0.1", max: "3600", step: "0.01", placeholder: "Contoh: 11.8" }
      ]
    },
    "Kelenturan": {
      description: "Catat hasil pengukuran dalam sentimeter. Nilai negatif dapat digunakan jika protokol tes mengizinkannya.",
      fields: [
        { name: "reachCm", label: "Hasil jangkauan", unit: "cm", type: "number", min: "-100", max: "200", step: "0.1", placeholder: "Contoh: 18.5" },
        { name: "testName", label: "Nama tes", unit: "", type: "text", maxLength: "80", placeholder: "Contoh: Sit and Reach" }
      ]
    },
    "Angkat beban": {
      description: "Catat beban, jumlah repetisi, dan set. Gunakan satuan kilogram.",
      fields: [
        { name: "weightKg", label: "Beban", unit: "kg", type: "number", min: "0", max: "1000", step: "0.5", placeholder: "Contoh: 20" },
        { name: "reps", label: "Repetisi per set", unit: "kali", type: "number", min: "1", max: "1000", step: "1", placeholder: "Contoh: 10" },
        { name: "sets", label: "Jumlah set", unit: "set", type: "number", min: "1", max: "100", step: "1", placeholder: "Contoh: 3" }
      ]
    }
  };

  let records = loadRecords();
  let searchTerm = "";
  let categoryFilter = "semua";
  let modalState = null;

  function localDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function loadRecords() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === null) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn("AeroFit: catatan hasil tidak dapat dibaca.", error);
      return [];
    }
  }

  function saveRecords() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      if (window.AeroFitCloud && window.AeroFitCloud.persist) {
        window.AeroFitCloud.persist("results", records).catch(error => {
          console.error(error);
          window.alert(error.message || "Hasil latihan gagal disinkronkan ke database.");
        });
      }
      return true;
    } catch (error) {
      console.error("AeroFit: catatan hasil gagal disimpan.", error);
      window.alert("Hasil latihan belum dapat disimpan. Periksa pengaturan penyimpanan browser.");
      return false;
    }
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[character]);
  }

  function formatDate(dateString) {
    if (!dateString) return "-";
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day, 12);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date);
  }

  function formatDuration(seconds) {
    const value = Number(seconds);
    if (!Number.isFinite(value)) return `${seconds}`;
    if (value < 60) return `${value.toFixed(value % 1 ? 2 : 0)} detik`;
    const total = Math.round(value);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (hours > 0) return `${hours} jam ${minutes} menit ${secs} detik`;
    return `${minutes} menit ${String(secs).padStart(2, "0")} detik`;
  }

  function metricEntries(record) {
    const metrics = record.metrics || {};
    const category = record.category;
    const output = [];

    if (category === "Lari") {
      output.push(["Jarak", `${metrics.distanceKm} km`]);
      output.push(["Waktu", formatDuration(metrics.durationSeconds)]);
    } else if (["Push-up", "Sit-up", "Pull-up"].includes(category)) {
      output.push(["Repetisi", `${metrics.reps} kali`]);
      output.push(["Durasi tes", `${metrics.testMinutes} menit`]);
    } else if (category === "Renang") {
      output.push(["Jarak", `${metrics.distanceMeters} meter`]);
      output.push(["Waktu", formatDuration(metrics.durationSeconds)]);
    } else if (category === "Shuttle run") {
      output.push(["Waktu", formatDuration(metrics.durationSeconds)]);
      if (metrics.protocol) output.push(["Protokol", metrics.protocol]);
    } else if (category === "Kelincahan") {
      if (metrics.testName) output.push(["Nama tes", metrics.testName]);
      output.push(["Waktu", formatDuration(metrics.durationSeconds)]);
    } else if (category === "Kelenturan") {
      output.push(["Hasil jangkauan", `${metrics.reachCm} cm`]);
      if (metrics.testName) output.push(["Nama tes", metrics.testName]);
    } else if (category === "Angkat beban") {
      output.push(["Beban", `${metrics.weightKg} kg`]);
      output.push(["Repetisi per set", `${metrics.reps} kali`]);
      output.push(["Jumlah set", `${metrics.sets} set`]);
    }

    return output;
  }

  function currentAthleteProfile() {
    return window.AeroFitAuth && window.AeroFitAuth.getProfile
      ? window.AeroFitAuth.getProfile()
      : null;
  }

  function visibleRecords(role) {
    const profile = currentAthleteProfile();
    const visible = role === "admin"
      ? records
      : records.filter(record =>
          (profile && record.ownerUid === profile.uid) ||
          (profile && record.athleteName === profile.displayName) ||
          (!profile && record.athleteName === "Taruna Demo")
        );

    const query = searchTerm.trim().toLowerCase();

    return [...visible]
      .filter(record => categoryFilter === "semua" || record.category === categoryFilter)
      .filter(record => {
        if (!query) return true;
        const text = [
          record.athleteName,
          record.category,
          record.date,
          record.notes,
          ...metricEntries(record).flat()
        ].join(" ").toLowerCase();
        return text.includes(query);
      })
      .sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        return dateCompare || String(b.createdAt).localeCompare(String(a.createdAt));
      });
  }

  function summaryFor(role) {
    const profile = currentAthleteProfile();
    const visible = role === "admin"
      ? records
      : records.filter(record =>
          (profile && record.ownerUid === profile.uid) ||
          (profile && record.athleteName === profile.displayName) ||
          (!profile && record.athleteName === "Taruna Demo")
        );

    return {
      total: visible.length,
      athletes: new Set(visible.map(record => record.athleteName)).size,
      categories: new Set(visible.map(record => record.category)).size
    };
  }

  function renderMetricFields(category, values = {}) {
    const config = CATEGORY_CONFIG[category];
    if (!config) return "";

    return `
      <div class="result-metric-note">${escapeHtml(config.description)}</div>
      <div class="result-metric-grid">
        ${config.fields.map(field => {
          const value = values[field.name] ?? "";
          const required = field.type === "text" ? "" : "required";
          const attrs = field.type === "number"
            ? `min="${field.min}" max="${field.max}" step="${field.step}"`
            : `maxlength="${field.maxLength || 80}"`;
          return `
            <label class="form-field">
              <span>${escapeHtml(field.label)} ${required ? "<b>*</b>" : ""}</span>
              <div class="metric-input-wrap">
                <input
                  name="${escapeHtml(field.name)}"
                  type="${field.type}"
                  ${attrs}
                  ${required}
                  placeholder="${escapeHtml(field.placeholder)}"
                  value="${escapeHtml(value)}"
                >
                ${field.unit ? `<span class="metric-unit">${escapeHtml(field.unit)}</span>` : ""}
              </div>
            </label>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderRecordCard(record, role) {
    const metrics = metricEntries(record);
    const isAdmin = role === "admin";

    return `
      <article class="result-card">
        <div class="result-card-top">
          <div>
            <span class="schedule-category">${escapeHtml(record.category)}</span>
            <h3>${escapeHtml(record.athleteName)}</h3>
            <p class="result-date">Tanggal tes: ${escapeHtml(formatDate(record.date))}</p>
          </div>
          <div class="result-card-mark">✓</div>
        </div>

        <div class="result-metrics">
          ${metrics.map(([label, value]) => `
            <div class="result-metric">
              <span>${escapeHtml(label)}</span>
              <strong>${escapeHtml(value)}</strong>
            </div>
          `).join("")}
        </div>

        ${record.notes ? `<p class="result-notes">${escapeHtml(record.notes)}</p>` : ""}

        <div class="result-card-actions">
          <button class="small-button secondary-button" data-result-action="detail" data-id="${escapeHtml(record.id)}">Detail</button>
          ${isAdmin ? `
            <button class="small-button secondary-button" data-result-action="edit" data-id="${escapeHtml(record.id)}">Edit</button>
            <button class="small-button danger-button" data-result-action="delete" data-id="${escapeHtml(record.id)}">Hapus</button>
          ` : ""}
        </div>
      </article>
    `;
  }

  function renderRecordList(role) {
    const list = visibleRecords(role);
    if (list.length === 0) {
      return `
        <div class="schedule-empty">
          <div class="empty-icon">↗</div>
          <h3>Belum ada hasil latihan</h3>
          <p>Tambahkan catatan hasil latihan pertama. Gunakan protokol tes yang konsisten agar perkembangan dapat dibandingkan.</p>
        </div>
      `;
    }
    return `<div class="result-card-grid">${list.map(record => renderRecordCard(record, role)).join("")}</div>`;
  }

  function renderPage(role) {
    const summary = summaryFor(role);
    const isAdmin = role === "admin";

    return `
      <div class="page-intro result-page-intro">
        <div>
          <p class="eyebrow">FITNESS RESULT LOG</p>
          <h1 class="page-title">Hasil Latihan</h1>
          <p class="welcome-description">
            ${isAdmin
              ? "Catat dan kelola hasil tes fisik taruna untuk menjadi dasar evaluasi dan program latihan."
              : "Catat hasil latihan pribadi dan lihat kembali riwayat performa yang sudah dimasukkan."}
          </p>
        </div>
        <button class="primary-button" data-result-action="add"><span>＋</span> Catat Hasil</button>
      </div>

      <div class="schedule-info-banner">
        <span>ⓘ</span>
        <div>
          <strong>${isAdmin ? "Mode Admin/Pelatih" : `Akun ${escapeHtml((currentAthleteProfile() || {}).displayName || "Taruna")}`}</strong>
          ${isAdmin
            ? "Admin/pelatih dapat mencatat dan mengelola hasil latihan taruna yang memiliki akun terdaftar."
            : "Taruna dapat mencatat hasil untuk akun sendiri. Data disimpan pada database dan disinkronkan antarperangkat."}
        </div>
      </div>

      <div class="schedule-stats result-stats">
        <article class="schedule-stat">
          <span>Total catatan hasil</span>
          <strong>${summary.total}</strong>
          <small>Catatan yang tersimpan</small>
        </article>
        <article class="schedule-stat">
          <span>${isAdmin ? "Taruna tercatat" : "Bidang tercatat"}</span>
          <strong>${isAdmin ? summary.athletes : summary.categories}</strong>
          <small>${isAdmin ? "Nama taruna berbeda" : "Kategori dengan hasil"}</small>
        </article>
        <article class="schedule-stat">
          <span>Bidang latihan</span>
          <strong>${isAdmin ? summary.categories : Object.keys(CATEGORY_CONFIG).length}</strong>
          <small>${isAdmin ? "Kategori yang sudah memiliki hasil" : "Kategori tersedia"}</small>
        </article>
      </div>

      <section class="panel result-panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Riwayat Hasil Latihan</h2>
            <p class="panel-subtitle">Gunakan pencarian dan filter untuk menemukan catatan.</p>
          </div>
          <span class="schedule-count">${visibleRecords(role).length} catatan</span>
        </div>

        <div class="result-filters">
          <label class="search-field">
            <span>⌕</span>
            <input id="resultSearch" type="search" placeholder="Cari nama taruna atau hasil..." value="${escapeHtml(searchTerm)}" autocomplete="off">
          </label>
          <select id="resultCategoryFilter" aria-label="Filter bidang latihan">
            <option value="semua" ${categoryFilter === "semua" ? "selected" : ""}>Semua bidang</option>
            ${Object.keys(CATEGORY_CONFIG).map(category => `
              <option value="${escapeHtml(category)}" ${categoryFilter === category ? "selected" : ""}>${escapeHtml(category)}</option>
            `).join("")}
          </select>
        </div>

        <div id="resultListWrap">${renderRecordList(role)}</div>
      </section>

      ${modalState ? renderModal(role) : ""}
    `;
  }

  function renderModal(role) {
    if (modalState.type === "detail") {
      const record = records.find(item => item.id === modalState.id);
      if (!record) return "";

      return `
        <div class="schedule-modal-backdrop" data-result-action="backdrop-close">
          <section class="schedule-modal detail-modal" role="dialog" aria-modal="true" aria-labelledby="resultModalTitle">
            <div class="modal-header">
              <div>
                <p class="eyebrow">DETAIL HASIL LATIHAN</p>
                <h2 id="resultModalTitle">${escapeHtml(record.category)}</h2>
              </div>
              <button class="modal-close" data-result-action="close-modal" aria-label="Tutup">×</button>
            </div>
            <div class="detail-grid">
              <div><span>Nama taruna</span><strong>${escapeHtml(record.athleteName)}</strong></div>
              <div><span>Tanggal tes</span><strong>${escapeHtml(formatDate(record.date))}</strong></div>
              ${metricEntries(record).map(([label, value]) => `
                <div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>
              `).join("")}
            </div>
            <div class="detail-block">
              <h3>Catatan</h3>
              <p>${record.notes ? escapeHtml(record.notes) : "Tidak ada catatan tambahan."}</p>
            </div>
            <div class="modal-actions">
              ${role === "admin" ? `<button class="secondary-button" data-result-action="edit" data-id="${escapeHtml(record.id)}">Edit hasil</button>` : ""}
              <button class="primary-button" data-result-action="close-modal">Tutup</button>
            </div>
          </section>
        </div>
      `;
    }

    const isEditing = modalState.type === "edit";
    const record = isEditing ? records.find(item => item.id === modalState.id) : null;
    const category = record ? record.category : "Lari";
    const metrics = record ? record.metrics : {};
    const date = record ? record.date : localDateString();

    return `
      <div class="schedule-modal-backdrop" data-result-action="backdrop-close">
        <section class="schedule-modal form-modal result-form-modal" role="dialog" aria-modal="true" aria-labelledby="resultModalTitle">
          <div class="modal-header">
            <div>
              <p class="eyebrow">${isEditing ? "PERBARUI CATATAN" : "CATAT HASIL BARU"}</p>
              <h2 id="resultModalTitle">${isEditing ? "Edit Hasil Latihan" : "Input Hasil Latihan"}</h2>
            </div>
            <button class="modal-close" data-result-action="close-modal" aria-label="Tutup">×</button>
          </div>

          <form id="resultForm" data-mode="${isEditing ? "edit" : "add"}" data-id="${isEditing ? escapeHtml(record.id) : ""}">
            <div class="form-grid">
              <label class="form-field full-width">
                <span>Nama taruna <b>*</b></span>
                ${role === "taruna"
                  ? `<input name="athleteName" type="text" readonly value="${escapeHtml((currentAthleteProfile() || {}).displayName || "Taruna")}">`
                  : `<select name="athleteName" required>
                      <option value="">Pilih taruna terdaftar</option>
                      ${(window.AeroFitCloud ? window.AeroFitCloud.getProfiles() : [])
                        .filter(profile => profile.role === "taruna")
                        .map(profile => `<option value="${escapeHtml(profile.displayName)}" ${record && record.athleteName === profile.displayName ? "selected" : ""}>${escapeHtml(profile.displayName)} · ${escapeHtml(profile.email || "")}</option>`).join("")}
                    </select>
                    <small>Hanya akun taruna yang terdaftar di AeroFit yang dapat dipilih.</small>`}
              </label>

              <label class="form-field">
                <span>Bidang latihan <b>*</b></span>
                <select name="category" id="resultCategory" required>
                  ${Object.keys(CATEGORY_CONFIG).map(name => `
                    <option value="${escapeHtml(name)}" ${category === name ? "selected" : ""}>${escapeHtml(name)}</option>
                  `).join("")}
                </select>
              </label>

              <label class="form-field">
                <span>Tanggal tes <b>*</b></span>
                <input name="date" type="date" max="${localDateString()}" required value="${escapeHtml(date)}">
              </label>

              <div class="full-width">
                <div id="resultMetricFields">${renderMetricFields(category, metrics)}</div>
              </div>

              <label class="form-field full-width">
                <span>Catatan tambahan</span>
                <textarea name="notes" rows="3" maxlength="500" placeholder="Contoh: Kondisi cuaca, jenis gaya renang, atau catatan dari pelatih.">${escapeHtml(record ? record.notes : "")}</textarea>
              </label>
            </div>

            <div class="result-form-reminder">
              Pastikan satuan, durasi tes, jarak, dan protokol pengukuran dicatat secara konsisten. Jangan membandingkan hasil dari protokol yang berbeda secara langsung.
            </div>
            <p class="form-error" id="resultFormError" role="alert"></p>
            <div class="modal-actions">
              <button type="button" class="secondary-button" data-result-action="close-modal">Batal</button>
              <button type="submit" class="primary-button">${isEditing ? "Simpan Perubahan" : "Simpan Hasil"}</button>
            </div>
          </form>
        </section>
      </div>
    `;
  }

  function openForm(type, id = null) {
    modalState = { type, id };
  }

  function closeModal() {
    modalState = null;
  }

  function rerender(rerenderPage) {
    closeModal();
    rerenderPage("hasil");
  }

  function handleClick(event, role, rerenderPage) {
    const target = event.target.closest("[data-result-action]");
    if (!target) return false;

    const action = target.dataset.resultAction;
    const id = target.dataset.id;

    if (action === "backdrop-close" && event.target === target) {
      rerender(rerenderPage);
      return true;
    }

    if (action === "close-modal") {
      rerender(rerenderPage);
      return true;
    }

    if (action === "add") {
      openForm("add");
      rerenderPage("hasil");
      return true;
    }

    if (action === "detail" && id) {
      modalState = { type: "detail", id };
      rerenderPage("hasil");
      return true;
    }

    if (action === "edit" && id && role === "admin") {
      openForm("edit", id);
      rerenderPage("hasil");
      return true;
    }

    if (action === "delete" && id && role === "admin") {
      const record = records.find(item => item.id === id);
      if (!record) return true;
      if (window.confirm(`Hapus catatan hasil ${record.category} milik ${record.athleteName}?`)) {
        records = records.filter(item => item.id !== id);
        saveRecords();
        rerender(rerenderPage);
      }
      return true;
    }

    return false;
  }

  function readMetricValues(form, category) {
    const config = CATEGORY_CONFIG[category];
    const metrics = {};

    for (const field of config.fields) {
      const input = form.elements.namedItem(field.name);
      if (!input) continue;

      const raw = String(input.value || "").trim();
      if (field.type === "text") {
        metrics[field.name] = raw;
      } else {
        metrics[field.name] = Number(raw);
      }
    }

    return metrics;
  }

  function validateMetrics(category, metrics) {
    const config = CATEGORY_CONFIG[category];
    if (!config) return "Bidang latihan tidak dikenali.";

    for (const field of config.fields) {
      const value = metrics[field.name];

      if (field.type === "text") {
        continue;
      }

      if (!Number.isFinite(value)) {
        return `Kolom ${field.label} harus diisi dengan angka yang valid.`;
      }

      if (value < Number(field.min) || value > Number(field.max)) {
        return `Nilai ${field.label} harus berada antara ${field.min} dan ${field.max} ${field.unit}.`;
      }
    }

    if (["Push-up", "Sit-up", "Pull-up"].includes(category) &&
        !Number.isInteger(metrics.reps)) {
      return "Jumlah repetisi harus berupa bilangan bulat.";
    }

    if (category === "Angkat beban" &&
        (!Number.isInteger(metrics.reps) || !Number.isInteger(metrics.sets))) {
      return "Repetisi dan jumlah set harus berupa bilangan bulat.";
    }

    if (category === "Shuttle run" && !metrics.protocol) {
      return "Isi protokol tes, misalnya 4 × 10 meter.";
    }

    if (category === "Kelincahan" && !metrics.testName) {
      return "Isi nama tes kelincahan yang digunakan.";
    }

    if (category === "Kelenturan" && !metrics.testName) {
      return "Isi nama tes kelenturan yang digunakan.";
    }

    return "";
  }

  function handleSubmit(event, role, rerenderPage) {
    const form = event.target.closest("#resultForm");
    if (!form) return false;

    event.preventDefault();

    const formData = new FormData(form);
    const athleteName = String(formData.get("athleteName") || "").trim();
    const category = String(formData.get("category") || "").trim();
    const date = String(formData.get("date") || "").trim();
    const notes = String(formData.get("notes") || "").trim();
    const metrics = readMetricValues(form, category);
    const errorBox = form.querySelector("#resultFormError");

    let errorMessage = "";

    if (!athleteName) {
      errorMessage = "Nama taruna wajib diisi.";
    } else if (role === "taruna" && !currentAthleteProfile()) {
      errorMessage = "Profil akun belum tersedia. Silakan keluar dan masuk kembali.";
    } else if (role === "admin" && !(window.AeroFitCloud && window.AeroFitCloud.getProfileByName(athleteName))) {
      errorMessage = "Pilih taruna yang sudah memiliki akun terdaftar.";
    } else if (!date || date > localDateString()) {
      errorMessage = "Tanggal tes wajib diisi dan tidak boleh berada di masa depan.";
    } else {
      errorMessage = validateMetrics(category, metrics);
    }

    if (errorMessage) {
      errorBox.textContent = errorMessage;
      return true;
    }

    const selectedProfile = role === "admin" && window.AeroFitCloud
      ? window.AeroFitCloud.getProfileByName(athleteName)
      : currentAthleteProfile();

    const data = {
      athleteName: role === "taruna" && selectedProfile ? selectedProfile.displayName : athleteName,
      ownerUid: selectedProfile ? selectedProfile.uid : null,
      athleteUid: selectedProfile ? selectedProfile.uid : null,
      category,
      date,
      metrics,
      notes
    };

    const mode = form.dataset.mode;
    const id = form.dataset.id;

    if (mode === "edit" && id && role === "admin") {
      records = records.map(record => record.id === id
        ? { ...record, ...data, updatedAt: new Date().toISOString() }
        : record
      );
    } else {
      records.push({
        id: `result-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        ...data,
        createdAt: new Date().toISOString()
      });
    }

    if (saveRecords()) {
      closeModal();
      searchTerm = "";
      categoryFilter = "semua";
      rerenderPage("hasil");
    }

    return true;
  }

  function refreshList(role) {
    const listWrap = document.getElementById("resultListWrap");
    if (listWrap) listWrap.innerHTML = renderRecordList(role);

    const count = document.querySelector(".result-panel .schedule-count");
    if (count) count.textContent = `${visibleRecords(role).length} catatan`;
  }

  function handleInput(event, role) {
    if (event.target.id === "resultSearch") {
      searchTerm = event.target.value;
      refreshList(role);
    }
  }

  function handleChange(event, role, rerenderPage) {
    if (event.target.id === "resultCategoryFilter") {
      categoryFilter = event.target.value;
      refreshList(role);
    }

    if (event.target.id === "resultCategory") {
      const metricContainer = document.getElementById("resultMetricFields");
      if (metricContainer) metricContainer.innerHTML = renderMetricFields(event.target.value);
    }
  }

  function handleKeydown(event, rerenderPage) {
    if (event.key === "Escape" && modalState) rerender(rerenderPage);
  }

  window.HasilApp = {
    render: renderPage,
    reloadFromStorage() { records = loadRecords(); },
    handleClick,
    handleSubmit,
    handleInput,
    handleChange,
    handleKeydown
  };
})();
