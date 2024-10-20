import axios from "axios";
import { load } from "cheerio";
import { sourceWebsiteCode, wtrLabModel } from "../../models/sourceWebsite.ts";
import { configUrlSourceWebsite } from "./sourceWebsitesData.ts";
import { sourceWebsiteConfig } from "../../models/contexte.ts";

export class sourceWebsiteManager {
  private code: sourceWebsiteCode;

  constructor(sourceCode: sourceWebsiteCode) {
    this.code = sourceCode;
  }

  private async fetchUrlHTML(url: string) {
    try {
      const response = await axios.get(url);
      return { sucess: true, data: response.data };
    } catch (error: any) {
      console.error(error);
      return {
        success: false,
        message: error.message || JSON.stringify(error),
      };
    }
  }

  async fetchChapterText(url: string) {
    try {
      const response = await this.fetchUrlHTML(url);

      // Load the HTML into cheerio
      const $ = load(response.data);
      let chapterData: {
        title: null | string;
        body: null | string;
      } = {
        title: null,
        body: null,
      };
      let scriptContent: wtrLabModel | null = null;

      // mapping to get title and libelle depending on the source website
      switch (this.code) {
        case "WTR_LAB":
        default:
          console.log("source is wtr-lab");
          if (typeof $("#__NEXT_DATA__").html() === "string") {
            scriptContent = JSON.parse($("#__NEXT_DATA__").html() as string);
          }
          chapterData.title =
            scriptContent?.props?.pageProps?.serie?.chapter_data?.data?.title ||
            null;
          chapterData.body =
            scriptContent?.props?.pageProps?.serie?.chapter_data?.data?.body.join(
              " "
            ) || null;
          break;
      }

      return { sucess: true, data: chapterData };
    } catch (error: any) {
      console.error(error);
      return {
        success: false,
        message: error.message || JSON.stringify(error),
      };
    }
  }

  getSourceWebsiteConfig(): sourceWebsiteConfig {
    switch (this.code) {
      case "WTR_LAB":
        return configUrlSourceWebsite;
    }
  }
}
