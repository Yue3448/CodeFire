import { raidCatalog } from "@/content/raids";

export const eventCatalog = raidCatalog.filter((event) =>
  ["weekly", "boss", "recovery", "weekend", "language", "seasonal"].includes(event.category),
);
