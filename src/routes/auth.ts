import router from "./index";
import { Authentification } from "../business/auth/Authentification";
import { ResultFactory } from "../models/response";

router.get("/login", async function (req, res) {
  return res.render("login", {
    title: "MtlParsorAI",
  });
});

router.get("/create", async function (req, res) {
  return res.render("createAccount", {
    title: "MtlParsorAI",
  });
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
