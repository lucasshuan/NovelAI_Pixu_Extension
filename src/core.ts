(() => {
  const root = globalThis as unknown as Window;
  const FOXFIRE = (root.__foxfire ??= {} as Wisp);

  FOXFIRE.PREFIX = "cg-img-";
  FOXFIRE.STORE_KEY = "slotImages"; // { [slotKey]: dataUrl }

  console.log("NAI Wisp content script injected on:", location.href);

  FOXFIRE.slotKeyFromImg = function slotKeyFromImg(img: HTMLImageElement) {
    return img.dataset.partid?.slice(FOXFIRE.PREFIX.length);
  };

  FOXFIRE.extWrapIdFor = function extWrapIdFor(slotKey: string) {
    return `foxfire-wrap-${CSS.escape(slotKey)}`;
  };

  FOXFIRE.dataUrlToBlob = function dataUrlToBlob(dataUrl: string) {
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
