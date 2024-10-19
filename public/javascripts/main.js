import { fetchCachedChapter, addChapterToCache } from "./cache.js";
document.addEventListener("DOMContentLoaded", () => {
  window.loadChapter = async function loadChapter(chapterNumber) {
    try {
      const chapterNumberProcessed =
        chapterNumber ?? configUrlSourceWebsite.chapterNumber;

      // configUrlSourceWebsite is set in index.hbs using data from the back
      const chapterStore = fetchCachedChapter(
        configUrlSourceWebsite.sourceSiteCode,
        configUrlSourceWebsite.serieCode,
        chapterNumberProcessed
      );

      // chapter in the store, no need to call the api again
      if (chapterStore) {
        console.log(
          "chapter " + chapterNumberProcessed + " is in the store",
          chapterStore
        );
        return chapterStore.data;
      }

      console.log("fetching the chapter " + chapterNumberProcessed + " by API");
      const url =
        configUrlSourceWebsite.serieBaseUrl +
        configUrlSourceWebsite.chapterFragment +
        chapterNumberProcessed;
      const response = await fetch("/load", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const chapterHtml = await response.text(); // Get HTML response directly

      // we save the response in the store with the correct urlData
      const urlData = { ...configUrlSourceWebsite };
      // configUrlSourceWebsite is about the current chapter, so we update the number is this shallow copy without affecting the original object
      urlData.chapterNumber = chapterNumberProcessed;
      addChapterToCache(urlData.sourceSiteCode, urlData, chapterHtml);

      return chapterHtml;
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
      throw new Error("Error happened");
    }
  };
  window.loadPreviousChapter = async function loadPreviousChapter(
    currentChapterNumber
  ) {
    try {
      if (
        !configUrlSourceWebsite.chapterNumber ||
        configUrlSourceWebsite.chapterNumber <= 1
      ) {
        return { success: false };
      }
      const chapterData = await loadChapter(currentChapterNumber - 1);
      return { success: true, chapterData };
    } catch (e) {
      return { success: false };
    }
  };
  window.loadCurrentChapter = async function loadCurrentChapter(
    currentChapterNumber
  ) {
    try {
      const chapterData = await loadChapter(currentChapterNumber);
      return { success: true, chapterData };
    } catch (e) {
      return { success: false };
    }
  };
  window.loadNextChapter = async function loadNextChapter(
    currentChapterNumber
  ) {
    try {
      const chapterData = await loadChapter(currentChapterNumber + 1);
      return { success: true, chapterData };
    } catch (e) {
      return { success: false };
    }
  };
  window.showCurrentChapter = async function showCurrentChapter() {
    document.getElementById("chapter-content").innerHTML = "<p>loading...</p>";
    const response = await loadCurrentChapter(
      configUrlSourceWebsite.chapterNumber
    );
    if (!response.success) {
      return;
    }
    document.getElementById("chapter-content").innerHTML = response.chapterData; // Update the chapter content

    // load next chapter first because more likely it's going to be visited instead of the previous one
    await loadNextChapter(configUrlSourceWebsite.chapterNumber);

    // load previous chapter
    await loadPreviousChapter(configUrlSourceWebsite.chapterNumber);
  };
  window.showPreviousChapter = async function showPreviousChapter() {
    document.getElementById("chapter-content").innerHTML = "<p>loading...</p>";

    // load previous chapter
    const response = await loadPreviousChapter(
      configUrlSourceWebsite.chapterNumber
    );
    if (!response.success) {
      return;
    }
    document.getElementById("chapter-content").innerHTML = response.chapterData; // Update the chapter content

    // we update the current chapterNumber
    configUrlSourceWebsite.chapterNumber -= 1;

    // load 2 chapter before ( because we just updated the chapter number)
    await loadPreviousChapter(configUrlSourceWebsite.chapterNumber);
  };
  window.showNextChapter = async function showNextChapter() {
    document.getElementById("chapter-content").innerHTML = "<p>loading...</p>";

    // load next chapter
    const response = await loadNextChapter(
      configUrlSourceWebsite.chapterNumber
    );
    if (!response.success) {
      return;
    }
    document.getElementById("chapter-content").innerHTML = response.chapterData; // Update the chapter content

    // we update the current chapterNumber
    configUrlSourceWebsite.chapterNumber += 1;

    // load 2 chapter after ( because we just updated the chapter number)
    await loadNextChapter(configUrlSourceWebsite.chapterNumber);
  };
});
