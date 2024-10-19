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

export type sourceWebsiteCode = "WTR_LAB";
