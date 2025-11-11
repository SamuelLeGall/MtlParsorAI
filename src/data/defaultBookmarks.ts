import { BookmarkDB } from "../models/bookmark";

export const defaultBookmarks: BookmarkDB[] = [
  {
    id: "9046ada3-8b0d-46ae-bfd3-e6da672e101c",
    bookID: "9046ada3-8b0d-46ae-bfd3-e6da672e922b", // if updated, impact defaultBooks.ts
    userID: "TO_REPLACE",
    currentSourceSiteCode: "WTR_LAB", // if updated, impact defaultBookmarks.ts
    currentChapter: 1,
  },
  {
    id: "9046ada3-8b0d-46ae-bfd3-e6da672e844e",
    bookID: "9046ada3-8b0d-46ae-bfd3-e6da672e733d", // if updated, impact defaultBooks.ts
    userID: "TO_REPLACE",
    currentSourceSiteCode: "FAN_MTL", // if updated, impact defaultBookmarks.ts
    currentChapter: 1,
  },
];
