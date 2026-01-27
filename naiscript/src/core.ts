import { ensurePerms, registerHooks } from "./hooks";
import { getEntries, getOrderedEntries, setEntries } from "./storage";
import { buildWidgetContent, renderPanel } from "./ui";
import type { Entry } from "./types";

export async function run(): Promise<void> {
  function uid(): string {
    return Math.random().toString(36).slice(2, 10);
  }

  async function rebuildAllWidgets(): Promise<void> {
    await ensurePerms();

    api.v1.editor.decorations.clearWidgets();

    const entries = await getEntries();
    const ordered = await getOrderedEntries(entries);

    const widgetOpts = ordered.map(
      (e, idx) =>
        ({
          type: "node",
          sectionId: e.sectionId,
          side: "after",
          content: buildWidgetContent(e, idx + 1, removeEntry),
        }) as DecorationCreateNodeWidgetOptions,
    );

    await api.v1.editor.decorations.createWidgets(widgetOpts);
  }

  async function addImageHere(): Promise<void> {
    await ensurePerms();

    const selection = await api.v1.editor.selection.get();
    const sectionId: number | undefined = selection?.from?.sectionId;

    if (sectionId === undefined || sectionId === null) {
      api.v1.ui.toast(
        "Couldn't detect the current section. Click inside the story text first.",
      );
      return;
    }

    const entries = await getEntries();

    const inSection = entries.filter((e) => e.sectionId === sectionId);
    const nextOrder = inSection.length
      ? Math.max(...inSection.map((e) => e.order)) + 1
      : 0;

    const next: Entry = { id: uid(), sectionId, order: nextOrder };

    await setEntries([...entries, next]);

    await rebuildAllWidgets();
  }

  async function clearEntries(): Promise<void> {
    await setEntries([]);
    api.v1.editor.decorations.clearWidgets();
    api.v1.ui.toast("Cleared saved image slots for this story.");
  }

  async function removeEntry(entryId: string): Promise<void> {
    const entries = await getEntries();
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;

    const nextEntries = entries.filter((e) => e.id !== entryId);
    await setEntries(nextEntries);

    await rebuildAllWidgets();
  }

  registerHooks(rebuildAllWidgets);

  await renderPanel({
    onAddImageSlot: addImageHere,
    onClearAll: clearEntries,
  });
}
