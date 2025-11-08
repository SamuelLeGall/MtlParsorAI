import { Router } from "express";
import { sourceWebsiteManager } from "../business/sourcesWebsites/sourceWebsiteManager";
import {
  destinationBase,
  sourcesWebsites,
} from "../business/sourcesWebsites/sourceWebsitesData";
import { destination } from "../models/contexte";
import { Authentification } from "../business/auth/Authentification";
import { ResultFactory } from "../models/response";

const router = Router();
const instanceSourceWebsite = new sourceWebsiteManager(
  destinationBase,
  sourcesWebsites,
);

/* GET home page. */
router.get("/", async (req, res) => {
  // return the processed chapter
  const userID = req.cookies["userID"];
  const token = req.cookies["accessToken"];

  try {
    if (!userID || !token) {
      // no session, ask to connect
      return res.redirect("/login");
    }

    const resultValidation = await new Authentification().verifyAccessToken(
      token,
      userID,
    );

    if (ResultFactory.isError(resultValidation)) {
      const [, errorValidation] = resultValidation;
      errorValidation.logToConsole();
      // invalid session, ask to connect again
      return res.redirect("/login");
    }

    // user have an active session open
    return res.render("index", {
      title: "MtlParsorAI",
      destination: instanceSourceWebsite.getDestination("default"),
      sitesSources: instanceSourceWebsite.getSourceWebsites(),
    });
  } catch (e) {
    return res.redirect("/login");
  }
});

router.post("/destination", (req, res) => {
  const newDestination: destination =
    req.body.newConfigDestination || destinationBase;
  instanceSourceWebsite.updateDestination(newDestination);
  // TODO
  res.sendStatus(200);
  return;
});

export default router;
