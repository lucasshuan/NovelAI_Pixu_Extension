(() => {
  const root = globalThis as unknown as Window;
  const PIXU = (root.__pixu ??= {} as Pixu);

  async function scanAndEnhance() {
    const map = await PIXU.loadMap();
    document.querySelectorAll('div[data-partid^="cg-warning"]').forEach((div) => {
      div.remove();
    });
    document
      .querySelectorAll(`img[data-partid^="${PIXU.PREFIX}"]`)
      .forEach((img) => {
        PIXU.ensureWrapper(img as HTMLImageElement);
        PIXU.applyToImage(img as HTMLImageElement, map);
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
      window.dispatchEvent(new Event("pixu-locationchange"));
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
    window.addEventListener("pixu-locationchange", triggerLocationScan);
  }

  main().catch(console.error);
})();
