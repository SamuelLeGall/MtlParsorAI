import axios from "axios";
import { load } from "cheerio";
import { sourceWebsitesSelect, wtrLabModel } from "../../models/sourceWebsite";
import { destination } from "../../models/contexte";

export class sourceWebsiteManager {
  private destinations: destination[];
  private configSourceWebsite: sourceWebsitesSelect[];

  constructor(
    destination: destination,
    configSourceWebsite: sourceWebsitesSelect[]
  ) {
    this.destinations = [destination];
    this.configSourceWebsite = configSourceWebsite;
  }

  getSourceWebsites(): sourceWebsitesSelect[] {
    return this.configSourceWebsite;
  }

  getDestination(userId: string): destination | undefined {
    return this.destinations.find(
      (destination) => destination.userId === userId
    );
  }

  updateDestination(destination: destination): void {
    const index = this.destinations.findIndex(
      (destination) => destination.userId === destination.userId
    );
    this.destinations[index] = destination;
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

  private buildUrl(destination: destination): string {
    let url = destination.urlParam;
    destination.params.forEach((param) => {
      if (param.code && destination.urlParam.includes(`<${param.code}>`)) {
        url = url.replace(`<${param.code}>`, param.value.toString());
      }
    });
    return url;
  }

  async fetchChapterText(destination: destination) {
    let url = "";
    try {
      url = this.buildUrl(destination);
      console.log(`url is ${url}`);
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
      switch (destination.sourceSiteCode) {
        case "FAN_MTL":
          console.log("source is fanmtl.com");
          chapterData.title =
            $(".chapter-header .content-wrap .titles h2").text() || "";

          chapterData.body = $(".chapter-content").html() || "";
          break;
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

      return { sucess: true, data: chapterData, url };
    } catch (error: any) {
      console.error(error);
      return {
        success: false,
        message: error.message || JSON.stringify(error),
        url,
      };
    }
  }
}
