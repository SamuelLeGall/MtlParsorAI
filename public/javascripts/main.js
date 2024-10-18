import { fetchCachedChapter, addChapterToCache } from "./cache.js";
document.addEventListener("DOMContentLoaded", () => {
  window.loadChapter = async function loadChapter() {
    try {
      document.getElementById("chapter-content").innerHTML =
        "<p>loading...</p>";

      // configUrlSourceWebsite is set in index.hbs using data from the back
      const chapterStore = fetchCachedChapter(
        configUrlSourceWebsite.sourceSiteCode,
        configUrlSourceWebsite.serieCode,
        configUrlSourceWebsite.chapterNumber
      );

      // chapter in the store, no need to call the api again
      if (chapterStore) {
        document.getElementById("chapter-content").innerHTML =
          chapterStore.data; // Update the chapter content
        return;
      }

      const url =
        configUrlSourceWebsite.serieBaseUrl +
        configUrlSourceWebsite.chapterFragment +
        configUrlSourceWebsite.chapterNumber;
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
      document.getElementById("chapter-content").innerHTML = chapterHtml; // Update the chapter content

      // we save the response in the store
      addChapterToCache(
        configUrlSourceWebsite.sourceSiteCode,
        configUrlSourceWebsite,
        chapterHtml
      );
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
    }
  };
});
