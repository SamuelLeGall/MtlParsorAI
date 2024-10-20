import { sourceWebsiteCode } from "./sourceWebsite";

export interface sharedContext {
  lastChapterSummary: string | null;
  currentChapterSummary: string | null;
  globalContext: string | null;
  currentChapterText: string | null;
}

export interface destination {
  sourceSiteCode: sourceWebsiteCode;
  serieCode: number;
  serieBaseUrl: string;
  chapterFragment: string;
  chapterNumber: number;
}

export type computeChapterResponse = Promise<
  | {
      success: true;
      data: { title: string; chapter: string; lastChapterSummary: string };
    }
  | { success: false; message: string; detail?: any }
>;
