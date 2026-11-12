(() => {
  "use strict";

  const STORAGE_KEY = "aerofit_schedules_v1";
  const categories = [
    "Lari",
    "Push-up",
    "Sit-up",
    "Pull-up",
    "Renang",
    "Shuttle run",
    "Kelincahan",
    "Kelenturan",
    "Angkat beban"
  ];

  let schedules = loadSchedules();
  let searchTerm = "";
  let statusFilter = "semua";
  let modalState = null;

  function localDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function dateOffsetString(offset) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    return localDateString(date);
  }

  function createDemoSchedules() {
    return [
      {
        id: "demo-lari",
        title: "Latihan daya tahan pagi",
        category: "Lari",
        date: dateOffsetString(1),
        startTime: "06:00",
        endTime: "06:45",
        location: "Lapangan kampus",
        intensity: "Sedang",
        participants: ["Taruna A", "Taruna B", "Taruna C"],
        notes: "Awali dengan pemanasan dan akhiri dengan pendinginan."
      },
      {
        id: "demo-kekuatan",
        title: "Latihan kekuatan tubuh bagian atas",
        category: "Push-up",
        date: dateOffsetString(2),
        startTime: "15:30",
        endTime: "16:15",
        location: "Area latihan",
        intensity: "Sedang",
        participants: ["Taruna A", "Taruna D"],
        notes: "Utamakan teknik gerakan yang benar."
      },
      {
        id: "demo-kelincahan",
        title: "Latihan shuttle run dan koordinasi",
        category: "Shuttle run",
        date: dateOffsetString(3),
        startTime: "07:00",
        endTime: "07:40",
        location: "Lapangan kampus",
        intensity: "Ringan",
        participants: ["Taruna B", "Taruna C", "Taruna D"],
        notes: "Sesuaikan intensitas dengan kondisi fisik peserta."
      }
    ];
  }

  function loadSchedules() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }

      const demo = createDemoSchedules();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
      return demo;
    } catch (error) {
      console.warn("AeroFit: penyimpanan lokal tidak dapat dibaca.", error);
      return createDemoSchedules();
    }
  }

  function saveSchedules() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
      if (window.AeroFitCloud && window.AeroFitCloud.persist) {
        window.AeroFitCloud.persist("schedules", schedules).catch(error => {
          console.error(error);
          window.alert(error.message || "Jadwal gagal disinkronkan ke database.");
        });
      }
      return true;
    } catch (error) {
      console.error("AeroFit: jadwal gagal disimpan.", error);
      window.alert("Jadwal belum dapat disimpan. Periksa pengaturan penyimpanan browser.");
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

  function formatDate(dateString, options = {}) {
    if (!dateString) return "-";
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0);
    return new Intl.DateTimeFormat("id-ID", {
      weekday: options.weekday ? "long" : undefined,
      day: "numeric",
      month: options.shortMonth ? "short" : "long",
      year: options.year === false ? undefined : "numeric"
    }).format(date);
  }

  function formatDateParts(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0);
    return {
      day: new Intl.DateTimeFormat("id-ID", { day: "2-digit" }).format(date),
      month: new Intl.DateTimeFormat("id-ID", { month: "short" }).format(date)
    };
  }

  function combineDateTime(dateString, timeString) {
    const [year, month, day] = dateString.split("-").map(Number);
    const [hour, minute] = timeString.split(":").map(Number);
    return new Date(year, month - 1, day, hour, minute, 0, 0);
  }

  function getStatus(item) {
    const now = new Date();
    const start = combineDateTime(item.date, item.startTime);
    const end = combineDateTime(item.date, item.endTime);

    if (now < start) return "Akan datang";
    if (now >= start && now <= end) return "Berlangsung";
    return "Selesai";
  }

  function statusClass(status) {
    if (status === "Berlangsung") return "status-live";
    if (status === "Selesai") return "status-done";
    return "status-upcoming";
  }

  function sortSchedules(list) {
    return [...list].sort((a, b) => {
      const dateA = combineDateTime(a.date, a.startTime).getTime();
      const dateB = combineDateTime(b.date, b.startTime).getTime();
      return dateA - dateB;
    });
  }

  function getFilteredSchedules() {
    const query = searchTerm.trim().toLowerCase();

    return sortSchedules(schedules).filter(item => {
      const status = getStatus(item);
      const matchesStatus =
        statusFilter === "semua" ||
        (statusFilter === "akan-datang" && status !== "Selesai") ||
        (statusFilter === "selesai" && status === "Selesai");

      const searchable = [
        item.title,
        item.category,
        item.location,
        item.intensity,
        ...(item.participants || [])
      ].join(" ").toLowerCase();

      return matchesStatus && (!query || searchable.includes(query));
    });
  }

  function countStatuses() {
    return {
      total: schedules.length,
      upcoming: schedules.filter(item => getStatus(item) !== "Selesai").length,
      completed: schedules.filter(item => getStatus(item) === "Selesai").length
    };
  }

  function renderScheduleCard(item, role) {
    const dateParts = formatDateParts(item.date);
    const status = getStatus(item);
    const participantCount = (item.participants || []).length;

    return `
      <article class="schedule-card">
        <div class="schedule-card-date">
          <strong>${escapeHtml(dateParts.day)}</strong>
          <span>${escapeHtml(dateParts.month)}</span>
        </div>

        <div class="schedule-card-main">
          <div class="schedule-card-heading">
            <div>
              <span class="schedule-category">${escapeHtml(item.category)}</span>
              <h3>${escapeHtml(item.title)}</h3>
            </div>
            <span class="status-pill ${statusClass(status)}">${escapeHtml(status)}</span>
          </div>

          <div class="schedule-meta">
            <span>◷ ${escapeHtml(item.startTime)}–${escapeHtml(item.endTime)}</span>
            <span>⌖ ${escapeHtml(item.location)}</span>
            <span>♙ ${participantCount} peserta</span>
            <span>◉ Intensitas ${escapeHtml(item.intensity)}</span>
          </div>

          <div class="schedule-card-actions">
            <button class="small-button secondary-button" data-action="detail" data-id="${escapeHtml(item.id)}">Lihat detail</button>
            ${role === "admin" ? `
              <button class="small-button secondary-button" data-action="edit" data-id="${escapeHtml(item.id)}">Edit</button>
              <button class="small-button danger-button" data-action="delete" data-id="${escapeHtml(item.id)}">Hapus</button>
            ` : ""}
          </div>
        </div>
      </article>
    `;
  }

  function renderScheduleList(role) {
    const filtered = getFilteredSchedules();

    if (filtered.length === 0) {
      return `
        <div class="schedule-empty">
          <div class="empty-icon">▣</div>
          <h3>Jadwal tidak ditemukan</h3>
          <p>Coba ubah kata kunci pencarian atau pilihan filter jadwal.</p>
        </div>
      `;
    }

    return `<div class="schedule-card-list">${filtered.map(item => renderScheduleCard(item, role)).join("")}</div>`;
  }

  function renderPage(role) {
    const stats = countStatuses();
    const isAdmin = role === "admin";

    return `
      <div class="page-intro schedule-page-intro">
        <div>
          <p class="eyebrow">TRAINING SCHEDULE</p>
          <h1 class="page-title">Jadwal Latihan</h1>
          <p class="welcome-description">
            ${isAdmin
              ? "Kelola agenda latihan, tentukan peserta, dan pastikan setiap sesi memiliki waktu serta lokasi yang jelas."
              : "Lihat agenda latihan yang telah disusun oleh admin atau pelatih."}
          </p>
        </div>
        ${isAdmin ? `
          <button class="primary-button" data-action="add">
            <span>＋</span> Tambah Jadwal
          </button>
        ` : ""}
      </div>

      <div class="schedule-info-banner">
        <span>ⓘ</span>
        <div>
          <strong>${isAdmin ? "Mode Admin/Pelatih" : "Mode Taruna"}</strong>
          ${isAdmin
            ? "Buat dan kelola jadwal latihan. Data disimpan pada browser/perangkat ini."
            : "Taruna dapat melihat detail jadwal. Pengubahan jadwal dilakukan oleh admin/pelatih."}
        </div>
      </div>

      <div class="schedule-stats">
        <article class="schedule-stat">
          <span>Total jadwal</span>
          <strong>${stats.total}</strong>
          <small>Seluruh agenda tersimpan</small>
        </article>
        <article class="schedule-stat">
          <span>Belum selesai</span>
          <strong>${stats.upcoming}</strong>
          <small>Termasuk sesi berlangsung</small>
        </article>
        <article class="schedule-stat">
          <span>Selesai</span>
          <strong>${stats.completed}</strong>
          <small>Berdasarkan tanggal dan waktu</small>
        </article>
      </div>

      <section class="panel schedule-panel">
        <div class="panel-header schedule-panel-header">
          <div>
            <h2 class="panel-title">Daftar Agenda Latihan</h2>
            <p class="panel-subtitle">Cari berdasarkan nama latihan, bidang, lokasi, atau peserta.</p>
          </div>
          <span class="schedule-count">${getFilteredSchedules().length} agenda</span>
        </div>

        <div class="schedule-filters">
          <label class="search-field">
            <span>⌕</span>
            <input id="scheduleSearch" type="search" placeholder="Cari jadwal latihan..." value="${escapeHtml(searchTerm)}" autocomplete="off">
          </label>
          <select id="scheduleStatusFilter" aria-label="Filter status jadwal">
            <option value="semua" ${statusFilter === "semua" ? "selected" : ""}>Semua jadwal</option>
            <option value="akan-datang" ${statusFilter === "akan-datang" ? "selected" : ""}>Akan datang / berlangsung</option>
            <option value="selesai" ${statusFilter === "selesai" ? "selected" : ""}>Selesai</option>
          </select>
        </div>

        <div id="scheduleListWrap">
          ${renderScheduleList(role)}
        </div>
      </section>

      ${modalState ? renderModal(role) : ""}
    `;
  }

  function renderModal(role) {
    if (modalState.type === "detail") {
      const item = schedules.find(schedule => schedule.id === modalState.id);
      if (!item) return "";
      const status = getStatus(item);
      const participants = item.participants && item.participants.length
        ? item.participants.map(name => `<li>${escapeHtml(name)}</li>`).join("")
        : "<li>Belum ada peserta yang dicantumkan.</li>";

      return `
        <div class="schedule-modal-backdrop" data-action="backdrop-close">
          <section class="schedule-modal detail-modal" role="dialog" aria-modal="true" aria-labelledby="scheduleModalTitle">
            <div class="modal-header">
              <div>
                <p class="eyebrow">DETAIL AGENDA</p>
                <h2 id="scheduleModalTitle">${escapeHtml(item.title)}</h2>
              </div>
              <button class="modal-close" data-action="close-modal" aria-label="Tutup">×</button>
            </div>
            <div class="detail-summary">
              <span class="schedule-category">${escapeHtml(item.category)}</span>
              <span class="status-pill ${statusClass(status)}">${escapeHtml(status)}</span>
            </div>
            <div class="detail-grid">
              <div><span>Tanggal</span><strong>${escapeHtml(formatDate(item.date, { weekday: true }))}</strong></div>
              <div><span>Waktu</span><strong>${escapeHtml(item.startTime)}–${escapeHtml(item.endTime)}</strong></div>
              <div><span>Lokasi</span><strong>${escapeHtml(item.location)}</strong></div>
              <div><span>Intensitas</span><strong>${escapeHtml(item.intensity)}</strong></div>
            </div>
            <div class="detail-block">
              <h3>Peserta latihan (${(item.participants || []).length})</h3>
              <ul class="participant-list">${participants}</ul>
            </div>
            <div class="detail-block">
              <h3>Catatan latihan</h3>
              <p>${item.notes ? escapeHtml(item.notes) : "Tidak ada catatan tambahan."}</p>
            </div>
            <div class="modal-actions">
              ${role === "admin" ? `
                <button class="secondary-button" data-action="edit" data-id="${escapeHtml(item.id)}">Edit jadwal</button>
                <button class="danger-button" data-action="delete" data-id="${escapeHtml(item.id)}">Hapus</button>
              ` : ""}
              <button class="primary-button" data-action="close-modal">Tutup</button>
            </div>
          </section>
        </div>
      `;
    }

    const isEditing = modalState.type === "edit";
    const item = isEditing
      ? schedules.find(schedule => schedule.id === modalState.id)
      : null;

    const defaultDate = dateOffsetString(1);
    const selectedDate = item ? item.date : defaultDate;
    const selectedCategory = item ? item.category : "Lari";
    const selectedIntensity = item ? item.intensity : "Sedang";
    const participantValue = item && item.participants ? item.participants.join("\n") : "";

    return `
      <div class="schedule-modal-backdrop" data-action="backdrop-close">
        <section class="schedule-modal form-modal" role="dialog" aria-modal="true" aria-labelledby="scheduleModalTitle">
          <div class="modal-header">
            <div>
              <p class="eyebrow">${isEditing ? "PERBARUI AGENDA" : "AGENDA BARU"}</p>
              <h2 id="scheduleModalTitle">${isEditing ? "Edit Jadwal Latihan" : "Tambah Jadwal Latihan"}</h2>
            </div>
            <button class="modal-close" data-action="close-modal" aria-label="Tutup">×</button>
          </div>

          <form id="scheduleForm" data-mode="${isEditing ? "edit" : "add"}" data-id="${isEditing ? escapeHtml(item.id) : ""}">
            <div class="form-grid">
              <label class="form-field full-width">
                <span>Nama sesi latihan <b>*</b></span>
                <input name="title" type="text" maxlength="80" required placeholder="Contoh: Latihan daya tahan pagi" value="${escapeHtml(item ? item.title : "")}">
              </label>

              <label class="form-field">
                <span>Bidang latihan <b>*</b></span>
                <select name="category" required>
                  ${categories.map(category => `<option value="${escapeHtml(category)}" ${selectedCategory === category ? "selected" : ""}>${escapeHtml(category)}</option>`).join("")}
                </select>
              </label>

              <label class="form-field">
                <span>Intensitas <b>*</b></span>
                <select name="intensity" required>
                  ${["Ringan", "Sedang", "Tinggi"].map(level => `<option value="${level}" ${selectedIntensity === level ? "selected" : ""}>${level}</option>`).join("")}
                </select>
              </label>

              <label class="form-field">
                <span>Tanggal <b>*</b></span>
                <input name="date" type="date" required value="${escapeHtml(selectedDate)}">
              </label>

              <label class="form-field">
                <span>Lokasi latihan <b>*</b></span>
                <input name="location" type="text" maxlength="100" required placeholder="Contoh: Lapangan kampus" value="${escapeHtml(item ? item.location : "")}">
              </label>

              <label class="form-field">
                <span>Waktu mulai <b>*</b></span>
                <input name="startTime" type="time" required value="${escapeHtml(item ? item.startTime : "06:00")}">
              </label>

              <label class="form-field">
                <span>Waktu selesai <b>*</b></span>
                <input name="endTime" type="time" required value="${escapeHtml(item ? item.endTime : "07:00")}">
              </label>

              <label class="form-field full-width">
                <span>Peserta latihan</span>
                <textarea name="participants" rows="3" placeholder="Masukkan nama taruna, satu nama per baris atau pisahkan dengan koma">${escapeHtml(participantValue)}</textarea>
                <small>Pada tahap ini, nama peserta dimasukkan secara manual.</small>
              </label>

              <label class="form-field full-width">
                <span>Catatan latihan</span>
                <textarea name="notes" rows="3" maxlength="500" placeholder="Contoh: Pemanasan 10 menit sebelum latihan utama.">${escapeHtml(item ? item.notes : "")}</textarea>
              </label>
            </div>

            <p class="form-error" id="scheduleFormError" role="alert"></p>
            <div class="modal-actions">
              <button type="button" class="secondary-button" data-action="close-modal">Batal</button>
              <button type="submit" class="primary-button">${isEditing ? "Simpan Perubahan" : "Simpan Jadwal"}</button>
            </div>
          </form>
        </section>
      </div>
    `;
  }

  function dashboardPreview() {
    const upcoming = sortSchedules(schedules)
      .filter(item => getStatus(item) !== "Selesai")
      .slice(0, 3);

    if (upcoming.length === 0) {
      return `
        <div class="schedule-empty compact-empty">
          <p>Belum ada jadwal latihan yang akan datang.</p>
        </div>
      `;
    }

    return upcoming.map(item => {
      const dateParts = formatDateParts(item.date);
      const status = getStatus(item);
      return `
        <div class="schedule-item">
          <div class="schedule-date"><strong>${escapeHtml(dateParts.day)}</strong><span>${escapeHtml(dateParts.month)}</span></div>
          <div class="schedule-info">
            <strong>${escapeHtml(item.title)} · ${escapeHtml(item.category)}</strong>
            <span>${escapeHtml(item.startTime)}–${escapeHtml(item.endTime)} · ${escapeHtml(item.location)}</span>
          </div>
          <span class="status-pill ${statusClass(status)}">${escapeHtml(status)}</span>
        </div>
      `;
    }).join("");
  }

  function openForm(type, id = null) {
    modalState = { type, id };
    return true;
  }

  function closeModal() {
    modalState = null;
  }

  function deleteSchedule(id, rerender) {
    const item = schedules.find(schedule => schedule.id === id);
    if (!item) return;

    const confirmed = window.confirm(`Hapus jadwal "${item.title}"?`);
    if (!confirmed) return;

    schedules = schedules.filter(schedule => schedule.id !== id);
    saveSchedules();
    closeModal();
    rerender("jadwal");
  }

  function handleClick(event, role, rerender) {
    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return false;

    const action = actionButton.dataset.action;
    const id = actionButton.dataset.id;

    if (action === "backdrop-close" && event.target === actionButton) {
      closeModal();
      rerender("jadwal");
      return true;
    }

    if (action === "close-modal") {
      closeModal();
      rerender("jadwal");
      return true;
    }

    if (action === "add" && role === "admin") {
      openForm("add");
      rerender("jadwal");
      return true;
    }

    if (action === "detail" && id) {
      modalState = { type: "detail", id };
      rerender("jadwal");
      return true;
    }

    if (action === "edit" && id && role === "admin") {
      openForm("edit", id);
      rerender("jadwal");
      return true;
    }

    if (action === "delete" && id && role === "admin") {
      deleteSchedule(id, rerender);
      return true;
    }

    return false;
  }

  function handleSubmit(event, role, rerender) {
    const form = event.target.closest("#scheduleForm");
    if (!form) return false;

    event.preventDefault();

    if (role !== "admin") {
      window.alert("Hanya admin/pelatih yang dapat mengubah jadwal.");
      return true;
    }

    const formData = new FormData(form);
    const title = String(formData.get("title") || "").trim();
    const category = String(formData.get("category") || "").trim();
    const intensity = String(formData.get("intensity") || "").trim();
    const date = String(formData.get("date") || "").trim();
    const location = String(formData.get("location") || "").trim();
    const startTime = String(formData.get("startTime") || "").trim();
    const endTime = String(formData.get("endTime") || "").trim();
    const participantsText = String(formData.get("participants") || "");
    const notes = String(formData.get("notes") || "").trim();
    const errorBox = form.querySelector("#scheduleFormError");

    let errorMessage = "";

    if (!title || !category || !date || !location || !startTime || !endTime) {
      errorMessage = "Lengkapi semua kolom wajib yang bertanda *.";
    } else if (!categories.includes(category)) {
      errorMessage = "Bidang latihan tidak valid.";
    } else if (date < localDateString(new Date())) {
      errorMessage = "Tanggal latihan tidak boleh berada di masa lalu.";
    } else if (endTime <= startTime) {
      errorMessage = "Waktu selesai harus lebih akhir daripada waktu mulai.";
    }

    if (errorMessage) {
      errorBox.textContent = errorMessage;
      return true;
    }

    const participants = participantsText
      .split(/[\n,]+/)
      .map(name => name.trim())
      .filter(Boolean);

    const scheduleData = {
      title,
      category,
      intensity,
      date,
      location,
      startTime,
      endTime,
      participants,
      notes
    };

    const mode = form.dataset.mode;
    const id = form.dataset.id;

    if (mode === "edit" && id) {
      schedules = schedules.map(item => item.id === id ? { ...item, ...scheduleData } : item);
    } else {
      schedules.push({
        id: `schedule-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        ...scheduleData
      });
    }

    if (saveSchedules()) {
      closeModal();
      searchTerm = "";
      statusFilter = "semua";
      rerender("jadwal");
    }
    return true;
  }

  function refreshList() {
    const listWrap = document.getElementById("scheduleListWrap");
    if (listWrap) {
      listWrap.innerHTML = renderScheduleList(
        document.querySelector(".role-button.active")?.dataset.role || "taruna"
      );
    }

    const count = document.querySelector(".schedule-count");
    if (count) count.textContent = `${getFilteredSchedules().length} agenda`;
  }

  function handleInput(event) {
    if (event.target.id === "scheduleSearch") {
      searchTerm = event.target.value;
      refreshList();
    }
  }

  function handleChange(event) {
    if (event.target.id === "scheduleStatusFilter") {
      statusFilter = event.target.value;
      refreshList();
    }
  }

  function handleKeydown(event, rerender) {
    if (event.key === "Escape" && modalState) {
      closeModal();
      rerender("jadwal");
    }
  }

  window.JadwalApp = {
    render: renderPage,
    reloadFromStorage() { schedules = loadSchedules(); },
    dashboardPreview,
    handleClick,
    handleSubmit,
    handleInput,
    handleChange,
    handleKeydown
  };
})();
