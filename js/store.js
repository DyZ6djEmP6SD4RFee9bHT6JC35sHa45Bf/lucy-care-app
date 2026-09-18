const Store = (() => {
  const KEY = "lc.data.v1";
  const SHELF_URL = "https://raw.githubusercontent.com/DyZ6djEmP6SD4RFee9bHT6JC35sHa45Bf/lucy-care-shelf/main/data/estudos.json";
  function today() {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Lisbon" });
  }
  function empty() {
    return {
      profile: { name: "Lucy", age: "", weightKg: "", diagnosis: "", meds: "", vet: "", allergies: "", likes: "" },
      checks: [], wounds: [], docs: [], research: [], seeded: true, seedRev: 4
    };
  }
  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
    return data;
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return empty();
      const data = JSON.parse(raw);
      return {
        profile: Object.assign(empty().profile, data.profile || {}),
        checks: Array.isArray(data.checks) ? data.checks : [],
        wounds: Array.isArray(data.wounds) ? data.wounds : [],
        docs: Array.isArray(data.docs) ? data.docs : [],
        research: Array.isArray(data.research) ? data.research : [],
        seeded: true,
        seedRev: 4
      };
    } catch { return empty(); }
  }
  function mergeResearch(list) {
    const data = load();
    const have = new Set((data.research || []).map((x) => x.id));
    (list || []).forEach((p) => { if (p && p.id && !have.has(p.id)) data.research.push(p); });
    return save(data);
  }
  async function pullShelf() {
    const res = await fetch(SHELF_URL + "?t=" + Date.now(), { cache: "no-store" });
    if (!res.ok) throw new Error("Prateleira indisponivel.");
    const json = await res.json();
    if (!json || !Array.isArray(json.research)) throw new Error("Prateleira invalida.");
    mergeResearch(json.research);
    return json;
  }
  return {
    today, load, save, KEY, pullShelf, mergeResearch,
    upsertCheck(partial) {
      const data = load();
      const date = partial.date || today();
      const next = Object.assign({ date, appetite: "normal", water: true, energy: 3, pain: 1, litter: "normal", vomit: false, mimo: false, note: "", newTear: false, tearWhere: "", tearSize: "", dressingOn: false, nailsTrimmed: false }, partial);
      const i = data.checks.findIndex((c) => c.date === date);
      if (i >= 0) data.checks[i] = Object.assign({}, data.checks[i], next); else data.checks.unshift(next);
      return save(data);
    },
    checkFor: (d) => load().checks.find((c) => c.date === d) || null,
    addWound(w) { const data = load(); data.wounds.unshift(Object.assign({ id: "w" + Date.now(), opened: today(), where: "", status: "aberta", note: "" }, w)); return save(data); },
    setWoundStatus(id, status) { const data = load(); const w = data.wounds.find((x) => x.id === id); if (w) w.status = status; return save(data); },
    addDoc(doc) { const data = load(); data.docs = data.docs || []; data.docs.unshift(doc); return save(data); },
    saveProfile(p) { const data = load(); data.profile = Object.assign({}, data.profile, p); return save(data); },
    exportJson: () => JSON.stringify(load(), null, 2),
    importJson(text) {
      const parsed = JSON.parse(text);
      const cur = load();
      if (Array.isArray(parsed.research) && parsed.checks === undefined) return mergeResearch(parsed.research);
      return save({
        profile: Object.assign({}, empty().profile, cur.profile, parsed.profile || {}),
        checks: parsed.checks || cur.checks || [],
        wounds: parsed.wounds || cur.wounds || [],
        docs: parsed.docs || cur.docs || [],
        research: parsed.research || cur.research || [],
        seeded: true, seedRev: 4
      });
    },
    alerts(data) {
      const out = []; const last = data.checks[0];
      if (last && last.appetite === "nada") out.push("Nao comeu. Se passar das 24 h, liga ao vet.");
      if (last && last.vomit) out.push("Vomito ou diarreia hoje.");
      if (last && last.pain >= 4) out.push("Dor alta — fala com o vet.");
      return out;
    }
  };
})();
