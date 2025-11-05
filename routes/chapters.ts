import { destinationBase } from "../business/sourcesWebsites/sourceWebsitesData";
import { generativeTextOrchestrator } from "../business/textProcessing/generativeTextOrchestrator";
import router from "./index";

router.post("/load", async function (req: any, res: any, next: any) {
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
export default router;
