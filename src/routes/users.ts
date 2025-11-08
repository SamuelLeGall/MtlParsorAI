import { Router } from "express";
const router = Router();

router.get("/bookmark", async (_, res) => {
  return res.render("bookmark", {
    title: "MtlParsorAI",
  });
});

export default router;
