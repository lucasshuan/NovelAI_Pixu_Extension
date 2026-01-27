export {};

declare global {
  type SlotImageRef = {
    imageId: string;
    updatedAt: number;
    mime?: string;
    size?: number;
  };

  type SlotImageMap = Record<string, SlotImageRef>;

  interface WrapParts {
    wrap: HTMLElement;
    input: HTMLInputElement | null;
  }

  interface Wisp {
    PREFIX: string;
    slotKeyFromImg: (img: HTMLImageElement) => string | undefined;
    extWrapIdFor: (slotKey: string) => string;
    dataUrlToBlob: (dataUrl: string) => Blob;
    getStoryId: () => string;
    loadMap: (storyId?: string) => Promise<SlotImageMap>;
    saveMap: (map: SlotImageMap, storyId?: string) => Promise<void>;
    saveSlotImage: (
      slotKey: string,
      blob: Blob,
      storyId?: string,
    ) => Promise<SlotImageRef>;
    getImageUrl: (imageId: string) => Promise<string | undefined>;
    deleteImage: (imageId: string) => Promise<void>;
    createWrap: (slotKey: string) => WrapParts;
    applyToImage: (
      img: HTMLImageElement,
      map: SlotImageMap,
    ) => void | Promise<void>;
    ensureWrapper: (img: HTMLImageElement) => void;
  }

  interface Window {
    __foxfire?: Wisp;
  }

  const chrome: any;
}
