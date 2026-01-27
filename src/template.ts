(() => {
  const root = globalThis as unknown as Window;
  const FOXFIRE = (root.__foxfire ??= {} as Wisp);

  const WRAP_TEMPLATE = document.createElement("template");
  WRAP_TEMPLATE.innerHTML = `
    <div data-foxfire-wrap="1" style="display:inline-block;margin:0;padding:0;height:auto;line-height:0;vertical-align:top;z-index:99999;position:relative;">
      <input type="file" accept="image/*" data-role="file" style="display:none;margin:0" />
      <div data-foxfire-drop="1" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;background:rgba(0,0,0,0.25);transition:opacity 0.3s ease;z-index:2;">
        <svg data-foxfire-icon="1" viewBox="0 0 640 640" aria-hidden="true" focusable="false" style="width:50px;height:50px;display:block;fill:currentColor;color:#fff;">
          <path fill="currentColor" d="M342.6 73.4C330.1 60.9 309.8 60.9 297.3 73.4L169.3 201.4C156.8 213.9 156.8 234.2 169.3 246.7C181.8 259.2 202.1 259.2 214.6 246.7L288 173.3L288 384C288 401.7 302.3 416 320 416C337.7 416 352 401.7 352 384L352 173.3L425.4 246.7C437.9 259.2 458.2 259.2 470.7 246.7C483.2 234.2 483.2 213.9 470.7 201.4L342.7 73.4zM160 416C160 398.3 145.7 384 128 384C110.3 384 96 398.3 96 416L96 480C96 533 139 576 192 576L448 576C501 576 544 533 544 480L544 416C544 398.3 529.7 384 512 384C494.3 384 480 398.3 480 416L480 480C480 497.7 465.7 512 448 512L192 512C174.3 512 160 497.7 160 480L160 416z"/>
        </svg>
      </div>
    </div>
  `;

  FOXFIRE.createWrap = function createWrap(slotKey: string): WrapParts {
    const tplRoot = WRAP_TEMPLATE.content.firstElementChild;
    if (!tplRoot) {
      throw new Error("FOXFIRE template missing root element.");
    }

    const wrap = tplRoot.cloneNode(true) as HTMLElement;
    wrap.dataset.slotKey = slotKey;

    const input = wrap.querySelector('[data-role="file"]') as
      | HTMLInputElement
      | null;
    return { wrap, input };
  };
})();
