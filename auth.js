(() => {
  "use strict";

  let mode = "login";
  let initialized = false;
  let authListenerAttached = false;
  let profile = null;

  const authScreen = document.getElementById("authScreen");
  const appShell = document.querySelector(".app-shell");

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[character]);
  }

  function setBusy(form, busy) {
    const button = form.querySelector('button[type="submit"]');
    if (!button) return;
    button.disabled = busy;
    button.textContent = busy ? "Memproses..." : (mode === "login" ? "Masuk ke AeroFit" : "Buat Akun Taruna");
  }

  function showError(form, message) {
    const error = form.querySelector(".auth-error");
    if (error) error.textContent = message;
  }

  function renderSetupRequired() {
    authScreen.innerHTML = `
      <main class="auth-card auth-setup-card">
        <div class="auth-brand">
          <div class="brand-mark">A</div>
          <div><strong>AeroFit</strong><span>Taruna Fitness System</span></div>
        </div>
        <p class="eyebrow">TAHAP 6 · LOGIN & DATABASE</p>
        <h1>Konfigurasi Firebase diperlukan</h1>
        <p class="auth-description">AeroFit Tahap 6 menggunakan Firebase Authentication dan Cloud Firestore agar akun serta data latihan dapat tersinkronisasi antarperangkat.</p>
        <ol class="auth-setup-list">
          <li>Buat project di Firebase Console.</li>
          <li>Tambahkan aplikasi Web dan salin konfigurasi Firebase.</li>
          <li>Isi file <code>js/firebase-config.js</code>.</li>
          <li>Aktifkan Email/Password Authentication dan buat Firestore Database.</li>
          <li>Pasang aturan keamanan dari file <code>firestore.rules</code>.</li>
        </ol>
        <div class="auth-help-note">Panduan lengkap tersedia pada README.md di folder project. Setelah konfigurasi diisi, muat ulang halaman.</div>
      </main>
    `;
    authScreen.hidden = false;
    appShell.hidden = true;
  }

  function renderAuth() {
    const isRegister = mode === "register";
    authScreen.innerHTML = `
      <main class="auth-card">
        <div class="auth-brand">
          <div class="brand-mark">A</div>
          <div><strong>AeroFit</strong><span>Taruna Fitness System</span></div>
        </div>

        <p class="eyebrow">POLITEKNIK PENERBANGAN JAYAPURA</p>
        <h1>${isRegister ? "Buat akun taruna" : "Selamat datang kembali"}</h1>
        <p class="auth-description">${isRegister
          ? "Daftarkan akun untuk menyimpan jadwal, hasil latihan, dan perkembangan kebugaran."
          : "Masuk untuk mengakses jadwal dan pemantauan kebugaran sesuai hak akses akun."}</p>

        <form id="authForm" class="auth-form" novalidate>
          ${isRegister ? `
            <label class="form-field">
              <span>Nama lengkap <b>*</b></span>
              <input name="displayName" type="text" maxlength="80" required autocomplete="name" placeholder="Nama lengkap taruna">
            </label>
          ` : ""}
          <label class="form-field">
            <span>Email <b>*</b></span>
            <input name="email" type="email" required autocomplete="email" placeholder="nama@email.com">
          </label>
          <label class="form-field">
            <span>Password <b>*</b></span>
            <input name="password" type="password" minlength="6" required autocomplete="${isRegister ? "new-password" : "current-password"}" placeholder="Minimal 6 karakter">
          </label>
          ${isRegister ? `
            <label class="form-field">
              <span>Konfirmasi password <b>*</b></span>
              <input name="confirmPassword" type="password" minlength="6" required autocomplete="new-password" placeholder="Ulangi password">
            </label>
          ` : ""}
          <p class="auth-error" role="alert"></p>
          <button type="submit" class="primary-button auth-submit">${isRegister ? "Buat Akun Taruna" : "Masuk ke AeroFit"}</button>
        </form>

        <div class="auth-switch">
          ${isRegister
            ? `Sudah memiliki akun? <button type="button" data-auth-action="login">Masuk</button>`
            : `Belum memiliki akun? <button type="button" data-auth-action="register">Daftar sebagai Taruna</button>`}
        </div>

        ${!isRegister ? `<button type="button" class="auth-forgot" data-auth-action="reset">Lupa password?</button>` : ""}
        <p class="auth-security-note">Pendaftaran mandiri hanya membuat akun Taruna. Akun Admin dan Pelatih diberikan oleh pengelola sistem.</p>
      </main>
    `;
    authScreen.hidden = false;
    appShell.hidden = true;
  }

  function mapAuthError(error) {
    const code = error && error.code ? error.code : "";
    const messages = {
      "auth/invalid-email": "Format email tidak valid.",
      "auth/user-not-found": "Akun tidak ditemukan. Periksa email atau daftar terlebih dahulu.",
      "auth/wrong-password": "Password yang dimasukkan salah.",
      "auth/invalid-credential": "Email atau password salah.",
      "auth/email-already-in-use": "Email sudah terdaftar. Silakan masuk.",
      "auth/weak-password": "Password terlalu lemah. Gunakan minimal 6 karakter.",
      "auth/too-many-requests": "Terlalu banyak percobaan. Coba lagi beberapa saat.",
      "auth/network-request-failed": "Koneksi internet bermasalah. Periksa jaringan lalu coba lagi.",
      "permission-denied": "Akses Firestore ditolak. Periksa firestore.rules."
    };
    return messages[code] || error.message || "Terjadi kesalahan. Silakan coba kembali.";
  }

  async function handleAuthSubmit(event) {
    const form = event.target.closest("#authForm");
    if (!form) return;
    event.preventDefault();

    const data = new FormData(form);
    const email = String(data.get("email") || "").trim().toLowerCase();
    const password = String(data.get("password") || "");
    const displayName = String(data.get("displayName") || "").trim();
    const confirmPassword = String(data.get("confirmPassword") || "");

    if (!email || !password) {
      showError(form, "Email dan password wajib diisi.");
      return;
    }
    if (mode === "register" && !displayName) {
      showError(form, "Nama lengkap wajib diisi.");
      return;
    }
    if (mode === "register" && password !== confirmPassword) {
      showError(form, "Konfirmasi password tidak sama.");
      return;
    }
    if (password.length < 6) {
      showError(form, "Password minimal 6 karakter.");
      return;
    }

    setBusy(form, true);
    showError(form, "");

    try {
      const auth = window.AeroFitCloud.getAuth();
      if (mode === "register") {
        const credential = await auth.createUserWithEmailAndPassword(email, password);
        await credential.user.updateProfile({ displayName });
        const profileData = {
          uid: credential.user.uid,
          displayName,
          email,
          role: "taruna",
          createdAt: new Date().toISOString()
        };
        await window.AeroFitCloud.getDb().collection("users").doc(credential.user.uid).set(profileData);
        await handleAuthState(credential.user);
      } else {
        await auth.signInWithEmailAndPassword(email, password);
      }
    } catch (error) {
      setBusy(form, false);
      showError(form, mapAuthError(error));
    }
  }

  async function handleResetPassword() {
    const emailInput = authScreen.querySelector('input[name="email"]');
    const email = emailInput ? emailInput.value.trim() : "";
    if (!email) {
      const error = authScreen.querySelector(".auth-error");
      if (error) error.textContent = "Masukkan email terlebih dahulu, lalu klik Lupa password.";
      return;
    }
    try {
      await window.AeroFitCloud.getAuth().sendPasswordResetEmail(email);
      const error = authScreen.querySelector(".auth-error");
      if (error) {
        error.textContent = "Email untuk mengatur ulang password telah dikirim jika alamat tersebut terdaftar.";
        error.classList.add("auth-success");
      }
    } catch (error) {
      const box = authScreen.querySelector(".auth-error");
      if (box) box.textContent = mapAuthError(error);
    }
  }

  function handleAuthClick(event) {
    const button = event.target.closest("[data-auth-action]");
    if (!button) return;
    const action = button.dataset.authAction;

    if (action === "login" || action === "register") {
      mode = action;
      renderAuth();
    } else if (action === "reset") {
      handleResetPassword();
    }
  }

  function updateHeader(profileData) {
    const name = document.getElementById("accountName");
    const role = document.getElementById("accountRole");
    const avatar = document.getElementById("userAvatar");
    if (name) name.textContent = profileData.displayName || "Pengguna";
    if (role) role.textContent = profileData.role === "admin"
      ? "Administrator"
      : profileData.role === "pelatih" ? "Pelatih" : "Taruna";
    if (avatar) avatar.textContent = (profileData.displayName || "A").trim().charAt(0).toUpperCase();
  }

  async function handleAuthState(user) {
    if (!user) {
      window.AeroFitCloud.stopSync();
      profile = null;
      if (window.AeroFitApp) window.AeroFitApp.stop();
      mode = "login";
      renderAuth();
      return;
    }

    try {
      const profileData = await window.AeroFitCloud.ensureProfileForAuth(user);
      profile = profileData;
      window.AeroFitCloud.setCurrentSession(user, profileData);
      await window.AeroFitCloud.startSync(profileData, error => {
        if (window.AeroFitApp) window.AeroFitApp.refresh(error);
      });
      updateHeader(profileData);
      authScreen.hidden = true;
      appShell.hidden = false;
      if (window.AeroFitApp) window.AeroFitApp.start(profileData);
    } catch (error) {
      console.error(error);
      window.AeroFitCloud.getAuth().signOut();
      renderAuth();
      const box = authScreen.querySelector(".auth-error");
      if (box) box.textContent = mapAuthError(error);
    }
  }

  async function init() {
    if (initialized) return;
    initialized = true;

    try {
      window.AeroFitCloud.initialize();
    } catch (error) {
      renderSetupRequired();
      return;
    }

    authScreen.addEventListener("submit", handleAuthSubmit);
    authScreen.addEventListener("click", handleAuthClick);

    const auth = window.AeroFitCloud.getAuth();
    try {
      await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    } catch (error) {
      console.warn("AeroFit: persistence tidak dapat diatur.", error);
    }

    if (!authListenerAttached) {
      authListenerAttached = true;
      auth.onAuthStateChanged(handleAuthState);
    }
  }

  async function logout() {
    if (!window.AeroFitCloud.getAuth()) return;
    await window.AeroFitCloud.getAuth().signOut();
  }

  window.AeroFitAuth = {
    init,
    logout,
    getProfile: () => profile
  };
})();
