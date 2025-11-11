import axios from "axios";
import { load } from "cheerio";
import { ReaderDataConfig } from "../../models/readerConfig";

export class sourceWebsiteManager {
  private readonly readerConfig: ReaderDataConfig;

  constructor(readerConfig: ReaderDataConfig) {
    this.readerConfig = readerConfig;
  }

  private async fetchUrlHTML(
    url: string,
  ): Promise<
    { success: true; data: any } | { success: false; message: string }
  > {
    try {
      const response = await axios.get(url);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(error);
      return {
        success: false,
        message: error.message || JSON.stringify(error),
      };
    }
  }

  private buildUrl(): string {
    let url = this.readerConfig.template;
    for (const [codeTemplate, value] of Object.entries(
      this.readerConfig.values,
    )) {
      if (codeTemplate && url.includes(`<${codeTemplate}>`)) {
        url = url.replace(`<${codeTemplate}>`, value.toString());
      }
    }
    return url;
  }

  public async fetchChapterText() {
    let url = "";
    try {
      url = this.buildUrl();
      console.log(`url is ${url}`);
      const response = await this.fetchUrlHTML(url);
      if (!response.success) {
        return { sucess: false, url };
      }

      // Load the HTML into cheerio
      const $ = load(response.data);
      const chapterData: {
        title: null | string;
        body: null | string;
      } = {
        title: null,
        body: null,
      };

      // mapping to get title and libelle depending on the source website
      switch (this.readerConfig.sourceSiteCode) {
        case "FAN_MTL":
        default:
          $("script").remove();
          console.log("source is fanmtl.com");
          chapterData.title =
            $(".chapter-header .content-wrap .titles h2").text() || "";

          chapterData.body = $(".chapter-content").html() || "";
          break;
      }

      return { sucess: true, data: chapterData, url };
    } catch (error: any) {
      console.error(`fetchChapterText - error ${error}`);
      return {
        success: false,
        message: error.message || JSON.stringify(error),
        url,
      };
    }
  }
}
