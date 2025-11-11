import { ReaderDataConfig } from "./readerConfig";

export interface BookDB {
  id: string;
  name: string;
  author: string;
  synopsis: string;
  readerDataConfigs: ReaderDataConfig[];
}

export interface BookmarkDB {
  id: string;
  bookID: string;
  userID: string;
  currentSourceSiteCode: ReaderDataConfig["sourceSiteCode"];
  currentChapter: number;
  readerDataOverride?: ReaderDataConfig[];
}

export interface HydratedBookmark {
  bookmark: BookmarkDB;
  book: BookDB;
}
