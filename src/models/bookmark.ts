import { sourceWebsiteCode } from "./sourceWebsite";

export interface ReaderDataConfig {
  sourceSiteCode: sourceWebsiteCode;
  template: string;
  values: Record<string, string | number>;
}

export interface BookDB {
  id: string;
  name: string;
  author: string;
  readerDataConfigs: ReaderDataConfig[];
}

export interface BookmarkDB {
  id: string;
  bookID: string;
  userID: string;
  currentSourceSiteCode: sourceWebsiteCode;
  currentChapter: number;
  readerDataOverride?: ReaderDataConfig[];
}

export interface HydratedBookmark {
  bookmark: BookmarkDB;
  book: BookDB | null;
}
