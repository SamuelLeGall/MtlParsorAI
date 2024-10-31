import { sourceWebsiteCode } from "./sourceWebsite";

export interface sharedContext {
  lastChapterSummary: string | null;
  currentChapterSummary: string | null;
  globalContext: string | null;
  currentChapterText: string | null;
}

export interface destination {
  userId: string;
  sourceSiteCode: sourceWebsiteCode;
  urlParam: string;
  params: {
    code: string;
    value: string | number;
  }[];
}
export type computeChapterResponse = Promise<
  | {
      success: true;
      data: { title: string; chapter: string; lastChapterSummary: string };
    }
  | { success: false; message: string; detail?: any }
>;
