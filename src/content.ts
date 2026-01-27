(() => {
  const root = globalThis as unknown as Window;
  const FOXFIRE = (root.__foxfire ??= {} as Wisp);

  async function scanAndEnhance() {
    const map = await FOXFIRE.loadMap();
    console.log("searching for images!")
    document.querySelectorAll(`img[data-partid^="${FOXFIRE.PREFIX}"]`).forEach((img) => {
      FOXFIRE.ensureWrapper(img as HTMLImageElement);
      FOXFIRE.applyToImage(img as HTMLImageElement, map);
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
      if (changes[FOXFIRE.STORE_KEY]) scanAndEnhance().catch(console.error);
    });
  }

  main().catch(console.error);
})();
