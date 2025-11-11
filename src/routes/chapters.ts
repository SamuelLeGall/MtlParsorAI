import { Router } from "express";
import { ChaptersRepository } from "../business/chapters/ChaptersRepository";
import validator from "validator";
import { BookmarksRepository } from "../business/users/BookmarksRepository";
import { ChapterViewResponse } from "../models/chapter";
const router = Router();

function renderViewToString(res: any, view: any, options: any) {
  return new Promise((resolve, reject) => {
    res.render(view, options, (err: any, html: any) => {
      if (err) reject(err);
      else resolve(html);
    });
  });
}

router.post("/chapter/load", async function (req, res) {
  try {
    if (!req.user?.userID) {
      console.error(
        "path: /chapter/load - Rejected a router.post for missing userID despite verifyJWT",
      );
      res.status(403).send("An Error Occured!");
      return;
    }

    const normalizedBookmarkID = validator.escape(req.body.bookmarkID);
    const allowBiggerLimit: boolean =
      Boolean(req.body.allowBiggerLimit) || false;
    const updateChapterNumber: boolean =
      Boolean(req.body.updateChapterNumber) || false;
    const normalizedChapterNumber = validator.escape(
      String(req.body.chapterNumber),
    );
    const chapterNumber = Number.parseInt(normalizedChapterNumber, 10);
    if (Number.isNaN(chapterNumber)) {
      return res.render("error", {
        title: "Error",
        errorAI: "Invalid Parameters",
      });
    }
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
      chapterNumber,
      allowBiggerLimit,
    );
    if (!chapter) {
      return res.render("error", {
        title: "Error",
        errorAI: "Unable to load chapter",
      });
    }

    if (updateChapterNumber) {
      hydratedBookmark.bookmark.currentChapter = chapterNumber;
      await instanceBookmarksRepository.update(
        req.user.userID,
        hydratedBookmark.bookmark.id,
        hydratedBookmark.bookmark,
      );
    }

    const chapterViewResponse: ChapterViewResponse = {
      bookmarkID: hydratedBookmark.bookmark.id,
      book: {
        id: hydratedBookmark.book.id,
        name: hydratedBookmark.book.name,
        author: hydratedBookmark.book.author,
      },
      navigation: {
        currentChapter: chapterNumber,
        isNotFirstChapter: chapterNumber > 1,
      },
      chapter,
    };

    const html = await renderViewToString(res, "chapter", {
      layout: false,
      title: "MtlParsorAI",
      chapterViewResponse,
    });

    res.json({
      html,
      scriptData: chapterViewResponse,
    });
  } catch (e) {
    return res.render("error", {
      title: "Error",
      errorAI: "Unable to load chapter",
    });
  }
});

router.post("/chapter/initView", async function (req, res) {
  try {
    if (!req.user?.userID) {
      console.error(
        "path: /chapter/initView - Rejected a router.post for missing userID despite verifyJWT",
      );
      res.status(403).send("An Error Occured!");
      return;
    }

    const normalizedBookmarkID = validator.escape(req.body.bookmarkID);
    const normalizedChapterNumber = validator.escape(
      String(req.body.chapterNumber),
    );
    const chapterNumber = Number.parseInt(normalizedChapterNumber, 10);
    if (Number.isNaN(chapterNumber)) {
      return res.render("error", {
        title: "Error",
        errorAI: "Invalid Parameters",
      });
    }

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
      chapterNumber,
      false,
    );
    if (!chapter) {
      return res.render("error", {
        title: "Error",
        errorAI: "Unable to load chapter",
      });
    }

    hydratedBookmark.bookmark.currentChapter = chapterNumber;
    await instanceBookmarksRepository.update(
      req.user.userID,
      hydratedBookmark.bookmark.id,
      hydratedBookmark.bookmark,
    );

    return res.redirect(
      `/?bookmarkID=${encodeURI(hydratedBookmark.bookmark.id)}`,
    );
  } catch (e) {
    return res.render("error", {
      title: "Error",
      errorAI: "Unable to load chapter",
    });
  }
});
export default router;
