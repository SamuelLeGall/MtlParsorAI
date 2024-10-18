import { fetchCachedChapter, addChapterToCache } from "./cache.js";
document.addEventListener("DOMContentLoaded", () => {
  window.loadChapter = async function loadChapter() {
    const config = {
      sourceSiteCode: "WTR_LAB",
      serieCode: 4635,
      serieBaseUrl:
        "https://wtr-lab.com/en/serie-4635/start-with-planetary-governor",
      chapterFragment: "/chapter-",
      chapterNumber: 96,
    };

    try {
      document.getElementById("chapter-content").innerHTML =
        "<p>loading...</p>";

      const chapterStore = fetchCachedChapter(
        config.sourceSiteCode,
        config.serieCode,
        config.chapterNumber
      );
      // chapter in the store, no need to call the api again
      if (chapterStore) {
        document.getElementById("chapter-content").innerHTML =
          chapterStore.data.content; // Update the chapter content
        return;
      }

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
      addChapterToCache(config.sourceSiteCode, config, chapterHtml);
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
    }
  };
});
