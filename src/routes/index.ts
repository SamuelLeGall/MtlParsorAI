import { Router } from "express";
import { sourceWebsiteManager } from "../business/sourcesWebsites/sourceWebsiteManager";
import {
  destinationBase,
  sourcesWebsites,
} from "../business/sourcesWebsites/sourceWebsitesData";
import { generativeTextOrchestrator } from "../business/textProcessing/generativeTextOrchestrator";
import { destination } from "../models/contexte";

const router = Router();
const instanceSourceWebsite = new sourceWebsiteManager(
  destinationBase,
  sourcesWebsites,
);

// temporary solution since the website in now live
const keyToAccessBack = ":fr6UoOO4b7nrlC07KAlh6y6Na-qawxsVMr8tRHHL";

/* GET home page. */
router.get("/", async function (req: any, res: any) {
  // return the processed chapter
  res.render("index", {
    title: "MtlParsorAI",
    destination: instanceSourceWebsite.getDestination("default"),
    sitesSources: instanceSourceWebsite.getSourceWebsites(),
  });
});

router.get("/bookmark", async function (req: any, res: any) {
  // return the processed chapter
  res.render("bookmark", {
    title: "MtlParsorAI - Saved books",
    destination: instanceSourceWebsite.getDestination("default"),
  });
});

router.post("/load", async function (req: any, res: any) {
  const key = typeof req.body.key === "string" ? req.body.key.trim() : "";
  if (key !== keyToAccessBack) {
    return res.sendStatus(403);
  }
  const destination = req.body.destination || destinationBase;
  const allowBiggerLimit: boolean = Boolean(req.body.allowBiggerLimit) || false;

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

router.post("/destination", (req: any, res: any) => {
  const key = typeof req.body.key === "string" ? req.body.key.trim() : "";
  if (key !== keyToAccessBack) {
    return res.sendStatus(403);
  }
  const newDestination: destination =
    req.body.newConfigDestination || destinationBase;
  instanceSourceWebsite.updateDestination(newDestination);
  return res.sendStatus(200);
});

export default router;
