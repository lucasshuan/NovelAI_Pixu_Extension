import { PANEL_ID, PLACEHOLDER_IMAGE_BASE64 } from "./config";
import { stableSlotKey } from "./storage";
import type { Entry } from "./types";

type RemoveEntryHandler = (entryId: string) => Promise<void>;

export function buildWidgetContent(
  entry: Entry,
  slotNumber: number,
  onRemove: RemoveEntryHandler,
): UIPart[] {
  const label = `Image Slot #${slotNumber}`;

  const headerRow = api.v1.ui.part.row({
    spacing: "space-between",
    content: [
      api.v1.ui.part.text({
        text: label,
        style: { color: "textMain", opacity: 0.3 },
      }),
      api.v1.ui.part.button({
        iconId: "x",
        style: {
          backgroundColor: "bg2",
          height: 24,
          width: 24,
          padding: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        },
        callback: async () => {
          await onRemove(entry.id);
        },
      }),
    ],
  });

  const slotKey = stableSlotKey(entry);

  const imageContainer = api.v1.ui.part.image({
    src: PLACEHOLDER_IMAGE_BASE64,
    height: 340,
    style: { objectFit: "contain" },
    id: `cg-img-${slotKey}`,
    alt: `Image #${slotKey}`,
  });

  return [
    api.v1.ui.part.box({
      style: { borderRadius: 10, padding: "6px 6px" },
      content: [
        api.v1.ui.part.column({
          spacing: "center",
          content: [headerRow, imageContainer],
        }),
      ],
    }),
  ];
}

export async function renderPanel(opts: {
  onAddImageSlot: () => Promise<void>;
  onClearAll: () => Promise<void>;
}): Promise<void> {
  await api.v1.ui.register([
    api.v1.ui.extension.scriptPanel({
      id: PANEL_ID,
      name: "Image Slots",
      iconId: "image",
      content: [
        api.v1.ui.part.column({
          content: [
            api.v1.ui.part.row({
              wrap: true,
              spacing: "center",
              content: [
                api.v1.ui.part.button({
                  text: "Add Image Slot",
                  iconId: "plus",
                  callback: opts.onAddImageSlot,
                }),
                api.v1.ui.part.button({
                  text: "Clear All Image Slots",
                  iconId: "trash",
                  callback: opts.onClearAll,
                  style: { color: "warning" },
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ]);
}
