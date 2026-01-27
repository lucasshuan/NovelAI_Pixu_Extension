(() => {
  const root = globalThis as unknown as Window;
  const WISP = (root.__wisp ??= {} as Wisp);

  WISP.loadMap = async function loadMap(): Promise<SlotImageMap> {
    return new Promise((resolve) => {
      chrome.storage.local.get(
        [WISP.STORE_KEY],
        (res: Record<string, SlotImageMap>) =>
          resolve(res[WISP.STORE_KEY] || {}),
      );
    });
  };

  WISP.saveMap = async function saveMap(map: SlotImageMap): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [WISP.STORE_KEY]: map }, resolve);
    });
  };
})();
