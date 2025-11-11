import { Router } from "express";
import validator from "validator";
import { BookmarksRepository } from "../business/users/BookmarksRepository";
import { ChaptersRepository } from "../business/chapters/ChaptersRepository";
import { ChapterViewResponse } from "../models/chapter";
const router = Router();

/* GET home page. */
router.get("/", async (req, res) => {
  try {
    if (!req.user?.userID) {
      console.error(
        "path: / - Rejected a router.get for missing userID despite verifyJWT",
      );
      return res.redirect("/login");
    }

    // user have an active session open
    const pageProps: {
      title: string;
      chapterViewResponse?: ChapterViewResponse;
    } = {
      title: "MtlParsorAI",
      chapterViewResponse: undefined,
    };

    if (req.query.bookmarkID) {
      const normalizedBookmarkID = validator.escape(
        String(req.query.bookmarkID),
      );

      const instanceBookmarksRepository = new BookmarksRepository();
      const hydratedBookmark = await instanceBookmarksRepository.fetchByID(
        req.user.userID,
        normalizedBookmarkID,
      );
      if (!hydratedBookmark) {
        return res.render("error", {
          title: "Error",
          errorAI: "Can't find current book",
        });
      }

      const instanceChaptersRepository = new ChaptersRepository();
      const chapter = await instanceChaptersRepository.getChapter(
        hydratedBookmark.book.id,
        hydratedBookmark.bookmark.currentChapter,
        false,
      );
      if (!chapter) {
        return res.render("error", {
          title: "Error",
          errorAI: "Unable to load chapter",
        });
      }

      pageProps.chapterViewResponse = {
        bookmarkID: hydratedBookmark.bookmark.id,
        book: {
          id: hydratedBookmark.book.id,
          name: hydratedBookmark.book.name,
          author: hydratedBookmark.book.author,
        },
        navigation: {
          currentChapter: hydratedBookmark.bookmark.currentChapter,
          isNotFirstChapter: hydratedBookmark.bookmark.currentChapter > 1,
        },
        chapter,
      };
    }

    return res.render("index", pageProps);
  } catch (e) {
    return res.redirect("/login");
  }
});

export default router;
