const configUrlSourceWebsite = {
  sourceSiteCode: "WTR_LAB",
  serieCode: 4635,
  serieBaseUrl:
    "https://wtr-lab.com/en/serie-4635/start-with-planetary-governor",
  chapterFragment: "/chapter-",
  chapterNumber: 96,
};

export function getSourceWebsiteConfig(codeSource) {
  switch (codeSource) {
    case "WTR_LAB":
      return configUrlSourceWebsite;
  }
}
