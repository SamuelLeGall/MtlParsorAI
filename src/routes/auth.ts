import router from "./index";
import { Authentification } from "../business/auth/Authentification";
import { ResultFactory } from "../models/response";
import { sourceWebsiteManager } from "../business/sourcesWebsites/sourceWebsiteManager";
import {
  destinationBase,
  sourcesWebsites,
} from "../business/sourcesWebsites/sourceWebsitesData";
const instanceSourceWebsite = new sourceWebsiteManager(
  destinationBase,
  sourcesWebsites,
);
router.get("/login", async function (req, res) {
  // return the processed chapter
  const userID = req.cookies["userID"];
  const token = req.cookies["accessToken"];

  try {
    if (!userID || !token) {
      // no session, ask to connect
      return res.render("login", {
        title: "MtlParsorAI",
      });
    }

    const resultValidation = new Authentification().verifyAccessToken(
      token,
      userID,
    );

    if (ResultFactory.isError(resultValidation)) {
      const [, errorValidation] = resultValidation;
      errorValidation.logToConsole();
      // invalid session, ask to connect again
      return res.render("login", {
        title: "MtlParsorAI",
      });
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

router.get("/create", async function (req, res) {
  // return the processed chapter
  const userID = req.cookies["userID"];
  const token = req.cookies["accessToken"];

  try {
    if (!userID || !token) {
      // no session, ask to connect
      return res.render("createAccount", {
        title: "MtlParsorAI",
      });
    }

    const resultValidation = new Authentification().verifyAccessToken(
      token,
      userID,
    );

    if (ResultFactory.isError(resultValidation)) {
      const [, errorValidation] = resultValidation;
      errorValidation.logToConsole();
      // invalid session, ask to connect again
      return res.render("createAccount", {
        title: "MtlParsorAI",
      });
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

router.post("/login", async function (req, res) {
  const instance = new Authentification();
  const result = await instance.login(req.body.username, req.body.password);
  if (ResultFactory.isError(result)) {
    const [, errorLogin] = result;
    errorLogin.logToConsole();
    res
      .status(errorLogin.code === "UNEXPECTED_ERROR" ? 500 : 403)
      .send(errorLogin.getPublicMessage());
    return;
  }

  const [data] = result;
  // Store both cookies
  res.cookie("accessToken", data.accessToken, {
    httpOnly: true, // protect from JS access
    secure: true, // send only via HTTPS
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    path: "/",
  });

  res.cookie("userID", data.userID, {
    httpOnly: false,
    secure: true,
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000,
    path: "/",
  });
  res.status(200).send({
    success: true,
    userID: data.userID,
  });
  return;
});

router.get("/logout", (req, res) => {
  try {
    // Clear cookies if they exist
    res.clearCookie("accessToken", {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    res.clearCookie("userID", { path: "/", secure: true, sameSite: "strict" });
  } catch (err) {
    console.warn("Logout warning: could not clear all cookies", err);
    // continue anyway
  }

  // Redirect to login page
  return res.redirect("/login");
});

router.post("/create", async function (req, res) {
  const instance = new Authentification();
  const result = await instance.create(
    req.body.username,
    req.body.password,
    req.body.authKey,
  );
  if (ResultFactory.isError(result)) {
    const [, errorCreate] = result;
    errorCreate.logToConsole();
    res
      .status(errorCreate.code === "UNEXPECTED_ERROR" ? 500 : 403)
      .send(errorCreate.getPublicMessage());
    return;
  }

  res.sendStatus(201);
  return;
});
export default router;
