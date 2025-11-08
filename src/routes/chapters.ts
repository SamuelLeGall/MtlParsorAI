import {
  destinationBase,
  sourcesWebsites,
} from "../business/sourcesWebsites/sourceWebsitesData";
import { generativeTextOrchestrator } from "../business/textProcessing/generativeTextOrchestrator";
import { sourceWebsiteManager } from "../business/sourcesWebsites/sourceWebsiteManager";
import { Router } from "express";
const router = Router();

router.post("/chapter/load", async function (req, res) {
  const destination = req.body.destination || destinationBase;
  const allowBiggerLimit: boolean = Boolean(req.body.allowBiggerLimit) || false;
  const instanceSourceWebsite = new sourceWebsiteManager(
    destinationBase,
    sourcesWebsites,
  );
  const orchestrator = new generativeTextOrchestrator(instanceSourceWebsite);
  const dataChapter = await orchestrator.computeChapter(
    destination,
    allowBiggerLimit,
  );

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
export default router;
