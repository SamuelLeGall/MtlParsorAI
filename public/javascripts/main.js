import {
  fetchCachedChapter,
  addChapterToCache,
  checkInitStore,
  saveStoreToLocalStorage,
} from "./cache.js";
document.addEventListener("DOMContentLoaded", () => {
  // we restore the store from localStorage if it exist on first page load
  checkInitStore();
  window.showEndChapternavbar = function showEndChapternavbar() {
    const element = document.getElementById("navigation-under-chapter");

    if (element && !element.classList.contains("visible")) {
      element.classList.add("visible");
    }
  };
  window.loadChapter = async function loadChapter(
    chapterNumber,
    allowBiggerLimit = false
  ) {
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
        // we show the navbar under the chapter
        showEndChapternavbar();
        return chapterStore.data;
      }

      console.log("fetching the chapter " + chapterNumberProcessed + " by API");
      const url =
        configUrlSourceWebsite.serieBaseUrl +
        configUrlSourceWebsite.chapterFragment +
        chapterNumberProcessed;
      const key = document.getElementById("temp-key-input").value;
      let body = { url, key };
      if (allowBiggerLimit) {
        body = { ...body, allowBiggerLimit: true };
      }
      const response = await fetch("/load", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        document.getElementById("chapter-content").innerHTML =
          "<p>An error occured</p>";
        throw new Error("Network response was not ok");
      }

      const chapterHtml = await response.text(); // Get HTML response directly

      // we save the response in the store with the correct urlData only if it not an error page
      if (!chapterHtml.includes("<title>Error</title>")) {
        const urlData = { ...configUrlSourceWebsite };
        // configUrlSourceWebsite is about the current chapter, so we update the number is this shallow copy without affecting the original object
        urlData.chapterNumber = chapterNumberProcessed;
        addChapterToCache(urlData.sourceSiteCode, urlData, chapterHtml);
      }

      // we show the navbar under the chapter
      showEndChapternavbar();

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
    currentChapterNumber,
    allowBiggerLimit = false
  ) {
    try {
      const chapterData = await loadChapter(
        currentChapterNumber,
        allowBiggerLimit
      );
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

  window.updateDestinationBack = async function updateDestinationBack(
    sourceCode,
    serieCode,
    chapterNumber
  ) {
    try {
      const key = document.getElementById("temp-key-input").value;
      const response = await fetch("/destination", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceCode,
          serieCode,
          chapterNumber,
          key,
        }),
      });

      if (!response.ok) {
        document.getElementById("chapter-content").innerHTML =
          "<p>An error occured</p>";
        throw new Error("Network response was not ok");
      }

      return true;
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
      throw new Error("Error happened");
    }
  };
  window.showCurrentChapter = async function showCurrentChapter(
    allowBiggerLimit = false
  ) {
    document.getElementById("chapter-content").innerHTML = "<p>loading...</p>";
    const response = await loadCurrentChapter(
      configUrlSourceWebsite.chapterNumber,
      allowBiggerLimit
    );
    if (!response.success) {
      return;
    }
    document.getElementById("chapter-content").innerHTML = response.chapterData; // Update the chapter content
    scrollTo({ behavior: "smooth", top: 0 });

    await Promise.all([
      // load next chapter first because more likely it's going to be visited instead of the previous one
      loadNextChapter(configUrlSourceWebsite.chapterNumber),

      // load previous chapter
      loadPreviousChapter(configUrlSourceWebsite.chapterNumber),
    ]);

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
    scrollTo({ behavior: "smooth", top: 0 });

    // we update the current chapterNumber
    configUrlSourceWebsite.chapterNumber -= 1;

    await Promise.all([
      // we tell the backend that we changed chapter (necessary because of the cached chapter)
      await updateDestinationBack(
        configUrlSourceWebsite.sourceSiteCode,
        configUrlSourceWebsite.serieCode,
        configUrlSourceWebsite.chapterNumber
      ),

      // load 2 chapter before ( because we just updated the chapter number)
      loadPreviousChapter(configUrlSourceWebsite.chapterNumber),
    ]);

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
    scrollTo({ behavior: "smooth", top: 0 });

    // we update the current chapterNumber
    configUrlSourceWebsite.chapterNumber += 1;

    await Promise.all([
      // we tell the backend that we changed chapter (necessary because of the cached chapter)
      updateDestinationBack(
        configUrlSourceWebsite.sourceSiteCode,
        configUrlSourceWebsite.serieCode,
        configUrlSourceWebsite.chapterNumber
      ),

      // load 2 chapter after ( because we just updated the chapter number)
      loadNextChapter(configUrlSourceWebsite.chapterNumber),
    ]);

    // we save the store into localStorage
    saveStoreToLocalStorage();
  };

  window.showSpecificChapter = async function showSpecificChapter() {
    const chapterNumberToLoad = parseInt(
      document.getElementById("selected-chapter-input").value
    );

    document.getElementById("chapter-content").innerHTML = "<p>loading...</p>";
    const response = await loadCurrentChapter(chapterNumberToLoad);
    if (!response.success) {
      return;
    }
    document.getElementById("chapter-content").innerHTML = response.chapterData; // Update the chapter content
    scrollTo({ behavior: "smooth", top: 0 });

    // we update the current chapterNumber
    configUrlSourceWebsite.chapterNumber = chapterNumberToLoad;

    await Promise.all([
      // we tell the backend that we changed chapter (necessary because of the cached chapter)
      updateDestinationBack(
        configUrlSourceWebsite.sourceSiteCode,
        configUrlSourceWebsite.serieCode,
        configUrlSourceWebsite.chapterNumber
      ),

      // load next chapter first because more likely it's going to be visited instead of the previous one
      loadNextChapter(chapterNumberToLoad),

      // load previous chapter
      loadPreviousChapter(chapterNumberToLoad),
    ]);

    // we save the store into localStorage
    saveStoreToLocalStorage();
  };
});
