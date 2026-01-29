(() => {
  const root = globalThis as unknown as Window;
  const PIXU = (root.__pixu ??= {} as Pixu);

  PIXU.PREFIX = "cg-img-";

  console.log("NAI Pixu content script injected on:", location.href);

  PIXU.getStoryId = function getStoryId(): string {
    try {
      const url = new URL(location.href);
      if (!url.pathname.startsWith("/stories")) return "global";
      const id = url.searchParams.get("id");
      if (id) return id;
      const match = url.pathname.match(/\/stories\/([a-f0-9-]+)/i);
      if (match?.[1]) return match[1];
    } catch {
      // Ignore URL parsing failures.
    }
    return "global";
  };

  PIXU.slotKeyFromImg = function slotKeyFromImg(img: HTMLImageElement) {
    return img.dataset.partid?.slice(PIXU.PREFIX.length);
  };

  PIXU.extWrapIdFor = function extWrapIdFor(slotKey: string) {
    return `pixu-wrap-${CSS.escape(slotKey)}`;
  };

  PIXU.dataUrlToBlob = function dataUrlToBlob(dataUrl: string) {
    const [meta, base64] = dataUrl.split(",");
    const mime =
      (meta.match(/data:(.*?);base64/) || [])[1] ||
      "application/octet-stream";
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  };
})();
