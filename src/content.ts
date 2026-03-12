import { DATA_ID_PREFIX } from "./constants";
import { storyIdFromSlotKey, slotKeyFromImg } from "./core";
import { loadMap } from "./storage";
import { applyToImage, ensureWrapper } from "./ui";

async function scanAndEnhance() {
  document.querySelectorAll('div[data-partid^="cg-warning"]').forEach((div) => {
    div.remove();
  });
  const images = document.querySelectorAll(`img[data-partid^="${DATA_ID_PREFIX}"]`);
  
  // First pass: ensure all wrappers exist (synchronous)
  images.forEach((img) => {
    ensureWrapper(img as HTMLImageElement);
  });
  
  // Second pass: load maps and apply images (async)
  for (const img of Array.from(images)) {
    const slotKey = slotKeyFromImg(img as HTMLImageElement);
    if (!slotKey) continue;
    const storyId = storyIdFromSlotKey(slotKey);
    const map = await loadMap(storyId);
    applyToImage(img as HTMLImageElement, map);
  }
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
