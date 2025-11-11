import { Router } from "express";
import { BookmarksRepository } from "../business/users/BookmarksRepository";
const router = Router();

router.get("/bookmark", async (req, res) => {
  if (!req.user?.userID) {
    console.error(
      "path: /bookmark - Rejected a router.get for missing userID despite verifyJWT",
    );
    return res.redirect("/login");
  }

  const instanceBookmarksRepository = new BookmarksRepository();
  const bookmarks = await instanceBookmarksRepository.fetchAllByUserID(
    req.user.userID,
  );
  return res.render("bookmark", {
    title: "MtlParsorAI",
    bookmarks,
  });
});

export default router;
