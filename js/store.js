const Store = (() => {
  const KEY = "lc.data.v1";
  const SHELF_URL = "https://raw.githubusercontent.com/DyZ6djEmP6SD4RFee9bHT6JC35sHa45Bf/lucy-care-shelf/main/data/estudos.json";
  function today() {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Lisbon" });
  }
  function empty() {
    return {
      profile: {
        name: "Lucy",
        age: "~2 anos e 5 meses (nasc. 01/04/2024 João XXI)",
        weightKg: "",
        diagnosis: "Astenia cutânea / EDS clínico (VetOlaias 17/12/2024, sem teste genético).",
        meds: "Doses: o vet. Alta AniCura tutor 07/09/2026.",
        vet: "João XXI 218 489 230. AniCura 213 156 207 / 927 427 505.",
        allergies: "",
        likes: "Liô; colar-flor mole; caixa com penas."
      },
      checks: [], wounds: [], docs: [], research: [], seeded: false, seedRev: 0
    };
  }
  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
    return data;
  }
  function after() {
    if (typeof Sync !== "undefined") Sync.sync().catch(() => {});
  }
  function seedIfNeeded(data) {
    const catalog = [
      { id: "w-dianteira-esq-2026-08-19", opened: "2026-08-19", where: "Pata dianteira esquerda", sizeCm: "4", status: "a_cicatrizar", cause: "Brincadeira com o outro gato." },
      { id: "w-traseira-esq-2026-08-25", opened: "2026-08-25", where: "Pata traseira esquerda", sizeCm: "7", status: "aberta", cause: "Contenção AniCura: 4 assistentes." }
    ];
    const have = new Set((data.wounds || []).map((w) => w.id));
    catalog.forEach((w) => { if (!have.has(w.id)) data.wounds.push(w); });
    if (!Array.isArray(data.research)) data.research = [];
    if (!Array.isArray(data.docs)) data.docs = [];
    data.seeded = true; data.seedRev = 3; return save(data);
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return seedIfNeeded(empty());
      const data = JSON.parse(raw);
      const merged = { ...empty(), ...data, profile: { ...empty().profile, ...(data.profile || {}) }, checks: data.checks || [], wounds: data.wounds || [], docs: data.docs || [], research: data.research || [], seedRev: Number(data.seedRev) || 0 };
      if (!merged.seeded || merged.seedRev < 3) return seedIfNeeded(merged);
      return merged;
    } catch { return seedIfNeeded(empty()); }
  }
  function mergeResearch(list) {
    const data = load();
    if (!Array.isArray(data.research)) data.research = [];
    const have = new Set(data.research.map((x) => x.id));
    (list || []).forEach((p) => { if (p && p.id && !have.has(p.id)) data.research.push(p); });
    return save(data);
  }
  async function pullShelf() {
    const res = await fetch(SHELF_URL + "?t=" + Date.now(), { cache: "no-store" });
    if (!res.ok) throw new Error("Prateleira indisponível.");
    const json = await res.json();
    if (!json || !Array.isArray(json.research)) throw new Error("Prateleira inválida.");
    mergeResearch(json.research);
    return json;
  }
  return {
    today, load, save, KEY, pullShelf, mergeResearch,
    upsertCheck(partial) {
      const data = load();
      const date = partial.date || today();
      const next = { date, appetite: "normal", water: true, energy: 3, pain: 1, litter: "normal", vomit: false, mimo: false, note: "", newTear: false, tearWhere: "", tearSize: "", dressingOn: false, nailsTrimmed: false, ...partial };
      const i = data.checks.findIndex((c) => c.date === date);
      if (i >= 0) data.checks[i] = { ...data.checks[i], ...next }; else data.checks.unshift(next);
      save(data); after(); return data;
    },
    checkFor: (d) => load().checks.find((c) => c.date === d) || null,
    addWound(w) { const data = load(); data.wounds.unshift({ id: "w" + Date.now(), opened: today(), where: "", status: "aberta", note: "", ...w }); save(data); after(); return data; },
    setWoundStatus(id, status) { const data = load(); const w = data.wounds.find((x) => x.id === id); if (w) w.status = status; save(data); after(); return data; },
    addDoc(doc) { const data = load(); data.docs = data.docs || []; data.docs.unshift(doc); return save(data); },
    saveProfile(p) { const data = load(); data.profile = { ...data.profile, ...p }; save(data); after(); return data; },
    exportJson: () => JSON.stringify(load(), null, 2),
    importJson(text) {
      const parsed = JSON.parse(text);
      const cur = load();
      if (Array.isArray(parsed.research) && parsed.checks === undefined) return mergeResearch(parsed.research);
      const out = save({ ...empty(), ...cur, ...parsed, profile: { ...empty().profile, ...cur.profile, ...(parsed.profile || {}) }, docs: parsed.docs || cur.docs || [] });
      after(); return out;
    },
    alerts(data) {
      const out = []; const last = data.checks[0];
      if (last && last.appetite === "nada") out.push("Não comeu. Se passar das 24 h, liga ao vet.");
      if (last && last.vomit) out.push("Vómito ou diarreia hoje.");
      if (last && last.pain >= 4) out.push("Dor alta — fala com o vet.");
      return out;
    }
  };
})();
