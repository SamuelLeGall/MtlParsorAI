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
router.get("/", async function (req, res) {
  // return the processed chapter
  const userID = req.cookies["userID"];
  const token = req.cookies["accessToken"];

  try {
    const resultValidation = new Authentification().verifyAccessToken(
      token,
      userID,
    );
    if (ResultFactory.isSuccess(resultValidation)) {
      // user have an active session open
      return res.render("index", {
        title: "MtlParsorAI",
        destination: instanceSourceWebsite.getDestination("default"),
        sitesSources: instanceSourceWebsite.getSourceWebsites(),
      });
    }

    // no session, ask to connect
    return res.render("login", {
      title: "MtlParsorAI",
    });
  } catch (e) {
    return res.render("login", {
      title: "MtlParsorAI",
    });
  }
});

router.post("/destination", (req, res) => {
  const newDestination: destination =
    req.body.newConfigDestination || destinationBase;
  instanceSourceWebsite.updateDestination(newDestination);
  // TODO
  return res.sendStatus(200);
});

export default router;
