export type sourceWebsiteCode = "WTR_LAB" | "FAN_MTL";
export interface wtrLabModel {
  props: {
    pageProps: {
      serie: {
        chapter_data: {
          data: {
            title: string;
            body: string[];
          };
        };
      };
    };
  };
}
