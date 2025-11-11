import { sourceWebsiteCode } from "./sourceWebsite";

export interface sourceWebsitesSelect {
  code: sourceWebsiteCode;
  libelle: string;
}

export interface ReaderDataConfig {
  sourceSiteCode: sourceWebsiteCode;
  template: string;
  values: Record<string, string | number>;
}
