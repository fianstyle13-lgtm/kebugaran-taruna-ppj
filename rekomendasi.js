(() => {
  "use strict";

  const RESULTS_KEY = "aerofit_results_v1";
  const COACH_KEY = "aerofit_coach_recommendations_v1";

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

  const exerciseGuides = {
    "Lari": {
      focus: "Daya tahan aerobik",
      frequency: "2 sesi per minggu sebagai opsi awal",
      duration: "20–30 menit per sesi",
      items: [
        "Mulai dengan pemanasan jalan cepat dan gerak dinamis.",
        "Lakukan jogging ringan pada intensitas yang masih memungkinkan berbicara dengan nyaman.",
        "Jika kondisi sudah siap, selingi lari dan jalan dengan jeda pemulihan yang cukup.",
        "Gunakan jarak dan rute pengukuran yang konsisten saat tes ulang."
      ],
      caution: "Tingkatkan durasi secara bertahap. Hentikan latihan jika muncul nyeri, pusing, atau sesak yang tidak biasa."
    },
    "Push-up": {
      focus: "Kekuatan dan daya tahan otot tubuh bagian atas",
      frequency: "2 sesi per minggu sebagai opsi awal",
      duration: "15–25 menit per sesi",
      items: [
        "Awali dengan pemanasan bahu, pergelangan tangan, dan lengan.",
        "Lakukan 2–3 set dengan repetisi yang masih menjaga teknik tetap baik.",
        "Sisakan sekitar 2–3 repetisi sebelum mencapai batas kemampuan pada setiap set.",
        "Berikan waktu pemulihan antarsesi dan catat durasi tes yang sama."
      ],
      caution: "Utamakan posisi tubuh yang stabil. Jangan memaksakan repetisi ketika pinggang turun atau teknik mulai berubah."
    },
    "Sit-up": {
      focus: "Daya tahan otot inti",
      frequency: "2 sesi per minggu sebagai opsi awal",
      duration: "15–20 menit per sesi",
      items: [
        "Lakukan pemanasan ringan pada area pinggul dan batang tubuh.",
        "Latih gerakan secara terkontrol dan pertahankan teknik sesuai protokol tes.",
        "Gunakan set latihan yang tidak sampai memaksakan kemampuan maksimal.",
        "Catat jumlah repetisi dan durasi tes yang konsisten."
      ],
      caution: "Hindari menarik leher dengan tangan. Hentikan gerakan jika timbul nyeri pada punggung atau leher."
    },
    "Pull-up": {
      focus: "Kekuatan punggung dan lengan",
      frequency: "2 sesi per minggu sebagai opsi awal",
      duration: "15–25 menit per sesi",
      items: [
        "Awali dengan mobilisasi bahu dan aktivasi otot punggung.",
        "Gunakan pull-up berbantuan atau latihan rowing sesuai fasilitas dan kemampuan.",
        "Pertahankan gerakan terkontrol dan hindari ayunan tubuh yang berlebihan.",
        "Catat jumlah repetisi dengan standar gerakan yang sama."
      ],
      caution: "Latihan negatif dan bantuan beban sebaiknya diperagakan atau diawasi pelatih, terutama bagi pemula."
    },
    "Renang": {
      focus: "Daya tahan dan teknik renang",
      frequency: "1–2 sesi per minggu sebagai opsi awal",
      duration: "20–30 menit per sesi",
      items: [
        "Lakukan pemanasan sebelum masuk ke kolam.",
        "Mulai dengan latihan teknik dan jarak pendek sesuai kemampuan.",
        "Atur jeda istirahat agar pernapasan dan teknik tetap terkendali.",
        "Gunakan gaya, jarak, dan kondisi tes yang sama untuk evaluasi berikutnya."
      ],
      caution: "Latihan harus dilakukan di area kolam yang aman dan dalam pengawasan petugas atau pelatih. Jangan berenang sendirian."
    },
    "Shuttle run": {
      focus: "Kecepatan, akselerasi, dan perubahan arah",
      frequency: "1–2 sesi per minggu sebagai opsi awal",
      duration: "15–25 menit per sesi",
      items: [
        "Awali dengan pemanasan dinamis dan gerakan perubahan arah berintensitas rendah.",
        "Latih teknik pengereman, posisi tubuh, dan tumpuan kaki.",
        "Lakukan pengulangan pendek dengan jeda pemulihan memadai.",
        "Pertahankan jarak, jumlah putaran, dan permukaan latihan yang konsisten."
      ],
      caution: "Pastikan permukaan tidak licin dan ruang latihan bebas hambatan. Hindari pengulangan cepat saat sudah kelelahan."
    },
    "Kelincahan": {
      focus: "Koordinasi dan perubahan arah",
      frequency: "1–2 sesi per minggu sebagai opsi awal",
      duration: "15–25 menit per sesi",
      items: [
        "Mulai dari pola langkah sederhana sebelum menambah kompleksitas.",
        "Gunakan cone atau penanda dengan jarak yang mudah dikendalikan.",
        "Fokus pada kualitas gerak, keseimbangan, dan kontrol saat berhenti.",
        "Berikan jeda cukup di antara pengulangan."
      ],
      caution: "Latihan dilakukan pada permukaan aman. Hentikan jika kontrol gerak menurun atau muncul nyeri."
    },
    "Kelenturan": {
      focus: "Mobilitas dan rentang gerak",
      frequency: "3–5 kali per minggu dalam sesi singkat",
      duration: "10–15 menit per sesi",
      items: [
        "Lakukan gerakan mobilitas dinamis sebagai bagian dari pemanasan.",
        "Latih kelompok otot sesuai kebutuhan dan hasil tes yang dicatat.",
        "Lakukan peregangan secara perlahan tanpa memantul atau memaksakan rentang gerak.",
        "Gunakan protokol pengukuran yang sama saat mencatat hasil berikutnya."
      ],
      caution: "Jangan memaksakan peregangan hingga terasa nyeri. Interpretasi hasil jangkauan harus mengikuti petunjuk tes yang digunakan."
    },
    "Angkat beban": {
      focus: "Kekuatan otot dan kontrol teknik",
      frequency: "2 sesi per minggu sebagai opsi awal",
      duration: "20–35 menit per sesi",
      items: [
        "Awali dengan pemanasan dan latihan teknik menggunakan beban ringan.",
        "Pilih beban yang memungkinkan gerakan dilakukan dengan teknik stabil.",
        "Berikan jeda pemulihan yang cukup antarsesi dan hindari menguji beban maksimal tanpa pengawasan.",
        "Catat jenis gerakan, beban, repetisi, dan set agar hasil dapat dibandingkan."
      ],
      caution: "Peningkatan beban harus bertahap dan sesuai arahan pelatih. Data beban saja tidak cukup untuk menilai kemampuan tanpa mengetahui jenis gerakan dan teknik."
    }
  };

  let results = loadJson(RESULTS_KEY, []);
  let coachPlans = loadJson(COACH_KEY, []);
  let selectedAthlete = "semua";
  let searchTerm = "";
  let modalState = null;

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (error) {
      console.warn(`AeroFit: data ${key} tidak dapat dibaca.`, error);
      return fallback;
    }
  }

  function saveCoachPlans() {
    try {
      localStorage.setItem(COACH_KEY, JSON.stringify(coachPlans));
      if (window.AeroFitCloud && window.AeroFitCloud.persist) {
        window.AeroFitCloud.persist("recommendations", coachPlans).catch(error => {
          console.error(error);
          window.alert(error.message || "Rekomendasi gagal disinkronkan ke database.");
        });
      }
      return true;
    } catch (error) {
      console.error("AeroFit: rekomendasi pelatih gagal disimpan.", error);
      window.alert("Rekomendasi belum dapat disimpan. Periksa pengaturan penyimpanan browser.");
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

  function dateToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function currentAthleteProfile() {
    return window.AeroFitAuth && window.AeroFitAuth.getProfile
      ? window.AeroFitAuth.getProfile()
      : null;
  }

  function uniqueAthletes() {
    const names = new Set(results.map(item => item.athleteName).filter(Boolean));
    coachPlans.forEach(item => { if (item.athleteName) names.add(item.athleteName); });
    if (window.AeroFitCloud) {
      window.AeroFitCloud.getProfiles()
        .filter(profile => profile.role === "taruna")
        .forEach(profile => names.add(profile.displayName));
    }
    const current = currentAthleteProfile();
    if (current) names.add(current.displayName);
    return [...names].sort((a, b) => a.localeCompare(b, "id"));
  }

  function getRecordsForAthlete(athleteName) {
    return results
      .filter(item => item.athleteName === athleteName)
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        return dateCompare || String(a.createdAt).localeCompare(String(b.createdAt));
      });
  }

  function approximatelyEqual(a, b) {
    return Math.abs(Number(a) - Number(b)) < 0.0001;
  }

  function isComparable(previous, latest) {
    if (!previous || !latest || previous.category !== latest.category) return false;

    const oldMetrics = previous.metrics || {};
    const newMetrics = latest.metrics || {};

    switch (latest.category) {
      case "Lari":
        return approximatelyEqual(oldMetrics.distanceKm, newMetrics.distanceKm);
      case "Renang":
        return approximatelyEqual(oldMetrics.distanceMeters, newMetrics.distanceMeters);
      case "Push-up":
      case "Sit-up":
      case "Pull-up":
        return approximatelyEqual(oldMetrics.testMinutes, newMetrics.testMinutes);
      case "Shuttle run":
        return Boolean(oldMetrics.protocol) &&
          oldMetrics.protocol.trim().toLowerCase() === String(newMetrics.protocol || "").trim().toLowerCase();
      case "Kelincahan":
        return Boolean(oldMetrics.testName) &&
          oldMetrics.testName.trim().toLowerCase() === String(newMetrics.testName || "").trim().toLowerCase();
      case "Kelenturan":
        return Boolean(oldMetrics.testName) &&
          oldMetrics.testName.trim().toLowerCase() === String(newMetrics.testName || "").trim().toLowerCase();
      case "Angkat beban":
        return approximatelyEqual(oldMetrics.reps, newMetrics.reps) &&
          approximatelyEqual(oldMetrics.sets, newMetrics.sets);
      default:
        return false;
    }
  }

  function analyzeTrend(previous, latest) {
    if (!previous) {
      return {
        label: "Data awal",
        className: "trend-neutral",
        message: "Baru ada satu catatan. Simpan hasil tes berikutnya dengan protokol yang sama agar perkembangan dapat dibandingkan."
      };
    }

    if (!isComparable(previous, latest)) {
      return {
        label: "Belum sebanding",
        className: "trend-neutral",
        message: "Protokol atau parameter tes berbeda. Gunakan jarak, durasi, nama tes, dan kondisi pengukuran yang sama sebelum menyimpulkan perubahan."
      };
    }

    const oldM = previous.metrics || {};
    const newM = latest.metrics || {};
    const category = latest.category;

    if (["Lari", "Renang", "Shuttle run", "Kelincahan"].includes(category)) {
      const oldTime = Number(oldM.durationSeconds);
      const newTime = Number(newM.durationSeconds);
      if (!Number.isFinite(oldTime) || !Number.isFinite(newTime) || oldTime <= 0) {
        return { label: "Perlu pemeriksaan", className: "trend-neutral", message: "Data waktu belum lengkap untuk dibandingkan." };
      }

      if (approximatelyEqual(oldTime, newTime)) {
        return { label: "Stabil", className: "trend-neutral", message: "Waktu penyelesaian sama dengan catatan sebelumnya. Pertahankan teknik dan evaluasi kembali secara berkala." };
      }

      if (newTime < oldTime) {
        const change = ((oldTime - newTime) / oldTime) * 100;
        return {
          label: "Waktu membaik",
          className: "trend-positive",
          message: `Waktu tercatat lebih cepat sekitar ${change.toFixed(1)}% dibanding tes sebelumnya. Pertahankan latihan bertahap dan pemulihan.`
        };
      }

      const change = ((newTime - oldTime) / oldTime) * 100;
      return {
        label: "Perlu perhatian",
        className: "trend-attention",
        message: `Waktu tercatat lebih lambat sekitar ${change.toFixed(1)}%. Periksa kondisi pemulihan, konsistensi latihan, dan kondisi saat tes sebelum mengubah program.`
      };
    }

    if (["Push-up", "Sit-up", "Pull-up"].includes(category)) {
      const oldReps = Number(oldM.reps);
      const newReps = Number(newM.reps);

      if (newReps > oldReps) {
        return {
          label: "Repetisi meningkat",
          className: "trend-positive",
          message: `Jumlah repetisi bertambah ${newReps - oldReps} dibanding catatan sebelumnya dengan durasi tes yang sama.`
        };
      }
      if (newReps < oldReps) {
        return {
          label: "Perlu perhatian",
          className: "trend-attention",
          message: `Jumlah repetisi berkurang ${oldReps - newReps}. Evaluasi teknik, kondisi pemulihan, dan konsistensi protokol tes.`
        };
      }
      return {
        label: "Stabil",
        className: "trend-neutral",
        message: "Jumlah repetisi sama dengan catatan sebelumnya. Pertahankan teknik dan evaluasi secara berkala."
      };
    }

    if (category === "Kelenturan") {
      const oldValue = Number(oldM.reachCm);
      const newValue = Number(newM.reachCm);
      const difference = newValue - oldValue;
      return {
        label: "Perubahan tercatat",
        className: "trend-neutral",
        message: `Hasil jangkauan berubah ${difference > 0 ? "+" : ""}${difference.toFixed(1)} cm. Arah peningkatan harus ditafsirkan berdasarkan protokol dan petunjuk tes yang digunakan.`
      };
    }

    if (category === "Angkat beban") {
      const oldLoad = Number(oldM.weightKg);
      const newLoad = Number(newM.weightKg);
      const difference = newLoad - oldLoad;
      return {
        label: "Perubahan beban",
        className: "trend-neutral",
        message: `Beban tercatat berubah ${difference > 0 ? "+" : ""}${difference.toFixed(1)} kg pada repetisi dan set yang sama. Ini bukan penilaian kekuatan menyeluruh tanpa informasi jenis gerakan dan teknik.`
      };
    }

    return {
      label: "Perlu evaluasi",
      className: "trend-neutral",
      message: "Data tersedia, tetapi belum cukup untuk menyimpulkan tren."
    };
  }

  function latestPerCategory(athleteName) {
    const grouped = new Map();
    getRecordsForAthlete(athleteName).forEach(record => {
      if (!grouped.has(record.category)) grouped.set(record.category, []);
      grouped.get(record.category).push(record);
    });

    return [...grouped.entries()].map(([category, list]) => {
      const latest = list[list.length - 1];
      const previous = list.length > 1 ? list[list.length - 2] : null;
      return {
        category,
        latest,
        previous,
        trend: analyzeTrend(previous, latest),
        historyCount: list.length
      };
    }).sort((a, b) => categories.indexOf(a.category) - categories.indexOf(b.category));
  }

  function buildAutomaticRecommendations(athleteName) {
    return latestPerCategory(athleteName).map(item => {
      const guide = exerciseGuides[item.category];
      return {
        athleteName,
        category: item.category,
        guide,
        latest: item.latest,
        previous: item.previous,
        trend: item.trend,
        historyCount: item.historyCount
      };
    });
  }

  function renderAutomaticCard(item) {
    return `
      <article class="recommendation-card automatic-card">
        <div class="recommendation-card-top">
          <div>
            <span class="recommendation-type auto-type">✦ REKOMENDASI SISTEM</span>
            <h3>${escapeHtml(item.category)}</h3>
            <p class="recommendation-focus">${escapeHtml(item.guide.focus)}</p>
          </div>
          <span class="trend-pill ${item.trend.className}">${escapeHtml(item.trend.label)}</span>
        </div>

        <div class="recommendation-context">
          <strong>Analisis hasil terakhir</strong>
          <span>${escapeHtml(item.trend.message)}</span>
          <small>Catatan terbaru: ${escapeHtml(formatDate(item.latest.date))} · ${item.historyCount} catatan</small>
        </div>

        <div class="recommendation-meta-grid">
          <div><span>Frekuensi awal</span><strong>${escapeHtml(item.guide.frequency)}</strong></div>
          <div><span>Durasi awal</span><strong>${escapeHtml(item.guide.duration)}</strong></div>
        </div>

        <div class="recommendation-detail">
          <h4>Usulan aktivitas</h4>
          <ul>${item.guide.items.map(text => `<li>${escapeHtml(text)}</li>`).join("")}</ul>
        </div>

        <div class="recommendation-caution">
          <strong>Catatan keselamatan</strong>
          <p>${escapeHtml(item.guide.caution)}</p>
        </div>
      </article>
    `;
  }

  function renderCoachCard(plan, role) {
    return `
      <article class="recommendation-card coach-card">
        <div class="recommendation-card-top">
          <div>
            <span class="recommendation-type coach-type">✓ REKOMENDASI PELATIH</span>
            <h3>${escapeHtml(plan.title)}</h3>
            <p class="recommendation-focus">${escapeHtml(plan.category)} · Untuk ${escapeHtml(plan.athleteName)}</p>
          </div>
          <span class="priority-pill priority-${escapeHtml(plan.priority)}">${escapeHtml(plan.priority)}</span>
        </div>

        <div class="recommendation-meta-grid">
          <div><span>Frekuensi:</span> <strong>${escapeHtml(plan.frequency)}</strong></div>
          <div><span>Durasi:</span> <strong>${escapeHtml(plan.duration)}</strong></div>
        </div>

        <div class="recommendation-detail">
          <h4>Program latihan</h4>
          <p>${escapeHtml(plan.plan).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>")}</p>
        </div>

        ${plan.goal ? `<div class="coach-goal"><strong>Target:</strong> ${escapeHtml(plan.goal)}</div>` : ""}
        <div class="coach-card-footer">
          <span>Pelatih: ${escapeHtml(plan.coachName || "Pelatih AeroFit")} · ${escapeHtml(formatDate(plan.createdDate))}</span>
          ${role === "admin" ? `
            <div class="coach-actions">
              <button class="small-button secondary-button" data-rec-action="edit-coach" data-id="${escapeHtml(plan.id)}">Edit</button>
              <button class="small-button danger-button" data-rec-action="delete-coach" data-id="${escapeHtml(plan.id)}">Hapus</button>
            </div>
          ` : ""}
        </div>
      </article>
    `;
  }

  
function filteredCoachPlans(role, athleteName) {
  let list = coachPlans;

  if (role === "taruna") {
    const profile = currentAthleteProfile();

    if (!profile) return [];

    list = list.filter(plan =>
      plan.athleteUid === profile.uid
    );

  } else if (athleteName !== "semua") {
    list = list.filter(plan =>
      plan.athleteName === athleteName
    );
  }

  const query = searchTerm.trim().toLowerCase();

  if (query) {
    list = list.filter(plan => [
      plan.title,
      plan.category,
      plan.athleteName,
      plan.goal,
      plan.plan,
      plan.coachName
    ].join(" ").toLowerCase().includes(query));
  }

  return [...list].sort((a, b) =>
    String(b.createdAt).localeCompare(String(a.createdAt))
  );
}


  function renderCoachForm() {
    const editing = modalState.type === "edit-coach";
    const plan = editing ? coachPlans.find(item => item.id === modalState.id) : null;

    return `
      <div class="schedule-modal-backdrop" data-rec-action="backdrop-close">
        <section class="schedule-modal form-modal recommendation-form-modal" role="dialog" aria-modal="true" aria-labelledby="coachFormTitle">
          <div class="modal-header">
            <div>
              <p class="eyebrow">${editing ? "PERBARUI PROGRAM" : "PROGRAM DARI PELATIH"}</p>
              <h2 id="coachFormTitle">${editing ? "Edit Rekomendasi" : "Buat Rekomendasi Latihan"}</h2>
            </div>
            <button class="modal-close" data-rec-action="close-modal" aria-label="Tutup">×</button>
          </div>

          <form id="coachRecommendationForm" data-mode="${editing ? "edit" : "add"}" data-id="${editing ? escapeHtml(plan.id) : ""}">
            <div class="form-grid">
              <label class="form-field">
                <span>Nama taruna <b>*</b></span>
                <select name="athleteName" required>
                  <option value="">Pilih taruna terdaftar</option>
                  ${(window.AeroFitCloud ? window.AeroFitCloud.getProfiles() : [])
                    .filter(profile => profile.role === "taruna")
                    .map(profile => `<option value="${escapeHtml(profile.displayName)}" ${plan && plan.athleteName === profile.displayName ? "selected" : ""}>${escapeHtml(profile.displayName)} · ${escapeHtml(profile.email || "")}</option>`).join("")}
                </select>
              </label>

              <label class="form-field">
                <span>Bidang latihan <b>*</b></span>
                <select name="category" required>
                  ${categories.map(category => `<option value="${escapeHtml(category)}" ${plan && plan.category === category ? "selected" : ""}>${escapeHtml(category)}</option>`).join("")}
                </select>
              </label>

              <label class="form-field full-width">
                <span>Judul program <b>*</b></span>
                <input name="title" type="text" maxlength="100" required placeholder="Contoh: Program peningkatan daya tahan lari" value="${escapeHtml(plan ? plan.title : "")}">
              </label>

              <label class="form-field">
                <span>Prioritas <b>*</b></span>
                <select name="priority" required>
                  ${["Rendah", "Sedang", "Tinggi"].map(priority => `<option value="${priority}" ${plan && plan.priority === priority ? "selected" : ""}>${priority}</option>`).join("")}
                </select>
              </label>

              <label class="form-field">
                <span>Frekuensi <b>*</b></span>
                <input name="frequency" type="text" maxlength="80" required placeholder="Contoh: 2 kali per minggu" value="${escapeHtml(plan ? plan.frequency : "")}">
              </label>

              <label class="form-field">
                <span>Durasi per sesi <b>*</b></span>
                <input name="duration" type="text" maxlength="80" required placeholder="Contoh: 20–30 menit" value="${escapeHtml(plan ? plan.duration : "")}">
              </label>

              <label class="form-field">
                <span>Nama pelatih</span>
                <input name="coachName" type="text" maxlength="80" placeholder="Nama pelatih" value="${escapeHtml(plan ? plan.coachName : "")}">
              </label>

              <label class="form-field full-width">
                <span>Target latihan</span>
                <input name="goal" type="text" maxlength="180" placeholder="Contoh: Menjaga konsistensi teknik dan daya tahan" value="${escapeHtml(plan ? plan.goal : "")}">
              </label>

              <label class="form-field full-width">
                <span>Rincian program latihan <b>*</b></span>
                <textarea name="plan" rows="5" maxlength="1500" required placeholder="Tuliskan aktivitas, set/repetisi bila relevan, jeda, dan arahan teknik.">${escapeHtml(plan ? plan.plan : "")}</textarea>
              </label>
            </div>

            <div class="result-form-reminder">Pastikan program sesuai kondisi taruna, riwayat latihan, fasilitas, dan arahan keselamatan. Rekomendasi ini perlu ditinjau pelatih sebelum dilaksanakan.</div>
            <p class="form-error" id="coachFormError" role="alert"></p>
            <div class="modal-actions">
              <button type="button" class="secondary-button" data-rec-action="close-modal">Batal</button>
              <button type="submit" class="primary-button">${editing ? "Simpan Perubahan" : "Simpan Rekomendasi"}</button>
            </div>
          </form>
        </section>
      </div>
    `;
  }

  function renderPage(role) {
    results = loadJson(RESULTS_KEY, []);
    coachPlans = loadJson(COACH_KEY, []);

    const isAdmin = role === "admin";
    const athletes = uniqueAthletes();
    const profile = currentAthleteProfile();
    const athlete = isAdmin
  ? selectedAthlete
  : (profile ? profile.displayName : "");

const autoTargets = isAdmin
  ? (athlete === "semua" ? athletes : [athlete])
  : (profile ? [profile.displayName] : []);

    const automatic = autoTargets.flatMap(name => buildAutomaticRecommendations(name));
    const coachList = filteredCoachPlans(role, athlete);
    const totalAuto = automatic.length;
    const totalCoach = coachList.length;

    return `
      <div class="page-intro recommendation-page-intro">
        <div>
          <p class="eyebrow">SMART TRAINING GUIDANCE</p>
          <h1 class="page-title">Rekomendasi Latihan</h1>
          <p class="welcome-description">
            ${isAdmin
              ? "Tinjau saran berbasis hasil latihan dan susun program khusus untuk taruna."
              : "Lihat saran latihan berdasarkan catatan hasil dan program yang diberikan pelatih."}
          </p>
        </div>
        ${isAdmin ? `<button class="primary-button" data-rec-action="add-coach"><span>＋</span> Buat Rekomendasi</button>` : ""}
      </div>

      <div class="schedule-info-banner recommendation-banner">
        <span>ⓘ</span>
        <div>
          <strong>${isAdmin ? "Mode Admin/Pelatih" : `Akun ${escapeHtml((currentAthleteProfile() || {}).displayName || "Taruna")}`}</strong>
          Rekomendasi otomatis merupakan saran awal berbasis aturan dari data yang tersedia. Rekomendasi pelatih dapat disesuaikan berdasarkan observasi dan kondisi taruna.
        </div>
      </div>

      ${isAdmin ? `
        <div class="recommendation-toolbar">
          <label class="form-field athlete-filter">
            <span>Tampilkan rekomendasi untuk</span>
            <select id="recommendationAthleteFilter">
              <option value="semua" ${athlete === "semua" ? "selected" : ""}>Semua taruna</option>
              ${athletes.map(name => `<option value="${escapeHtml(name)}" ${athlete === name ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}
            </select>
          </label>
        </div>
      ` : ""}

      <div class="recommendation-summary">
        <article class="schedule-stat">
          <span>Rekomendasi otomatis</span>
          <strong>${totalAuto}</strong>
          <small>Berdasarkan kategori dengan data hasil</small>
        </article>
        <article class="schedule-stat">
          <span>Rekomendasi pelatih</span>
          <strong>${totalCoach}</strong>
          <small>Program yang tersimpan untuk tampilan ini</small>
        </article>
        <article class="schedule-stat">
          <span>Bidang latihan</span>
          <strong>${categories.length}</strong>
          <small>Kategori yang didukung AeroFit</small>
        </article>
      </div>

      <section class="recommendation-section">
        <div class="section-heading recommendation-section-heading">
          <div>
            <h2>Rekomendasi Otomatis</h2>
            <p>Saran disusun dari hasil terakhir dan perbandingan data sebelumnya jika sebanding.</p>
          </div>
          <span class="recommendation-type auto-type">✦ SISTEM</span>
        </div>

        ${automatic.length
          ? `<div class="recommendation-grid">${automatic.map(item => `
              <div class="recommendation-athlete-label">${isAdmin ? `<span>Taruna: ${escapeHtml(item.athleteName)}</span>` : ""}</div>
              ${renderAutomaticCard(item)}
            `).join("")}</div>`
          : `
            <div class="schedule-empty">
              <div class="empty-icon">✦</div>
              <h3>Belum ada data untuk rekomendasi otomatis</h3>
              <p>Masukkan hasil latihan terlebih dahulu melalui menu Hasil Latihan. Setelah ada catatan, sistem akan menampilkan saran sesuai bidang yang diukur.</p>
            </div>
          `}
      </section>

      <section class="recommendation-section coach-recommendation-section">
        <div class="section-heading recommendation-section-heading">
          <div>
            <h2>Rekomendasi Pelatih</h2>
            <p>Program khusus yang dibuat dan dikelola admin/pelatih.</p>
          </div>
          <span class="recommendation-type coach-type">✓ PELATIH</span>
        </div>

        ${coachList.length
          ? `<div class="recommendation-grid">${coachList.map(plan => renderCoachCard(plan, role)).join("")}</div>`
          : `
            <div class="schedule-empty">
              <div class="empty-icon">✓</div>
              <h3>Belum ada rekomendasi dari pelatih</h3>
              <p>${isAdmin ? "Klik Buat Rekomendasi untuk menyusun program khusus bagi taruna." : "Program dari pelatih akan muncul di sini setelah dibuat khusus untuk akun ini."}</p>
            </div>
          `}
      </section>

      <div class="recommendation-disclaimer">
        <strong>Penting:</strong> rekomendasi ini merupakan panduan awal, bukan diagnosis medis, penetapan kelayakan fisik, atau pengganti penilaian pelatih. Intensitas dan volume harus disesuaikan dengan kondisi, pengalaman, pemulihan, fasilitas, serta standar resmi kampus.
      </div>

      ${modalState ? renderCoachForm() : ""}
    `;
  }

  function closeAndRender(rerenderPage) {
    modalState = null;
    rerenderPage("rekomendasi");
  }

  function handleClick(event, role, rerenderPage) {
    const target = event.target.closest("[data-rec-action]");
    if (!target) return false;

    const action = target.dataset.recAction;
    const id = target.dataset.id;

    if (action === "backdrop-close" && event.target === target) {
      closeAndRender(rerenderPage);
      return true;
    }

    if (action === "close-modal") {
      closeAndRender(rerenderPage);
      return true;
    }

    if (action === "add-coach" && role === "admin") {
      modalState = { type: "add-coach" };
      rerenderPage("rekomendasi");
      return true;
    }

    if (action === "edit-coach" && id && role === "admin") {
      modalState = { type: "edit-coach", id };
      rerenderPage("rekomendasi");
      return true;
    }

    if (action === "delete-coach" && id && role === "admin") {
      const plan = coachPlans.find(item => item.id === id);
      if (!plan) return true;

      if (window.confirm(`Hapus rekomendasi "${plan.title}" untuk ${plan.athleteName}?`)) {
        coachPlans = coachPlans.filter(item => item.id !== id);
        if (saveCoachPlans()) rerenderPage("rekomendasi");
      }
      return true;
    }

    return false;
  }

  function handleSubmit(event, role, rerenderPage) {
    const form = event.target.closest("#coachRecommendationForm");
    if (!form) return false;

    event.preventDefault();

    if (role !== "admin") {
      window.alert("Hanya admin/pelatih yang dapat membuat rekomendasi pelatih.");
      return true;
    }

    const data = new FormData(form);
    const athleteName = String(data.get("athleteName") || "").trim();
    const athleteProfile = window.AeroFitCloud ? window.AeroFitCloud.getProfileByName(athleteName) : null;
    const plan = {
      athleteName,
      athleteUid: athleteProfile ? athleteProfile.uid : null,
      category: String(data.get("category") || "").trim(),
      title: String(data.get("title") || "").trim(),
      priority: String(data.get("priority") || "Sedang"),
      frequency: String(data.get("frequency") || "").trim(),
      duration: String(data.get("duration") || "").trim(),
      coachName: String(data.get("coachName") || "").trim() || "Pelatih AeroFit",
      goal: String(data.get("goal") || "").trim(),
      plan: String(data.get("plan") || "").trim()
    };

    const errorBox = form.querySelector("#coachFormError");
    let error = "";

    if (!plan.athleteName || !plan.category || !plan.title || !plan.frequency || !plan.duration || !plan.plan) {
      error = "Lengkapi semua kolom wajib yang bertanda *.";
    } else if (!athleteProfile) {
      error = "Pilih taruna yang sudah memiliki akun terdaftar.";
    } else if (!categories.includes(plan.category)) {
      error = "Bidang latihan tidak valid.";
    } else if (!["Rendah", "Sedang", "Tinggi"].includes(plan.priority)) {
      error = "Prioritas tidak valid.";
    }

    if (error) {
      errorBox.textContent = error;
      return true;
    }

    const mode = form.dataset.mode;
    const id = form.dataset.id;

    if (mode === "edit" && id) {
      coachPlans = coachPlans.map(item => item.id === id
        ? { ...item, ...plan, updatedAt: new Date().toISOString() }
        : item
      );
    } else {
      coachPlans.push({
        id: `coach-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        ...plan,
        createdDate: dateToday(),
        createdAt: new Date().toISOString()
      });
    }

    if (saveCoachPlans()) {
      selectedAthlete = "semua";
      searchTerm = "";
      closeAndRender(rerenderPage);
    }

    return true;
  }

  function handleInput(event) {
    if (event.target.id === "recommendationSearch") {
      searchTerm = event.target.value;
      // Search is applied after the next render/filter action.
    }
  }

  function handleChange(event, rerenderPage) {
    if (event.target.id === "recommendationAthleteFilter") {
      selectedAthlete = event.target.value;
      rerenderPage("rekomendasi");
    }
  }

  function handleKeydown(event, rerenderPage) {
    if (event.key === "Escape" && modalState) closeAndRender(rerenderPage);
  }

  window.RekomendasiApp = {
    render: renderPage,
    reloadFromStorage() {
      results = loadJson(RESULTS_KEY, []);
      coachPlans = loadJson(COACH_KEY, []);
    },
    handleClick,
    handleSubmit,
    handleInput,
    handleChange,
    handleKeydown
  };
})();
