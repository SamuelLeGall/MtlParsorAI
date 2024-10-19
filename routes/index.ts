import { Router } from "express";
import { sourceWebsiteManager } from "../business/sourcesWebsites/sourceWebsiteManager.ts";
import { generativeTextOrchestrator } from "../business/textProcessing/generativeTextOrchestrator.ts";
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
  const sourceCode = "WTR_LAB";

  const orchestrator = new generativeTextOrchestrator(sourceCode);
  const dataChapter = await orchestrator.computeChapter(url);

  // if there is an error
  if (!dataChapter.success) {
    return res.render("index", {
      title: "Express",
      errorAI: dataChapter.message,
    });
  }

  // if everything is good
  return res.render("chapter", dataChapter.data);
});

export default router;
