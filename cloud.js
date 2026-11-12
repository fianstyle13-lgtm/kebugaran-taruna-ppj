(() => {
  "use strict";

  const CACHE_KEYS = {
    schedules: "aerofit_schedules_v1",
    results: "aerofit_results_v1",
    recommendations: "aerofit_coach_recommendations_v1",
    targets: "aerofit_targets_v1",
    profiles: "aerofit_profiles_v1"
  };

  let auth = null;
  let db = null;
  let currentUser = null;
  let currentProfile = null;
  let profiles = [];
  let unsubscribers = [];
  let initialized = false;
  let syncCallback = null;

  function configIsReady() {
    const config = window.AEROFIT_FIREBASE_CONFIG;
    return Boolean(
      config &&
      config.apiKey && !config.apiKey.startsWith("ISI_") &&
      config.projectId && !config.projectId.startsWith("ISI_") &&
      config.appId && !config.appId.startsWith("ISI_")
    );
  }

  function initialize() {
    if (initialized) return true;
    if (!window.firebase) throw new Error("Firebase SDK belum dimuat.");
    if (!configIsReady()) throw new Error("Konfigurasi Firebase belum diisi. Lengkapi file js/firebase-config.js.");

    if (!firebase.apps.length) {
      firebase.initializeApp(window.AEROFIT_FIREBASE_CONFIG);
    }
    auth = firebase.auth();
    db = firebase.firestore();
    initialized = true;
    return true;
  }

  function getAuth() { return auth; }
  function getDb() { return db; }
  function getCurrentUser() { return currentUser; }
  function getCurrentProfile() { return currentProfile; }
  function getProfiles() { return [...profiles]; }

  function getProfileByName(name) {
    const target = String(name || "").trim().toLocaleLowerCase("id");
    return profiles.find(profile =>
      String(profile.displayName || "").trim().toLocaleLowerCase("id") === target
    ) || null;
  }

  function setCurrentSession(user, profile) {
    currentUser = user;
    currentProfile = profile;
  }

  function cacheArray(key, items) {
    try {
      localStorage.setItem(CACHE_KEYS[key], JSON.stringify(items));
    } catch (error) {
      console.error(`AeroFit: cache ${key} gagal diperbarui.`, error);
    }
  }

  function readLocalArray(key) {
    try {
      const value = JSON.parse(localStorage.getItem(CACHE_KEYS[key]) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function isStaff() {
    return Boolean(currentProfile && ["admin", "pelatih"].includes(currentProfile.role));
  }

  function normalizeProfile(user, data) {
    return {
      uid: user.uid,
      displayName: String(data.displayName || user.displayName || user.email || "Taruna").trim(),
      email: data.email || user.email || "",
      role: ["admin", "pelatih", "taruna"].includes(data.role) ? data.role : "taruna",
      createdAt: data.createdAt || new Date().toISOString()
    };
  }

  async function ensureProfile(user) {
    const ref = db.collection("users").doc(user.uid);
    const snapshot = await ref.get();

    if (!snapshot.exists) {
      const profile = normalizeProfile(user, {
        displayName: user.displayName || user.email,
        email: user.email,
        role: "taruna",
        createdAt: new Date().toISOString()
      });
      await ref.set(profile);
      return profile;
    }

    const profile = normalizeProfile(user, snapshot.data());
    if (profile.role !== snapshot.data().role || profile.displayName !== snapshot.data().displayName) {
      // The profile role is always read from Firestore, never from a browser selector.
      profile.role = snapshot.data().role || "taruna";
    }
    return profile;
  }

  function updateLocalModules() {
    if (window.JadwalApp && window.JadwalApp.reloadFromStorage) window.JadwalApp.reloadFromStorage();
    if (window.HasilApp && window.HasilApp.reloadFromStorage) window.HasilApp.reloadFromStorage();
    if (window.RekomendasiApp && window.RekomendasiApp.reloadFromStorage) window.RekomendasiApp.reloadFromStorage();
    if (syncCallback) syncCallback();
  }

  function unsubscribeAll() {
    unsubscribers.forEach(unsubscribe => {
      try { unsubscribe(); } catch (error) { console.warn(error); }
    });
    unsubscribers = [];
  }

  async function migrateLegacyData(profile) {
    const flag = `aerofit_firestore_migrated_${profile.uid}`;
    if (localStorage.getItem(flag) === "true") return;

    const roleIsStaff = ["admin", "pelatih"].includes(profile.role);
    const userSnapshot = roleIsStaff
      ? await db.collection("users").get()
      : await db.collection("users").doc(profile.uid).get();

    const userDocs = roleIsStaff
      ? userSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }))
      : (userSnapshot.exists ? [{ uid: userSnapshot.id, ...userSnapshot.data() }] : []);

    const byName = new Map(userDocs.map(item => [
      String(item.displayName || "").trim().toLocaleLowerCase("id"),
      item.uid
    ]));

    const migration = [];
    const schedules = roleIsStaff ? readLocalArray("schedules") : [];
    const oldResults = readLocalArray("results");
    const oldRecommendations = roleIsStaff ? readLocalArray("recommendations") : [];
    const oldTargets = roleIsStaff ? readLocalArray("targets") : [];

    schedules.forEach(item => migration.push({
      collection: "schedules",
      id: item.id,
      data: { ...item, createdByUid: item.createdByUid || profile.uid }
    }));

    
oldResults.forEach(item => {
  const existingUid = item.ownerUid || item.athleteUid || null;

  const itemName = String(item.athleteName || "")
    .trim()
    .toLocaleLowerCase("id");

  const currentName = String(profile.displayName || "")
    .trim()
    .toLocaleLowerCase("id");

  let ownerUid = existingUid || byName.get(itemName) || null;

  if (!roleIsStaff) {
    const belongsToCurrentUser =
      existingUid === profile.uid ||
      (!existingUid && itemName === currentName);

    if (!belongsToCurrentUser) {
      return;
    }

    ownerUid = profile.uid;
  }

  migration.push({
    collection: "results",
    id: item.id,
    data: {
      ...item,
      ownerUid: ownerUid || null,
      athleteUid: ownerUid || null
    }
  });
});


    oldRecommendations.forEach(item => {
      const athleteUid = item.athleteUid || byName.get(String(item.athleteName || "").trim().toLocaleLowerCase("id")) || null;
      migration.push({
        collection: "recommendations",
        id: item.id,
        data: { ...item, athleteUid }
      });
    });

    oldTargets.forEach(item => {
      const athleteUid = item.athleteUid || byName.get(String(item.athleteName || "").trim().toLocaleLowerCase("id")) || null;
      migration.push({
        collection: "targets",
        id: item.id,
        data: { ...item, athleteUid }
      });
    });

    // Keep migration writes comfortably below Firestore's 500-operation batch limit.
    for (let start = 0; start < migration.length; start += 400) {
      const batch = db.batch();
      migration.slice(start, start + 400).forEach(item => {
        if (!item.id) return;
        batch.set(db.collection(item.collection).doc(String(item.id)), {
          ...item.data,
          migratedFromLocal: true,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      });
      await batch.commit();
    }

    localStorage.setItem(flag, "true");
  }

  function listenCollection(collectionName, query, cacheName) {
    return new Promise((resolve, reject) => {
      let firstSnapshot = true;
      const unsubscribe = query.onSnapshot(snapshot => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (cacheName === "profiles") profiles = items;
        cacheArray(cacheName, items);
        if (firstSnapshot) {
          firstSnapshot = false;
          resolve();
        }
        updateLocalModules();
      }, error => {
        console.error(`AeroFit: gagal menyinkronkan ${collectionName}.`, error);
        if (firstSnapshot) {
          firstSnapshot = false;
          reject(error);
        }
        if (syncCallback) syncCallback(error);
      });
      unsubscribers.push(unsubscribe);
    });
  }

  async function startSync(profile, onChange) {
    unsubscribeAll();
    currentProfile = profile;
    syncCallback = onChange || null;

    await migrateLegacyData(profile);

    const staff = ["admin", "pelatih"].includes(profile.role);
    const waits = [];

    if (staff) {
      waits.push(listenCollection("users", db.collection("users"), "profiles"));
    } else {
      profiles = [profile];
      cacheArray("profiles", profiles);
    }

    waits.push(listenCollection("schedules", db.collection("schedules"), "schedules"));

    const resultsQuery = staff
      ? db.collection("results")
      : db.collection("results").where("ownerUid", "==", profile.uid);
    waits.push(listenCollection("results", resultsQuery, "results"));

    const recommendationsQuery = staff
      ? db.collection("recommendations")
      : db.collection("recommendations").where("athleteUid", "==", profile.uid);
    waits.push(listenCollection("recommendations", recommendationsQuery, "recommendations"));

    const targetsQuery = staff
      ? db.collection("targets")
      : db.collection("targets").where("athleteUid", "==", profile.uid);
    waits.push(listenCollection("targets", targetsQuery, "targets"));

    // Wait until every initial snapshot has arrived before enabling the app.
    // This prevents an early save from replacing remote data with an incomplete local cache.
    await Promise.all(waits);
    updateLocalModules();
  }

  async function persist(collectionName, items) {
    if (!db || !currentUser || !currentProfile) return;
    const staff = isStaff();

    if (["schedules", "recommendations", "targets"].includes(collectionName) && !staff) {
      throw new Error("Akses ditolak: hanya admin/pelatih yang dapat mengubah data ini.");
    }

    if (collectionName === "results" && !Array.isArray(items)) {
      throw new Error("Data hasil latihan tidak valid.");
    }

    const collectionRef = db.collection(collectionName);
    let existingQuery = collectionRef;
    if (collectionName === "results" && !staff) {
      existingQuery = collectionRef.where("ownerUid", "==", currentUser.uid);
    }

    const existingSnapshot = await existingQuery.get();
    const ids = new Set(items.map(item => String(item.id)));
    const operations = [];

    existingSnapshot.docs.forEach(doc => {
      if (!ids.has(doc.id)) operations.push({ type: "delete", ref: doc.ref });
    });

    for (const item of items) {
      if (!item.id) continue;
      const data = { ...item, updatedAt: new Date().toISOString() };

      if (collectionName === "schedules") {
        data.createdByUid = data.createdByUid || currentUser.uid;
      }

      if (collectionName === "results") {
        if (!staff) {
          data.ownerUid = currentUser.uid;
          data.athleteUid = currentUser.uid;
          data.athleteName = currentProfile.displayName;
        } else {
          const matched = getProfileByName(data.athleteName);
          data.ownerUid = data.ownerUid || (matched ? matched.uid : null);
          data.athleteUid = data.athleteUid || data.ownerUid;
        }
      }

      if (collectionName === "recommendations" || collectionName === "targets") {
        const matched = getProfileByName(data.athleteName);
        data.athleteUid = data.athleteUid || (matched ? matched.uid : null);
        // Legacy items without a matching account remain staff-only until reassigned.
      }

      operations.push({
        type: "set",
        ref: collectionRef.doc(String(item.id)),
        data
      });
    }

    for (let start = 0; start < operations.length; start += 450) {
      const batch = db.batch();
      operations.slice(start, start + 450).forEach(operation => {
        if (operation.type === "delete") batch.delete(operation.ref);
        else batch.set(operation.ref, operation.data, { merge: true });
      });
      await batch.commit();
    }
  }

  function stopSync() {
    unsubscribeAll();
    currentUser = null;
    currentProfile = null;
    profiles = [];
    syncCallback = null;
  }

  function refreshProfilesFromCache() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CACHE_KEYS.profiles) || "[]");
      profiles = Array.isArray(parsed) ? parsed : [];
    } catch {
      profiles = [];
    }
  }

  window.AeroFitCloud = {
    initialize,
    getAuth,
    getDb,
    getCurrentUser,
    getCurrentProfile,
    setCurrentSession,
    getProfiles,
    getProfileByName,
    ensureProfileForAuth: ensureProfile,
    isStaff,
    startSync,
    stopSync,
    persist,
    refreshProfilesFromCache,
    configIsReady
  };
})();
