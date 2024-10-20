import { Router } from "express";
import { sourceWebsiteManager } from "../business/sourcesWebsites/sourceWebsiteManager";
import { destinationBase } from "../business/sourcesWebsites/sourceWebsitesData";
import { generativeTextOrchestrator } from "../business/textProcessing/generativeTextOrchestrator";
import { sourceWebsiteCode } from "../models/sourceWebsite";

var router = Router();
const instanceSourceWebsite = new sourceWebsiteManager(destinationBase);

// temporary solution since the website in now live
const keyToAccessBack = ":fr6UoOO4b7nrlC07KAlh6y6Na-qawxsVMr8tRHHL";

/* GET home page. */
router.get("/", async function (req: any, res: any, next: any) {
  // return the processed chapter
  res.render("index", {
    title: "MtlParsorAI",
    destination: instanceSourceWebsite.getDestination(),
  });
});

router.post("/load", async function (req: any, res: any, next: any) {
  const key = typeof req.body.key === "string" ? req.body.key.trim() : "";
  if (key !== keyToAccessBack) {
    return res.sendStatus(403);
  }
  const url =
    req.body.url ||
    "https://wtr-lab.com/en/serie-4635/start-with-planetary-governor/chapter-97";
  const allowBiggerLimit: boolean = Boolean(req.body.allowBiggerLimit) || false;

  const orchestrator = new generativeTextOrchestrator(instanceSourceWebsite);
  const dataChapter = await orchestrator.computeChapter(url, allowBiggerLimit);

  // if there is an error
  if (!dataChapter.success) {
    return res.render("error", {
      title: "Error",
      errorAI: dataChapter.message,
      detail: dataChapter.detail,
    });
  }

  // everything is good
  return res.render("chapter", dataChapter.data);
});

router.post("/destination", (req: any, res: any) => {
  const key = typeof req.body.key === "string" ? req.body.key.trim() : "";
  if (key !== keyToAccessBack) {
    return res.sendStatus(403);
  }
  const chapterNumber: number = req.body.chapterNumber || false;
  const serieCode: number = req.body.serieCode || false;
  const sourceCode: sourceWebsiteCode = req.body.sourceSiteCode || "WTR_LAB";
  instanceSourceWebsite.updateDestination(sourceCode, serieCode, chapterNumber);
  return res.sendStatus(200);
});

export default router;
