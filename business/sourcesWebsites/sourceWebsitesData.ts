import { destination } from "../../models/contexte";
import { sourceWebsitesSelect } from "../../models/sourceWebsite";

export const destinationBase: destination = {
  sourceSiteCode: "WTR_LAB",
  userId: "default",
  urlParam:
    "https://wtr-lab.com/en/serie-<SERIE_FRAGMENT>/chapter-<CHAPTER_NUMBER>",
  params: [
    {
      code: "SERIE_FRAGMENT",
      value: "4635/start-with-planetary-governor",
    },
    {
      code: "CHAPTER_NUMBER",
      value: 96,
    },
  ],
};
export const destinationBase2: destination = {
  sourceSiteCode: "FAN_MTL",
  userId: "default",
  urlParam:
    "https://www.fanmtl.com/novel/<SERIE_FRAGMENT>_<CHAPTER_NUMBER>.html",
  params: [
    {
      code: "SERIE_FRAGMENT",
      value: "arc-of-gunfire",
    },
    {
      code: "CHAPTER_NUMBER",
      value: 130,
    },
  ],
};

export const sourcesWebsites: sourceWebsitesSelect[] = [
  {
    code: "WTR_LAB",
    libelle: "wtr-lab.com",
  },
  {
    code: "FAN_MTL",
    libelle: "fanmtl.com",
  },
];
