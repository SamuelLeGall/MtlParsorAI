import {
  fetchCachedChapter,
  addChapterToCache,
  checkInitStore,
  saveStoreToLocalStorage,
} from "./cache.js";
document.addEventListener("DOMContentLoaded", () => {
  // we restore the store from localStorage if it exist on first page load
  checkInitStore();

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
      function cleanStoreChapters(
        store,
        chaptersToKeep,
        currentSourceId,
        currentSerieId
      ) {
        let allChapters = [];

        // Collect all chapters from the store
        store.data.forEach((source) => {
          source.chaptersList.forEach((chapter) => {
            allChapters.push(chapter);
          });
        });

        // Sort chapters by creation date (oldest first)
        allChapters.sort(
          (a, b) => new Date(a.urlData.created) - new Date(b.urlData.created)
        );

        // Filter out chapters that belong to the current series, we will clean them last
        const nonCurrentChapters = allChapters.filter(
          (chapter) =>
            !(
              chapter.urlData.sourceSiteCode === currentSourceId &&
              chapter.urlData.serieCode === currentSerieId
            )
        );

        const currentSeriesChapters = allChapters.filter(
          (chapter) =>
            chapter.urlData.sourceSiteCode === currentSourceId &&
            chapter.urlData.serieCode === currentSerieId
        );

        // Calculate how many chapters we need to remove
        const totalChapters = allChapters.length;
        const chaptersToRemove = totalChapters - chaptersToKeep;

        if (chaptersToRemove <= 0) {
          return; // Nothing to clean if we are under the limit
        }

        // Start cleaning from the non-current chapters (remove the oldest ones first)
        let cleanedChapters = [];

        // Remove the oldest from non-current series chapters first
        for (
          let i = 0;
          i < chaptersToRemove && nonCurrentChapters.length > 0;
          i++
        ) {
          cleanedChapters.push(nonCurrentChapters.shift());
        }

        // If there are still more chapters to remove, start cleaning current series
        for (
          let i = cleanedChapters.length;
          i < chaptersToRemove && currentSeriesChapters.length > 0;
          i++
        ) {
          cleanedChapters.push(currentSeriesChapters.shift());
        }

        // Remove the cleaned chapters from the store
        cleanedChapters.forEach((chapterToRemove) => {
          store.data.forEach((source) => {
            source.chaptersList = source.chaptersList.filter(
              (chapter) => chapter !== chapterToRemove
            );
          });
        });

        return {
          cleaned: cleanedChapters.length,
          remaining: store.data,
        };
      }
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

    // we save the store into localStorage
    saveStoreToLocalStorage();
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

    // we save the store into localStorage
    saveStoreToLocalStorage();
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

    // we save the store into localStorage
    saveStoreToLocalStorage();
  };
});
