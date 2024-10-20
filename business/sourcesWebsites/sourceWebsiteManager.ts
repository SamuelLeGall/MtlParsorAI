import axios from "axios";
import { load } from "cheerio";
import { sourceWebsiteCode, wtrLabModel } from "../../models/sourceWebsite";
import { destination } from "../../models/contexte";

export class sourceWebsiteManager {
  private destination: destination;

  constructor(destination: destination) {
    this.destination = destination;
  }

  getDestination(): destination {
    return this.destination;
  }

  updateDestination(
    sourceSiteCode: sourceWebsiteCode,
    serieCode: number,
    chapterNumber: number
  ): void {
    this.destination.sourceSiteCode = sourceSiteCode;
    this.destination.serieCode = serieCode;
    this.destination.chapterNumber = chapterNumber;
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
      switch (this.destination.sourceSiteCode) {
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
}
