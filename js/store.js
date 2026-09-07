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
        age: "~2 anos e 5 meses (nasc. 01/04/2024 Jo\u00e3o XXI)",
        weightKg: "",
        diagnosis: "Astenia cut\u00e2nea / EDS cl\u00ednico (VetOlaias 17/12/2024, sem teste gen\u00e9tico).",
        meds: "Doses: o vet. Alta AniCura tutor 07/09/2026.",
        vet: "Jo\u00e3o XXI 218 489 230. AniCura 213 156 207 / 927 427 505.",
        allergies: "",
        likes: "Li\u00f4; colar-flor mole; caixa com penas."
      },
      checks: [], wounds: [], research: [], seeded: false, seedRev: 0
    };
  }
  function save(data) { localStorage.setItem(KEY, JSON.stringify(data)); return data; }
  function seedIfNeeded(data) {
    const catalog = [
      { id: "w-dianteira-esq-2026-08-19", opened: "2026-08-19", where: "Pata dianteira esquerda", sizeCm: "4", status: "a_cicatrizar", cause: "Brincadeira com o outro gato." },
      { id: "w-traseira-esq-2026-08-25", opened: "2026-08-25", where: "Pata traseira esquerda", sizeCm: "7", status: "aberta", cause: "Conten\u00e7\u00e3o AniCura: 4 assistentes." }
    ];
    const have = new Set((data.wounds || []).map((w) => w.id));
    catalog.forEach((w) => { if (!have.has(w.id)) data.wounds.push(w); });
    if (!Array.isArray(data.research)) data.research = [];
    data.seeded = true; data.seedRev = 3; return save(data);
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return seedIfNeeded(empty());
      const data = JSON.parse(raw);
      const merged = { ...empty(), ...data, profile: { ...empty().profile, ...(data.profile || {}) }, checks: data.checks || [], wounds: data.wounds || [], research: data.research || [], seedRev: Number(data.seedRev) || 0 };
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
    const res = await fetch(SHELF_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Prateleira indispon\u00edvel.");
    const json = await res.json();
    if (!json || !Array.isArray(json.research)) throw new Error("Prateleira inv\u00e1lida.");
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
      return save(data);
    },
    checkFor: (d) => load().checks.find((c) => c.date === d) || null,
    addWound(w) { const data = load(); data.wounds.unshift({ id: "w" + Date.now(), opened: today(), where: "", status: "aberta", note: "", ...w }); return save(data); },
    setWoundStatus(id, status) { const data = load(); const w = data.wounds.find((x) => x.id === id); if (w) w.status = status; return save(data); },
    saveProfile(p) { const data = load(); data.profile = { ...data.profile, ...p }; return save(data); },
    exportJson: () => JSON.stringify(load(), null, 2),
    importJson(text) {
      const parsed = JSON.parse(text);
      const cur = load();
      if (Array.isArray(parsed.research) && parsed.checks === undefined) return mergeResearch(parsed.research);
      return save({ ...empty(), ...cur, ...parsed, profile: { ...empty().profile, ...cur.profile, ...(parsed.profile || {}) } });
    },
    alerts(data) {
      const out = []; const last = data.checks[0];
      if (last && last.appetite === "nada") out.push("N\u00e3o comeu. Se passar das 24 h, liga ao vet.");
      if (last && last.vomit) out.push("V\u00f3mito ou diarreia hoje.");
      if (last && last.pain >= 4) out.push("Dor alta — fala com o vet.");
      return out;
    }
  };
})();
