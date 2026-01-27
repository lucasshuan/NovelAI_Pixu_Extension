(() => {
  const root = globalThis as unknown as Window;
  const PIXU = (root.__pixu ??= {} as Wisp);

  const DB_NAME = "pixu";
  const DB_VERSION = 1;
  const STORE_IMAGES = "images";
  const STORE_MAPS = "storyMaps";

  type ImageRecord = {
    id: string;
    blob: Blob;
    mime: string;
    size: number;
    updatedAt: number;
  };

  type StoryRecord = {
    storyId: string;
    slots: SlotImageMap;
    updatedAt: number;
  };

  let dbPromise: Promise<IDBDatabase> | null = null;
  const objectUrlCache = new Map<string, string>();

  const openDb = () => {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_IMAGES)) {
          db.createObjectStore(STORE_IMAGES, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORE_MAPS)) {
          db.createObjectStore(STORE_MAPS, { keyPath: "storyId" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => {
        console.warn("PIXU IDB open blocked");
      };
    });
    return dbPromise;
  };

  const requestToPromise = <T>(req: IDBRequest<T>) =>
    new Promise<T>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

  const txDone = (tx: IDBTransaction) =>
    new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
      tx.onerror = () => reject(tx.error);
    });

  const resolveStoryId = (storyId?: string) =>
    storyId ?? PIXU.getStoryId?.() ?? "global";

  const makeId = () => {
    if (crypto?.randomUUID) return crypto.randomUUID();
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  };

  const getImageRecord = async (
    imageId: string,
  ): Promise<ImageRecord | undefined> => {
    const db = await openDb();
    const tx = db.transaction(STORE_IMAGES, "readonly");
    const store = tx.objectStore(STORE_IMAGES);
    const record = await requestToPromise<ImageRecord | undefined>(
      store.get(imageId),
    );
    await txDone(tx);
    return record;
  };

  const putImageRecord = async (record: ImageRecord): Promise<void> => {
    const db = await openDb();
    const tx = db.transaction(STORE_IMAGES, "readwrite");
    tx.objectStore(STORE_IMAGES).put(record);
    await txDone(tx);
  };

  const deleteImageRecord = async (imageId: string): Promise<void> => {
    const db = await openDb();
    const tx = db.transaction(STORE_IMAGES, "readwrite");
    tx.objectStore(STORE_IMAGES).delete(imageId);
    await txDone(tx);
  };

  const getStoryRecord = async (
    storyId: string,
  ): Promise<StoryRecord | undefined> => {
    const db = await openDb();
    const tx = db.transaction(STORE_MAPS, "readonly");
    const store = tx.objectStore(STORE_MAPS);
    const record = await requestToPromise<StoryRecord | undefined>(
      store.get(storyId),
    );
    await txDone(tx);
    return record;
  };

  const putStoryRecord = async (record: StoryRecord): Promise<void> => {
    const db = await openDb();
    const tx = db.transaction(STORE_MAPS, "readwrite");
    tx.objectStore(STORE_MAPS).put(record);
    await txDone(tx);
  };

  const revokeObjectUrl = (imageId: string) => {
    const url = objectUrlCache.get(imageId);
    if (url) {
      URL.revokeObjectURL(url);
      objectUrlCache.delete(imageId);
    }
  };

  PIXU.loadMap = async function loadMap(
    storyId?: string,
  ): Promise<SlotImageMap> {
    try {
      const resolved = resolveStoryId(storyId);
      const record = await getStoryRecord(resolved);
      return record?.slots || {};
    } catch (err) {
      console.warn("PIXU loadMap error:", err);
      return {};
    }
  };

  PIXU.saveMap = async function saveMap(
    map: SlotImageMap,
    storyId?: string,
  ): Promise<void> {
    try {
      const resolved = resolveStoryId(storyId);
      await putStoryRecord({
        storyId: resolved,
        slots: map,
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.warn("PIXU saveMap error:", err);
    }
  };

  PIXU.getImageUrl = async function getImageUrl(
    imageId: string,
  ): Promise<string | undefined> {
    if (!imageId) return undefined;
    const cached = objectUrlCache.get(imageId);
    if (cached) return cached;
    try {
      const record = await getImageRecord(imageId);
      if (!record?.blob) return undefined;
      const url = URL.createObjectURL(record.blob);
      objectUrlCache.set(imageId, url);
      return url;
    } catch (err) {
      console.warn("PIXU getImageUrl error:", err);
      return undefined;
    }
  };

  PIXU.deleteImage = async function deleteImage(
    imageId: string,
  ): Promise<void> {
    if (!imageId) return;
    try {
      revokeObjectUrl(imageId);
      await deleteImageRecord(imageId);
    } catch (err) {
      console.warn("PIXU deleteImage error:", err);
    }
  };

  PIXU.saveSlotImage = async function saveSlotImage(
    slotKey: string,
    blob: Blob,
    storyId?: string,
  ): Promise<SlotImageRef> {
    const resolved = resolveStoryId(storyId);
    const map = await PIXU.loadMap(resolved);
    const prev = map[slotKey];
    const record: ImageRecord = {
      id: makeId(),
      blob,
      mime: blob.type || "application/octet-stream",
      size: blob.size,
      updatedAt: Date.now(),
    };

    try {
      await putImageRecord(record);
      const nextRef: SlotImageRef = {
        imageId: record.id,
        updatedAt: record.updatedAt,
        mime: record.mime,
        size: record.size,
      };
      map[slotKey] = nextRef;
      await putStoryRecord({
        storyId: resolved,
        slots: map,
        updatedAt: Date.now(),
      });
      if (prev?.imageId && prev.imageId !== record.id) {
        await PIXU.deleteImage(prev.imageId);
      }
      return nextRef;
    } catch (err) {
      console.warn("PIXU saveSlotImage error:", err);
      throw err;
    }
  };
})();
