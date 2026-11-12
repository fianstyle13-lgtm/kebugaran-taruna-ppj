(() => {
  "use strict";

  const RESULTS_KEY = "aerofit_results_v1";
  const TARGETS_KEY = "aerofit_targets_v1";

  const CATEGORY_CONFIG = {
    "Lari": {
      label: "Waktu tempuh",
      key: "durationSeconds",
      unit: "detik",
      direction: "lower",
      protocolLabel: "jarak lari",
      protocolKey: "distanceKm",
      note: "Waktu dibandingkan hanya pada jarak lari yang sama."
    },
    "Push-up": {
      label: "Jumlah repetisi",
      key: "reps",
      unit: "kali",
      direction: "higher",
      protocolLabel: "durasi tes",
      protocolKey: "testMinutes",
      note: "Repetisi dibandingkan hanya jika durasi tes sama."
    },
    "Sit-up": {
      label: "Jumlah repetisi",
      key: "reps",
      unit: "kali",
      direction: "higher",
      protocolLabel: "durasi tes",
      protocolKey: "testMinutes",
      note: "Repetisi dibandingkan hanya jika durasi tes sama."
    },
    "Pull-up": {
      label: "Jumlah repetisi",
      key: "reps",
      unit: "kali",
      direction: "higher",
      protocolLabel: "durasi tes",
      protocolKey: "testMinutes",
      note: "Repetisi dibandingkan hanya jika durasi tes sama."
    },
    "Renang": {
      label: "Waktu tempuh",
      key: "durationSeconds",
      unit: "detik",
      direction: "lower",
      protocolLabel: "jarak renang",
      protocolKey: "distanceMeters",
      note: "Waktu dibandingkan hanya pada jarak renang yang sama."
    },
    "Shuttle run": {
      label: "Waktu penyelesaian",
      key: "durationSeconds",
      unit: "detik",
      direction: "lower",
      protocolLabel: "protokol tes",
      protocolKey: "protocol",
      note: "Waktu dibandingkan hanya jika protokol tes sama."
    },
    "Kelincahan": {
      label: "Waktu penyelesaian",
      key: "durationSeconds",
      unit: "detik",
      direction: "lower",
      protocolLabel: "nama tes",
      protocolKey: "testName",
      note: "Waktu dibandingkan hanya jika jenis tes sama."
    },
    "Kelenturan": {
      label: "Hasil jangkauan",
      key: "reachCm",
      unit: "cm",
      direction: "higher",
      protocolLabel: "nama tes",
      protocolKey: "testName",
      note: "Arah peningkatan mengikuti protokol tes yang digunakan."
    },
    "Angkat beban": {
      label: "Beban tercatat",
      key: "weightKg",
      unit: "kg",
      direction: "higher",
      protocolLabel: "repetisi dan set",
      protocolKey: "repsSets",
      note: "Jenis gerakan belum dicatat pada formulir hasil; interpretasi beban harus dikonfirmasi pelatih."
    }
  };

  const CATEGORIES = Object.keys(CATEGORY_CONFIG);
  let selectedAthlete = "Taruna Demo";
  let selectedCategory = "Lari";
  let selectedPeriod = "all";
  let modalState = null;

  function readStorage(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn(`AeroFit: data ${key} tidak dapat dibaca.`, error);
      return [];
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      if (key === TARGETS_KEY && window.AeroFitCloud && window.AeroFitCloud.persist) {
        window.AeroFitCloud.persist("targets", value).catch(error => {
          console.error(error);
          window.alert(error.message || "Target gagal disinkronkan ke database.");
        });
      }
      return true;
    } catch (error) {
      console.error(`AeroFit: data ${key} gagal disimpan.`, error);
      window.alert("Data belum dapat disimpan. Periksa pengaturan penyimpanan browser.");
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

  function parseLocalDate(value) {
    if (!value) return null;
    const [year, month, day] = String(value).split("-").map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day, 12, 0, 0);
  }

  function formatDate(value, short = false) {
    const date = parseLocalDate(value);
    if (!date) return "-";
    return new Intl.DateTimeFormat("id-ID", short
      ? { day: "2-digit", month: "short" }
      : { day: "numeric", month: "long", year: "numeric" }
    ).format(date);
  }

  function formatMetric(value, category) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "-";

    if (["Lari", "Renang", "Shuttle run", "Kelincahan"].includes(category)) {
      const total = Math.round(number);
      const minutes = Math.floor(total / 60);
      const seconds = total % 60;
      return `${minutes}:${String(seconds).padStart(2, "0")}`;
    }

    if (category === "Kelenturan" || category === "Angkat beban") {
      return number.toFixed(1).replace(/\.0$/, "");
    }

    return number.toLocaleString("id-ID", { maximumFractionDigits: 1 });
  }

  function currentAthleteProfile() {
    return window.AeroFitAuth && window.AeroFitAuth.getProfile
      ? window.AeroFitAuth.getProfile()
      : null;
  }

  function getAthletes(results, role) {
    if (role === "taruna") {
      const profile = currentAthleteProfile();
      return [profile ? profile.displayName : "Taruna Demo"];
    }
    const names = new Set(results.map(item => item.athleteName).filter(Boolean));
    if (window.AeroFitCloud) {
      window.AeroFitCloud.getProfiles()
        .filter(profile => profile.role === "taruna")
        .forEach(profile => names.add(profile.displayName));
    }
    const profile = currentAthleteProfile();
    if (profile) names.add(profile.displayName);
    return [...names].sort((a, b) => a.localeCompare(b, "id"));
  }

  function sameValue(a, b) {
    if (a === undefined || b === undefined || a === null || b === null) return false;
    const first = Number(a);
    const second = Number(b);
    if (Number.isFinite(first) && Number.isFinite(second)) {
      return Math.abs(first - second) < 0.0001;
    }
    return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
  }

  function sameProtocol(first, second, category) {
    const config = CATEGORY_CONFIG[category];
    if (!config || !first || !second) return false;

    const firstMetrics = first.metrics || {};
    const secondMetrics = second.metrics || {};

    if (category === "Angkat beban") {
      return sameValue(firstMetrics.reps, secondMetrics.reps) &&
        sameValue(firstMetrics.sets, secondMetrics.sets);
    }

    return sameValue(
      firstMetrics[config.protocolKey],
      secondMetrics[config.protocolKey]
    );
  }

  function sortRecords(records) {
    return [...records].sort((a, b) => {
      const dateCompare = String(a.date || "").localeCompare(String(b.date || ""));
      return dateCompare || String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
    });
  }

  function getComparableRecords(results, athlete, category) {
    const records = sortRecords(results.filter(record =>
      record.athleteName === athlete && record.category === category
    ));
    if (!records.length) return [];

    const latest = records[records.length - 1];
    return records.filter(record => sameProtocol(record, latest, category));
  }

  function filterByPeriod(records) {
    if (selectedPeriod === "all") return records;

    const days = Number(selectedPeriod);
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - (days - 1));

    return records.filter(record => {
      const date = parseLocalDate(record.date);
      return date && date >= cutoff;
    });
  }

  function getSelectedRecords(results) {
    const compatible = getComparableRecords(results, selectedAthlete, selectedCategory);
    return filterByPeriod(compatible);
  }

  function metricValue(record, category = selectedCategory) {
    const config = CATEGORY_CONFIG[category];
    if (!config || !record || !record.metrics) return NaN;
    return Number(record.metrics[config.key]);
  }

  function getDirectionText(direction) {
    return direction === "lower" ? "Semakin rendah semakin baik" : "Semakin tinggi semakin baik";
  }

  function getTrend(records, category) {
    if (records.length < 2) {
      return {
        label: records.length ? "Data awal" : "Belum ada data",
        className: "progress-neutral",
        description: records.length
          ? "Tambahkan hasil tes berikutnya dengan protokol yang sama untuk melihat perubahan."
          : "Belum ada hasil yang dapat dianalisis."
      };
    }

    const config = CATEGORY_CONFIG[category];
    const first = metricValue(records[0], category);
    const latest = metricValue(records[records.length - 1], category);
    if (!Number.isFinite(first) || !Number.isFinite(latest)) {
      return { label: "Data tidak lengkap", className: "progress-neutral", description: "Periksa kembali catatan hasil latihan." };
    }

    if (Math.abs(first - latest) < 0.0001) {
      return { label: "Stabil", className: "progress-neutral", description: "Nilai hasil tes sama dengan catatan awal pada periode yang dipilih." };
    }

    const improved = config.direction === "lower" ? latest < first : latest > first;
    const difference = Math.abs(latest - first);
    const percent = first !== 0 ? (difference / Math.abs(first)) * 100 : null;

    if (category === "Kelenturan") {
      return {
        label: "Ada perubahan",
        className: "progress-neutral",
        description: `Hasil berubah ${latest > first ? "+" : ""}${difference.toFixed(1)} cm. Pastikan arah peningkatan sesuai protokol tes yang digunakan.`
      };
    }

    if (category === "Angkat beban") {
      return {
        label: "Beban berubah",
        className: "progress-neutral",
        description: `Beban tercatat berubah ${latest > first ? "+" : "-"}${difference.toFixed(1)} kg. Konfirmasi jenis gerakan dan teknik kepada pelatih sebelum menafsirkan hasil.`
      };
    }

    return {
      label: improved ? "Meningkat" : "Menurun",
      className: improved ? "progress-positive" : "progress-attention",
      description: `${config.label} ${improved ? "membaik" : "berubah ke arah yang perlu dievaluasi"} sebesar ${percent === null ? difference.toFixed(1) : percent.toFixed(1) + "%"} dibanding catatan pertama pada periode ini.`
    };
  }

  function makeChart(records, category) {
    if (!records.length) {
      return `
        <div class="progress-chart-empty">
          <div class="empty-icon">↗</div>
          <strong>Belum ada data grafik</strong>
          <span>Tambahkan hasil latihan pada bidang ${escapeHtml(category)} untuk melihat perkembangannya.</span>
        </div>
      `;
    }

    const values = records.map(record => metricValue(record, category));
    if (values.some(value => !Number.isFinite(value))) {
      return `<div class="progress-chart-empty"><strong>Data pengukuran belum lengkap.</strong><span>Periksa kembali hasil latihan pada bidang ini.</span></div>`;
    }

    const width = 720;
    const height = 270;
    const left = 58;
    const right = 22;
    const top = 24;
    const bottom = 48;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;

    let min = Math.min(...values);
    let max = Math.max(...values);
    if (min === max) {
      const padding = Math.max(Math.abs(min) * 0.12, 1);
      min -= padding;
      max += padding;
    } else {
      const padding = (max - min) * 0.16;
      min -= padding;
      max += padding;
    }

    const points = values.map((value, index) => {
      const x = records.length === 1
        ? left + plotWidth / 2
        : left + (index / (records.length - 1)) * plotWidth;
      const y = top + ((max - value) / (max - min)) * plotHeight;
      return { x, y, value, record: records[index] };
    });

    const polyline = points.map(point => `${point.x},${point.y}`).join(" ");
    const grid = Array.from({ length: 5 }, (_, index) => {
      const y = top + (index / 4) * plotHeight;
      const value = max - (index / 4) * (max - min);
      const label = category === "Lari" || category === "Renang" ||
        category === "Shuttle run" || category === "Kelincahan"
        ? formatMetric(value, category)
        : Number(value).toFixed(1).replace(/\.0$/, "");

      return `
        <line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" class="progress-grid-line"/>
        <text x="${left - 10}" y="${y + 4}" text-anchor="end" class="progress-axis-label">${escapeHtml(label)}</text>
      `;
    }).join("");

    const circles = points.map(point => `
      <circle cx="${point.x}" cy="${point.y}" r="5" class="progress-chart-point">
        <title>${escapeHtml(formatDate(point.record.date))}: ${escapeHtml(formatMetric(point.value, category))} ${escapeHtml(CATEGORY_CONFIG[category].unit)}</title>
      </circle>
    `).join("");

    const labelIndexes = [...new Set([0, Math.floor((records.length - 1) / 2), records.length - 1])];
    const xLabels = labelIndexes.map(index => {
      const point = points[index];
      return `<text x="${point.x}" y="${height - 17}" text-anchor="middle" class="progress-axis-label">${escapeHtml(formatDate(records[index].date, true))}</text>`;
    }).join("");

    return `
      <div class="progress-chart-wrap">
        <svg class="progress-chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Grafik perkembangan ${escapeHtml(category)}">
          ${grid}
          <line x1="${left}" y1="${top}" x2="${left}" y2="${top + plotHeight}" class="progress-axis-line"/>
          <line x1="${left}" y1="${top + plotHeight}" x2="${width - right}" y2="${top + plotHeight}" class="progress-axis-line"/>
          ${points.length > 1 ? `<polyline points="${polyline}" class="progress-chart-line"/>` : ""}
          ${circles}
          ${xLabels}
        </svg>
      </div>
    `;
  }

  function getTargetFor(athlete, category, targets) {
    const profile = currentAthleteProfile();
    return targets.find(target =>
      target.category === category &&
      (target.athleteName === athlete ||
       (profile && target.athleteUid === profile.uid))
    ) || null;
  }

  function calculateTargetProgress(target, allComparableRecords) {
    if (!target) return null;
    if (allComparableRecords.length < 2) {
      return { percent: null, status: "Belum cukup data", description: "Diperlukan minimal dua hasil tes yang sebanding untuk menghitung kemajuan menuju target." };
    }

    const first = metricValue(allComparableRecords[0], target.category);
    const current = metricValue(allComparableRecords[allComparableRecords.length - 1], target.category);
    const goal = Number(target.targetValue);
    if (![first, current, goal].every(Number.isFinite)) {
      return { percent: null, status: "Data tidak lengkap", description: "Periksa kembali nilai hasil dan target." };
    }

    let percent;
    if (target.direction === "lower") {
      if (first <= goal) {
        percent = current <= goal ? 100 : 0;
      } else {
        percent = ((first - current) / (first - goal)) * 100;
      }
    } else {
      if (first >= goal) {
        percent = current >= goal ? 100 : 0;
      } else {
        percent = ((current - first) / (goal - first)) * 100;
      }
    }

    percent = Math.max(0, Math.min(100, percent));
    const reached = target.direction === "lower" ? current <= goal : current >= goal;

    return {
      percent,
      status: reached ? "Target tercapai" : "Dalam proses",
      description: reached
        ? "Hasil terbaru sudah mencapai atau melewati target yang ditetapkan."
        : "Persentase menunjukkan kemajuan dari hasil awal menuju target, bukan nilai kebugaran keseluruhan."
    };
  }

  function renderTargetCard(role, targets, allComparableRecords) {
    const target = getTargetFor(selectedAthlete, selectedCategory, targets);
    const config = CATEGORY_CONFIG[selectedCategory];

    if (!target) {
      return `
        <div class="progress-target-empty">
          <div>
            <strong>Target belum ditetapkan</strong>
            <p>${role === "admin"
              ? "Admin/pelatih dapat menetapkan target pengukuran untuk taruna yang dipilih."
              : "Target bidang ini belum ditetapkan oleh admin/pelatih."}</p>
          </div>
          ${role === "admin" ? `<button class="secondary-button" data-progress-action="add-target">＋ Tetapkan Target</button>` : ""}
        </div>
      `;
    }

    const latestRecord = allComparableRecords[allComparableRecords.length - 1];
    const currentValue = latestRecord ? metricValue(latestRecord, selectedCategory) : NaN;
    const progress = calculateTargetProgress(target, allComparableRecords);
    const percent = progress && progress.percent !== null ? progress.percent : 0;

    return `
      <div class="progress-target-content">
        <div class="progress-target-top">
          <div>
            <span class="progress-target-label">TARGET ${escapeHtml(selectedCategory.toUpperCase())}</span>
            <strong class="progress-target-value">${escapeHtml(formatMetric(target.targetValue, selectedCategory))} ${escapeHtml(config.unit)}</strong>
            <small>${escapeHtml(getDirectionText(target.direction))}</small>
          </div>
          ${role === "admin" ? `
            <div class="progress-target-actions">
              <button class="small-button secondary-button" data-progress-action="edit-target">Edit</button>
              <button class="small-button danger-button" data-progress-action="delete-target">Hapus</button>
            </div>
          ` : ""}
        </div>
        <div class="progress-target-current">
          <span>Hasil terbaru</span>
          <strong>${Number.isFinite(currentValue) ? `${escapeHtml(formatMetric(currentValue, selectedCategory))} ${escapeHtml(config.unit)}` : "Belum ada hasil"}</strong>
        </div>
        <div class="progress-target-bar"><span style="width:${percent}%"></span></div>
        <div class="progress-target-progress-row">
          <strong>${progress && progress.percent !== null ? `${Math.round(progress.percent)}%` : "—"}</strong>
          <span>${escapeHtml(progress ? progress.status : "Menunggu data")}</span>
        </div>
        <p class="progress-target-description">${escapeHtml(progress ? progress.description : "Masukkan hasil latihan dan tetapkan target untuk mulai memantau pencapaian.")}</p>
      </div>
    `;
  }

  function renderComparison(records, category) {
    if (!records.length) {
      return `
        <div class="progress-comparison-empty">
          <span>Belum ada hasil untuk dibandingkan.</span>
        </div>
      `;
    }

    const first = records[0];
    const latest = records[records.length - 1];
    const config = CATEGORY_CONFIG[category];
    const firstValue = metricValue(first, category);
    const latestValue = metricValue(latest, category);
    const trend = getTrend(records, category);

    return `
      <div class="progress-comparison-grid">
        <div class="progress-comparison-item">
          <span>Hasil pertama pada periode</span>
          <strong>${escapeHtml(formatMetric(firstValue, category))} ${escapeHtml(config.unit)}</strong>
          <small>${escapeHtml(formatDate(first.date))}</small>
        </div>
        <div class="progress-comparison-arrow">→</div>
        <div class="progress-comparison-item">
          <span>Hasil terbaru pada periode</span>
          <strong>${escapeHtml(formatMetric(latestValue, category))} ${escapeHtml(config.unit)}</strong>
          <small>${escapeHtml(formatDate(latest.date))}</small>
        </div>
        <div class="progress-trend-box ${trend.className}">
          <strong>${escapeHtml(trend.label)}</strong>
          <p>${escapeHtml(trend.description)}</p>
        </div>
      </div>
    `;
  }

  function renderTargetModal(role, athletes, targets) {
    if (!modalState) return "";
    const editing = modalState.type === "edit-target";
    const target = editing
      ? getTargetFor(selectedAthlete, selectedCategory, targets)
      : null;
    const category = target ? target.category : selectedCategory;
    const direction = target ? target.direction : CATEGORY_CONFIG[category].direction;
    const athlete = target ? target.athleteName : selectedAthlete;
    const unit = CATEGORY_CONFIG[category].unit;

    return `
      <div class="schedule-modal-backdrop" data-progress-action="backdrop-close">
        <section class="schedule-modal form-modal progress-target-modal" role="dialog" aria-modal="true" aria-labelledby="progressTargetModalTitle">
          <div class="modal-header">
            <div>
              <p class="eyebrow">TARGET KEBUGARAN</p>
              <h2 id="progressTargetModalTitle">${editing ? "Ubah Target" : "Tetapkan Target"}</h2>
            </div>
            <button class="modal-close" data-progress-action="close-modal" aria-label="Tutup">×</button>
          </div>

          <form id="progressTargetForm" data-mode="${editing ? "edit" : "add"}">
            <div class="form-grid">
              <label class="form-field">
                <span>Nama taruna <b>*</b></span>
                <select name="athleteName" required>
                  ${athletes.map(name => `<option value="${escapeHtml(name)}" ${athlete === name ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}
                </select>
              </label>

              <label class="form-field">
                <span>Bidang latihan <b>*</b></span>
                <select name="category" id="progressTargetCategory" required>
                  ${CATEGORIES.map(name => `<option value="${escapeHtml(name)}" ${category === name ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}
                </select>
              </label>

              <label class="form-field full-width">
                <span>Nilai target (${escapeHtml(unit)}) <b>*</b></span>
                <input name="targetValue" type="number" min="-1000" max="100000" step="0.01" required value="${target ? escapeHtml(target.targetValue) : ""}" placeholder="Masukkan nilai target">
                <small id="progressTargetUnitHint">${category === "Lari" || category === "Renang" || category === "Shuttle run" || category === "Kelincahan" ? "Untuk waktu, masukkan dalam detik. Contoh: 840 = 14 menit." : `Satuan pengukuran: ${escapeHtml(unit)}.`}</small>
              </label>

              <label class="form-field full-width">
                <span>Arah target <b>*</b></span>
                <select name="direction" required>
                  <option value="higher" ${direction === "higher" ? "selected" : ""}>Semakin tinggi semakin baik</option>
                  <option value="lower" ${direction === "lower" ? "selected" : ""}>Semakin rendah semakin baik</option>
                </select>
              </label>
            </div>

            <div class="result-form-reminder">Target harus realistis, bertahap, dan disetujui pelatih. Untuk lari/renang, target waktu berlaku pada jarak yang dicatat dalam hasil tes terbaru. Untuk angkat beban, pastikan jenis gerakan yang dibandingkan sama.</div>
            <p class="form-error" id="progressTargetError" role="alert"></p>
            <div class="modal-actions">
              <button type="button" class="secondary-button" data-progress-action="close-modal">Batal</button>
              <button type="submit" class="primary-button">Simpan Target</button>
            </div>
          </form>
        </section>
      </div>
    `;
  }

  function renderPage(role) {
    const results = readStorage(RESULTS_KEY);
    const targets = readStorage(TARGETS_KEY);
    const isAdmin = role === "admin";
    const athletes = getAthletes(results, role);

    if (!athletes.includes(selectedAthlete)) selectedAthlete = athletes[0] || "Taruna Demo";
    if (!CATEGORIES.includes(selectedCategory)) selectedCategory = "Lari";

    const allComparableRecords = getComparableRecords(results, selectedAthlete, selectedCategory);
    const periodRecords = filterByPeriod(allComparableRecords);
    const trend = getTrend(periodRecords, selectedCategory);
    const categoryCount = new Set(results
      .filter(record => record.athleteName === selectedAthlete)
      .map(record => record.category)
    ).size;
    const totalRecords = results.filter(record => record.athleteName === selectedAthlete).length;
    const availableCategories = CATEGORIES.filter(category =>
      results.some(record => record.athleteName === selectedAthlete && record.category === category)
    );

    return `
      <div class="page-intro progress-page-intro">
        <div>
          <p class="eyebrow">PERFORMANCE TRACKING</p>
          <h1 class="page-title">Progres Kebugaran</h1>
          <p class="welcome-description">Pantau perubahan hasil tes fisik, bandingkan pencapaian, dan evaluasi target kebugaran secara berkala.</p>
        </div>
        <span class="progress-live-label"><span></span> DATA HASIL LATIHAN</span>
      </div>

      <div class="schedule-info-banner">
        <span>ⓘ</span>
        <div>
          <strong>${isAdmin ? "Panel evaluasi admin/pelatih" : "Progres Taruna Demo"}</strong>
          Grafik dan ringkasan diambil dari catatan Hasil Latihan yang tersimpan di browser ini. Hasil hanya dibandingkan jika protokol pengukuran sebanding.
        </div>
      </div>

      <div class="progress-toolbar">
        ${isAdmin ? `
          <label class="form-field">
            <span>Pilih taruna</span>
            <select id="progressAthlete">
              ${athletes.map(name => `<option value="${escapeHtml(name)}" ${selectedAthlete === name ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}
            </select>
          </label>
        ` : `<div class="progress-athlete-chip"><span>Taruna</span><strong>${escapeHtml(selectedAthlete)}</strong></div>`}

        <label class="form-field">
          <span>Bidang kebugaran</span>
          <select id="progressCategory">
            ${CATEGORIES.map(name => `<option value="${escapeHtml(name)}" ${selectedCategory === name ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}
          </select>
        </label>

        <label class="form-field">
          <span>Periode</span>
          <select id="progressPeriod">
            <option value="7" ${selectedPeriod === "7" ? "selected" : ""}>7 hari terakhir</option>
            <option value="30" ${selectedPeriod === "30" ? "selected" : ""}>30 hari terakhir</option>
            <option value="90" ${selectedPeriod === "90" ? "selected" : ""}>90 hari terakhir</option>
            <option value="all" ${selectedPeriod === "all" ? "selected" : ""}>Seluruh riwayat</option>
          </select>
        </label>
      </div>

      <div class="progress-overview-grid">
        <article class="schedule-stat">
          <span>Total hasil tes</span>
          <strong>${totalRecords}</strong>
          <small>Seluruh catatan taruna terpilih</small>
        </article>
        <article class="schedule-stat">
          <span>Bidang tercatat</span>
          <strong>${categoryCount}</strong>
          <small>Dari 9 bidang kebugaran</small>
        </article>
        <article class="schedule-stat">
          <span>Hasil pada periode</span>
          <strong>${periodRecords.length}</strong>
          <small>Catatan sebanding untuk ${escapeHtml(selectedCategory)}</small>
        </article>
        <article class="schedule-stat">
          <span>Status perkembangan</span>
          <strong class="progress-status-value">${escapeHtml(trend.label)}</strong>
          <small>${escapeHtml(selectedCategory)}</small>
        </article>
      </div>

      <section class="panel progress-chart-panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Grafik Perkembangan ${escapeHtml(selectedCategory)}</h2>
            <p class="panel-subtitle">${escapeHtml(CATEGORY_CONFIG[selectedCategory].label)} · Satuan ${escapeHtml(CATEGORY_CONFIG[selectedCategory].unit)}</p>
          </div>
          <span class="progress-chart-count">${periodRecords.length} titik data</span>
        </div>
        ${makeChart(periodRecords, selectedCategory)}
        <div class="progress-chart-footnote">${escapeHtml(CATEGORY_CONFIG[selectedCategory].note)} Titik grafik berasal dari tanggal tes yang tercatat.</div>
      </section>

      <section class="panel progress-comparison-panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Perbandingan Hasil Tes</h2>
            <p class="panel-subtitle">Hasil pertama dan hasil terbaru pada periode yang dipilih.</p>
          </div>
        </div>
        ${renderComparison(periodRecords, selectedCategory)}
      </section>

      <section class="panel progress-target-panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Target Kebugaran</h2>
            <p class="panel-subtitle">Pantau kemajuan dari hasil awal menuju target yang ditetapkan.</p>
          </div>
          <span class="progress-target-category">${escapeHtml(selectedCategory)}</span>
        </div>
        ${renderTargetCard(role, targets, allComparableRecords)}
      </section>

      <div class="progress-note">
        <strong>Catatan interpretasi:</strong> hasil yang lebih cepat umumnya lebih baik untuk tes berbasis waktu, sedangkan repetisi yang lebih banyak umumnya lebih baik untuk tes kekuatan/daya tahan. Untuk kelenturan, angkat beban, dan tes dengan protokol khusus, arah perubahan perlu dikonfirmasi berdasarkan standar tes dan arahan pelatih. Persentase target bukan skor kebugaran resmi.
      </div>

      ${modalState ? renderTargetModal(role, athletes, targets) : ""}
    `;
  }

  function closeModal(rerenderPage) {
    modalState = null;
    rerenderPage("progres");
  }

  function handleClick(event, role, rerenderPage) {
    const target = event.target.closest("[data-progress-action]");
    if (!target) return false;

    const action = target.dataset.progressAction;

    if (action === "backdrop-close" && event.target === target) {
      closeModal(rerenderPage);
      return true;
    }

    if (action === "close-modal") {
      closeModal(rerenderPage);
      return true;
    }

    if (action === "add-target" && role === "admin") {
      modalState = { type: "add-target" };
      rerenderPage("progres");
      return true;
    }

    if (action === "edit-target" && role === "admin") {
      modalState = { type: "edit-target" };
      rerenderPage("progres");
      return true;
    }

    if (action === "delete-target" && role === "admin") {
      const targets = readStorage(TARGETS_KEY);
      const updated = targets.filter(item =>
        !(item.athleteName === selectedAthlete && item.category === selectedCategory)
      );
      if (window.confirm(`Hapus target ${selectedCategory} untuk ${selectedAthlete}?`)) {
        if (writeStorage(TARGETS_KEY, updated)) rerenderPage("progres");
      }
      return true;
    }

    return false;
  }

  function handleSubmit(event, role, rerenderPage) {
    const form = event.target.closest("#progressTargetForm");
    if (!form) return false;

    event.preventDefault();

    if (role !== "admin") {
      window.alert("Hanya admin/pelatih yang dapat menetapkan target.");
      return true;
    }

    const data = new FormData(form);
    const athleteName = String(data.get("athleteName") || "").trim();
    const category = String(data.get("category") || "").trim();
    const targetValue = Number(data.get("targetValue"));
    const direction = String(data.get("direction") || "");
    const errorBox = form.querySelector("#progressTargetError");

    let error = "";
    if (!athleteName || !CATEGORIES.includes(category)) {
      error = "Nama taruna dan bidang latihan wajib dipilih.";
    } else if (role === "admin" && !(window.AeroFitCloud && window.AeroFitCloud.getProfileByName(athleteName))) {
      error = "Pilih taruna yang sudah memiliki akun terdaftar.";
    } else if (!Number.isFinite(targetValue)) {
      error = "Nilai target harus berupa angka yang valid.";
    } else if (!["higher", "lower"].includes(direction)) {
      error = "Arah target tidak valid.";
    } else if (["Lari", "Renang", "Shuttle run", "Kelincahan"].includes(category) && targetValue <= 0) {
      error = "Target waktu harus lebih besar dari nol detik.";
    }

    if (error) {
      errorBox.textContent = error;
      return true;
    }

    const targets = readStorage(TARGETS_KEY);
    const existingIndex = targets.findIndex(item =>
      item.athleteName === athleteName && item.category === category
    );

    const athleteProfile = window.AeroFitCloud ? window.AeroFitCloud.getProfileByName(athleteName) : null;
    const targetRecord = {
      athleteName,
      athleteUid: athleteProfile ? athleteProfile.uid : null,
      category,
      targetValue,
      direction,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      targets[existingIndex] = { ...targets[existingIndex], ...targetRecord };
    } else {
      targets.push({
        id: `target-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        ...targetRecord,
        createdAt: new Date().toISOString()
      });
    }

    if (writeStorage(TARGETS_KEY, targets)) {
      selectedAthlete = athleteName;
      selectedCategory = category;
      modalState = null;
      rerenderPage("progres");
    }

    return true;
  }

  function handleChange(event, rerenderPage) {
    if (event.target.id === "progressAthlete") {
      selectedAthlete = event.target.value;
      rerenderPage("progres");
    }

    if (event.target.id === "progressCategory") {
      selectedCategory = event.target.value;
      rerenderPage("progres");
    }

    if (event.target.id === "progressPeriod") {
      selectedPeriod = event.target.value;
      rerenderPage("progres");
    }

    if (event.target.id === "progressTargetCategory") {
      const category = event.target.value;
      const hint = document.getElementById("progressTargetUnitHint");
      if (hint) {
        const unit = CATEGORY_CONFIG[category].unit;
        hint.textContent = ["Lari", "Renang", "Shuttle run", "Kelincahan"].includes(category)
          ? "Untuk waktu, masukkan dalam detik. Contoh: 840 = 14 menit."
          : `Satuan pengukuran: ${unit}.`;
      }
    }
  }

  function handleKeydown(event, rerenderPage) {
    if (event.key === "Escape" && modalState) closeModal(rerenderPage);
  }

  window.ProgresApp = {
    render: renderPage,
    handleClick,
    handleSubmit,
    handleChange,
    handleKeydown
  };
})();
