export async function ensurePerms(): Promise<void> {
  await api.v1.permissions.request(
    ["editorDecorations", "fileInput", "documentEdit"],
    "Needed to place widgets in the editor and import images.",
  );
}

export function registerHooks(
  rebuildAllWidgets: () => Promise<void>,
): void {
  api.v1.hooks.register("onScriptsLoaded", async () => {
    await rebuildAllWidgets();
  });
}
