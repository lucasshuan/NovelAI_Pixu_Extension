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

  type AssetMap = Record<string, string>;
  
  interface BrowserLike {
    runtime: {
      getURL(path: string): string;
    };
  }

  interface Window {
    browser?: BrowserLike;
    chrome?: BrowserLike;
  }

  var browser: BrowserLike | undefined;
  var chrome: BrowserLike | undefined;
}