(() => {
  const root = globalThis as unknown as Window;
  const FOXFIRE = (root.__foxfire ??= {} as Wisp);

  FOXFIRE.applyToImage = async function applyToImage(
    img: HTMLImageElement,
    map: SlotImageMap,
  ) {
    console.log("Found one image!!", map);
    const pid = img.dataset.partid;
    if (!pid?.startsWith(FOXFIRE.PREFIX)) return;
    const slotKey = FOXFIRE.slotKeyFromImg(img);
    if (!slotKey) return;
    const entry = map[slotKey];
    if (!entry?.imageId) return;
    const url = await FOXFIRE.getImageUrl(entry.imageId);
    if (!url) return;
    if (img.dataset.foxfireImageId === entry.imageId && img.src === url) return;
    img.dataset.foxfireImageId = entry.imageId;
    img.src = url;
  };

  FOXFIRE.ensureWrapper = function ensureWrapper(img: HTMLImageElement) {
    if (!(img instanceof HTMLImageElement)) return;
    if (!img.dataset.partid?.startsWith(FOXFIRE.PREFIX)) return;

    const slotKey = FOXFIRE.slotKeyFromImg(img);
    if (!slotKey) return;

    // Already wrapped?
    if (
      img.closest?.(
        `[data-foxfire-wrap="1"][data-slot-key="${CSS.escape(slotKey)}"]`,
      )
    )
      return;

    const { wrap, input } = FOXFIRE.createWrap(slotKey);

    if (!input) return;

    wrap.style.cursor = "pointer";
    wrap.style.position = "relative";
    wrap.style.margin = "0";
    wrap.style.padding = "0";
    wrap.style.marginLeft = "0";
    wrap.style.paddingLeft = "0";
    wrap.style.outline = "2px dashed transparent";
    wrap.style.outlineOffset = "4px";
    wrap.style.transition = "outline-color 120ms ease";
    wrap.addEventListener("click", () => input.click());
    img.style.transition = "filter 0.3s ease";
    img.style.position = "relative";
    img.style.zIndex = "1";
    img.style.display = "block";
    img.style.margin = "0";
    img.style.padding = "0";
    img.style.marginLeft = "0";
    img.style.paddingLeft = "0";

    const dropOverlay = wrap.querySelector(
      '[data-foxfire-drop="1"]',
    ) as HTMLElement | null;

    const saveBlob = async (blob: Blob) => {
      await FOXFIRE.saveSlotImage(slotKey, blob);
      const map = await FOXFIRE.loadMap();
      await FOXFIRE.applyToImage(img, map);
    };

    const handleBlob = async (blob: Blob | undefined) => {
      if (!blob) return;

      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = String(reader.result);
        if (!dataUrl.startsWith("data:image/")) return;
        const blob = FOXFIRE.dataUrlToBlob(dataUrl);
        await saveBlob(blob);
      };
      reader.readAsDataURL(blob);
    };

    const handleFile = async (file: File | undefined) => {
      if (!file) return;
      await handleBlob(file);
    };

    const getDraggedImage = (data: DataTransfer | null) => {
      if (!data) return undefined;
      const items = Array.from(data.items ?? []);
      for (const item of items) {
        if (item.kind !== "file") continue;
        const file = item.getAsFile();
        if (file && file.type?.startsWith("image/")) return file;
      }
      const files = Array.from(data.files ?? []);
      return files.find((file) => file.type?.startsWith("image/"));
    };

    const getDraggedImageUrl = (data: DataTransfer | null) => {
      if (!data) return undefined;
      const raw =
        data.getData("text/uri-list") || data.getData("text/plain");
      if (!raw) return undefined;
      const url = raw
        .split("\n")
        .map((line) => line.trim())
        .find((line) => line && !line.startsWith("#"));
      if (!url) return undefined;
      if (url.startsWith("data:") || url.startsWith("blob:")) return url;
      if (url.startsWith("http://") || url.startsWith("https://")) return url;
      return undefined;
    };

    const hasImageDrag = (data: DataTransfer | null) => {
      if (!data) return false;
      if (getDraggedImage(data)) return true;
      const items = Array.from(data.items ?? []);
      return items.some(
        (item) =>
          item.kind === "string" &&
          (item.type === "text/uri-list" || item.type === "text/plain"),
      );
    };

    const setDragActive = (active: boolean) => {
      wrap.style.outlineColor = active ? "rgba(0, 0, 0, 0.35)" : "transparent";
      if (dropOverlay) dropOverlay.style.opacity = active ? "1" : "0";
      img.style.filter = active ? "brightness(0.75)" : "brightness(1)";
    };

    const handleDroppedData = async (data: DataTransfer | null) => {
      const file = getDraggedImage(data);
      if (file) {
        await handleFile(file);
        return true;
      }

      const url = getDraggedImageUrl(data);
      if (!url) return false;

      if (url.startsWith("data:image/")) {
        const blob = FOXFIRE.dataUrlToBlob(url);
        await saveBlob(blob);
        return true;
      }

      try {
        const response = await fetch(url);
        const blob = await response.blob();
        await handleBlob(blob);
        return true;
      } catch {
        // Ignore fetch failures (e.g., blocked cross-origin URLs).
        return false;
      }
    };

    (wrap as any).__foxfireSetDragActive = setDragActive;
    (wrap as any).__foxfireHasImageDrag = hasImageDrag;
    (wrap as any).__foxfireHandleDrop = handleDroppedData;

    input.addEventListener("change", async () => {
      await handleFile(input.files?.[0]);

      // Reset so choosing same file again still triggers change
      input.value = "";
    });

    const addDragListener = (
      type: "dragenter" | "dragover" | "dragleave" | "drop",
      handler: (event: DragEvent) => void,
    ) => {
      wrap.addEventListener(type, handler, { capture: true });
    };

    addDragListener("dragenter", (event) => {
      if (!hasImageDrag(event.dataTransfer)) return;
      event.preventDefault();
      event.stopPropagation();
      setDragActive(true);
    });

    addDragListener("dragover", (event) => {
      if (!hasImageDrag(event.dataTransfer)) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
      setDragActive(true);
    });

    addDragListener("dragleave", (event) => {
      const related = event.relatedTarget as Node | null;
      if (related && wrap.contains(related)) return;
      setDragActive(false);
    });

    addDragListener("drop", async (event) => {
      if (!hasImageDrag(event.dataTransfer)) return;
      event.preventDefault();
      event.stopPropagation();
      setDragActive(false);
      await handleDroppedData(event.dataTransfer);
    });

    const ensureGlobalDropShield = () => {
      const state = FOXFIRE as unknown as { _dragShieldInstalled?: boolean };
      if (state._dragShieldInstalled) return;
      state._dragShieldInstalled = true;

      let lastWrap: HTMLElement | null = null;

      const setActiveFor = (wrapEl: HTMLElement | null, active: boolean) => {
        if (!wrapEl) return;
        const setter = (wrapEl as any).__foxfireSetDragActive as
          | ((value: boolean) => void)
          | undefined;
        if (setter) {
          setter(active);
          return;
        }
        wrapEl.style.outlineColor = active
          ? "rgba(0, 0, 0, 0.35)"
          : "transparent";
      };

      const updateActive = (next: HTMLElement | null) => {
        if (next === lastWrap) return;
        if (lastWrap) setActiveFor(lastWrap, false);
        if (next) setActiveFor(next, true);
        lastWrap = next;
      };

      const resolveWrapAtPoint = (event: DragEvent) => {
        if (document.elementsFromPoint) {
          const stack = document.elementsFromPoint(
            event.clientX,
            event.clientY,
          ) as HTMLElement[];
          for (const el of stack) {
            const match = el.closest?.("[data-foxfire-wrap=\"1\"]") as
              | HTMLElement
              | null
              | undefined;
            if (match) return match;
          }
        }
        const target = document.elementFromPoint(
          event.clientX,
          event.clientY,
        ) as HTMLElement | null;
        return (target?.closest?.("[data-foxfire-wrap=\"1\"]") ??
          null) as HTMLElement | null;
      };

      const isImageDragForWrap = (
        wrapEl: HTMLElement | null,
        data: DataTransfer | null,
      ) => {
        if (!wrapEl) return false;
        const checker = (wrapEl as any).__foxfireHasImageDrag as
          | ((data: DataTransfer | null) => boolean)
          | undefined;
        return checker ? checker(data) : false;
      };

      const handleDropForWrap = (
        wrapEl: HTMLElement | null,
        data: DataTransfer | null,
      ) => {
        if (!wrapEl) return;
        const handler = (wrapEl as any).__foxfireHandleDrop as
          | ((data: DataTransfer | null) => Promise<boolean>)
          | undefined;
        if (handler) {
          void handler(data);
        }
      };

      const hasAnyWrap = () =>
        document.querySelector("[data-foxfire-wrap=\"1\"]") !== null;

      const isImageLikeDrag = (data: DataTransfer | null) => {
        if (!data) return false;
        const types = Array.from(data.types ?? []);
        if (types.includes("Files")) return true;
        if (types.includes("text/uri-list")) return true;
        if (types.includes("text/plain")) return true;
        return false;
      };

      const shouldShield = (data: DataTransfer | null) =>
        hasAnyWrap() && isImageLikeDrag(data);

      const onGlobalDragEnter = (event: DragEvent) => {
        if (!shouldShield(event.dataTransfer)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        const wrapEl = resolveWrapAtPoint(event);
        updateActive(wrapEl);
      };

      const onGlobalDragOver = (event: DragEvent) => {
        if (!shouldShield(event.dataTransfer)) {
          updateActive(null);
          return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        const wrapEl = resolveWrapAtPoint(event);
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = wrapEl ? "copy" : "none";
        }
        updateActive(wrapEl);
      };

      const onGlobalDrop = (event: DragEvent) => {
        if (!shouldShield(event.dataTransfer)) {
          updateActive(null);
          return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        const wrapEl = resolveWrapAtPoint(event);
        updateActive(null);
        if (!isImageDragForWrap(wrapEl, event.dataTransfer)) return;
        handleDropForWrap(wrapEl, event.dataTransfer);
      };

      const onGlobalDragEnd = () => {
        updateActive(null);
      };

      const onGlobalDragLeave = (event: DragEvent) => {
        if (event.relatedTarget) return;
        updateActive(null);
      };

      window.addEventListener("dragenter", onGlobalDragEnter, {
        capture: true,
      });
      window.addEventListener("dragover", onGlobalDragOver, {
        capture: true,
      });
      window.addEventListener("drop", onGlobalDrop, { capture: true });
      window.addEventListener("dragend", onGlobalDragEnd, { capture: true });
      window.addEventListener("dragleave", onGlobalDragLeave, {
        capture: true,
      });
    };

    ensureGlobalDropShield();

    // Wrap the image in-place
    const parent = img.parentNode;
    if (!parent) return;

    parent.insertBefore(wrap, img);
    wrap.appendChild(img);
  };
})();
