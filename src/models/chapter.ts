import { BookDB, BookmarkDB } from "./bookmark";

export interface ChapterSummaryDB {
  id: string;
  chapterID: string;
  summary: string;
}

export interface ChapterDB {
  id: string;
  title: string;
  body: string;
}

export interface ChapterNavigation {
  currentChapter: number;
  isNotFirstChapter: boolean;
}
export interface ChapterViewResponse {
  bookmarkID: BookmarkDB["id"];
  book: {
    id: BookDB["id"];
    name: BookDB["name"];
    author: BookDB["author"];
  };
  navigation: ChapterNavigation;
  chapter: ChapterDB;
}
