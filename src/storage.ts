(() => {
  const root = globalThis as unknown as Window;
  const FOXFIRE = (root.__foxfire ??= {} as Wisp);

  FOXFIRE.loadMap = async function loadMap(): Promise<SlotImageMap> {
    return new Promise((resolve) => {
      chrome.storage.local.get(
        [FOXFIRE.STORE_KEY],
        (res: Record<string, SlotImageMap>) => {
          const err = chrome.runtime?.lastError;
          if (err) {
            console.warn("FOXFIRE loadMap error:", err.message || err);
            resolve({});
            return;
          }
          resolve(res[FOXFIRE.STORE_KEY] || {});
        },
      );
    });
  };

  FOXFIRE.saveMap = async function saveMap(map: SlotImageMap): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [FOXFIRE.STORE_KEY]: map }, () => {
        const err = chrome.runtime?.lastError;
        if (err) {
          console.warn("FOXFIRE saveMap error:", err.message || err);
        }
        resolve();
      });
    });
  };
})();
