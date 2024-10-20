import { Router } from "express";
import { sourceWebsiteManager } from "../business/sourcesWebsites/sourceWebsiteManager.ts";
import { generativeTextOrchestrator } from "../business/textProcessing/generativeTextOrchestrator.ts";
import { sourceWebsiteCode } from "../models/sourceWebsite.ts";
var router = Router();

/* GET home page. */
router.get("/", async function (req: any, res: any, next: any) {
  const defaultSourceWebsiteCode = "WTR_LAB";
  const instanceSourceWebsite = new sourceWebsiteManager(
    defaultSourceWebsiteCode
  );
  const config = instanceSourceWebsite.getSourceWebsiteConfig();
  // return the processed chapter
  res.render("index", {
    title: "MtlParsorAI",
    config,
  });
});

router.post("/load", async function (req: any, res: any, next: any) {
  const url =
    req.body.url ||
    "https://wtr-lab.com/en/serie-4635/start-with-planetary-governor/chapter-96";
  const allowBiggerLimit: boolean = Boolean(req.body.allowBiggerLimit) || false;
  const sourceCode: sourceWebsiteCode = req.body.sourceSiteCode || "WTR_LAB";

  const orchestrator = new generativeTextOrchestrator(sourceCode);
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
  const chapterNumber: number = req.body.chapterNumber || false;
  const serieCode: number = req.body.serieCode || false;
  const sourceCode: sourceWebsiteCode = req.body.sourceSiteCode || "WTR_LAB";

  const orchestrator = new generativeTextOrchestrator(sourceCode);
  const instanceSharedContext = orchestrator.getSharedContext();
  instanceSharedContext.updateDestination(sourceCode, serieCode, chapterNumber);
  return res.sendStatus(200);
});

export default router;
