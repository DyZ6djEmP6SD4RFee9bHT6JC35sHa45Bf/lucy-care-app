const Sync = (() => {
  const HK = "lc.house.v1";
  const house = () => (localStorage.getItem(HK) || "").trim();
  const setHouse = (h) => localStorage.setItem(HK, (h || "").trim());
  async function sync() {
    throw new Error("Sincronizacao remota desligada. Usa Exportar / Importar JSON.");
  }
  async function upload() {
    throw new Error("Envio remoto desligado. Os documentos ficam so neste aparelho.");
  }
  return { house, setHouse, sync, upload };
})();
