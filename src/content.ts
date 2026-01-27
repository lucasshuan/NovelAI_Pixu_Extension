(() => {
  const root = globalThis as unknown as Window;
  const FOXFIRE = (root.__foxfire ??= {} as Wisp);

  async function scanAndEnhance() {
    const map = await FOXFIRE.loadMap();
    console.log("searching for images!");
    document
      .querySelectorAll(`img[data-partid^="${FOXFIRE.PREFIX}"]`)
      .forEach((img) => {
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

    const triggerLocationScan = () => {
      scanAndEnhance().catch(console.error);
    };

    const notifyLocationChange = () => {
      window.dispatchEvent(new Event("foxfire-locationchange"));
    };

    const patchHistory = (method: "pushState" | "replaceState") => {
      const original = history[method];
      history[method] = function (this: History, ...args) {
        const result = original.apply(this, args as any);
        notifyLocationChange();
        return result;
      } as History["pushState"];
    };

    patchHistory("pushState");
    patchHistory("replaceState");
    window.addEventListener("popstate", notifyLocationChange);
    window.addEventListener("hashchange", notifyLocationChange);
    window.addEventListener("foxfire-locationchange", triggerLocationScan);
  }

  main().catch(console.error);
})();
