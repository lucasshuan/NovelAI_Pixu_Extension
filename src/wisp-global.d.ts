export {};

declare global {
  type SlotImageMap = Record<string, string>;

  interface WrapParts {
    wrap: HTMLElement;
    input: HTMLInputElement | null;
  }

  interface Wisp {
    PREFIX: string;
    STORE_KEY: string;
    slotKeyFromImg: (img: HTMLImageElement) => string | undefined;
    extWrapIdFor: (slotKey: string) => string;
    dataUrlToBlob: (dataUrl: string) => Blob;
    loadMap: () => Promise<SlotImageMap>;
    saveMap: (map: SlotImageMap) => Promise<void>;
    createWrap: (slotKey: string) => WrapParts;
    applyToImage: (img: HTMLImageElement, map: SlotImageMap) => void | Promise<void>;
    ensureWrapper: (img: HTMLImageElement) => void;
  }

  interface Window {
    __wisp?: Wisp;
  }

  const chrome: any;
}
