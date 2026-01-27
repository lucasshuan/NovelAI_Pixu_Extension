(() => {
  const root = globalThis as unknown as Window;
  const WISP = (root.__wisp ??= {} as Wisp);

  async function scanAndEnhance() {
    const map = await WISP.loadMap();
    console.log("searching for images!")
    document.querySelectorAll(`img[data-partid^="${WISP.PREFIX}"]`).forEach((img) => {
      WISP.ensureWrapper(img as HTMLImageElement);
      WISP.applyToImage(img as HTMLImageElement, map);
    });
  }

  async function main() {
    await scanAndEnhance();

    const obs = new MutationObserver(() => {
      scanAndEnhance().catch(console.error);
    });

    obs.observe(document.documentElement, { childList: true, subtree: true });

    chrome.storage.onChanged.addListener((changes: any, area: string) => {
      if (area !== "local") return;
      if (changes[WISP.STORE_KEY]) scanAndEnhance().catch(console.error);
    });
  }

  main().catch(console.error);
})();
