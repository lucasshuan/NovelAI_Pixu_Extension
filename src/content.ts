import { DATA_ID_PREFIX } from "./constants";
import { loadMap } from "./storage";
import { applyToImage, ensureWrapper } from "./ui";

async function scanAndEnhance() {
  const map = await loadMap();
  document.querySelectorAll('div[data-partid^="cg-warning"]').forEach((div) => {
    div.remove();
  });
  document
    .querySelectorAll(`img[data-partid^="${DATA_ID_PREFIX}"]`)
    .forEach((img) => {
      ensureWrapper(img as HTMLImageElement);
      applyToImage(img as HTMLImageElement, map);
    });
}

async function bootstrap() {
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

console.log("NAI Pixu content script injected on:", location.href);
bootstrap().catch(console.error);
