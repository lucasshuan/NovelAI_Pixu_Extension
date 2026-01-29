(() => {
  const root = globalThis as unknown as Window;
  const PIXU = (root.__pixu ??= {} as Pixu);
  PIXU.base64Assets = {
    menuIcon: "data:image/png;base64,...",
  };
})();