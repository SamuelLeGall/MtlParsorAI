/* global chapterViewResponse */
document.addEventListener("DOMContentLoaded", () => {
  function showElement(element) {
    if (element && !element.classList.contains("visible")) {
      element.classList.add("visible");
    }
    if (element && element.classList.contains("hidden")) {
      element.classList.remove("hidden");
    }
  }
  function hideElement(element) {
    if (element && !element.classList.contains("hidden")) {
      element.classList.add("hidden");
    }
    if (element && element.classList.contains("visible")) {
      element.classList.remove("visible");
    }
  }
  function toggleElementVisibility(id) {
    const element = document.getElementById(id);
    if (element && !element.classList.contains("visible")) {
      showElement(element);
    } else if (element) {
      hideElement(element);
    }
  }

  async function loadChapter(
    chapterNumber,
    updateChapterNumber,
    allowBiggerLimit = false,
  ) {
    try {
      console.log(`fetching the chapter ${chapterNumber} by API`);

      let body = {
        chapterNumber,
        bookmarkID: chapterViewResponse.bookmarkID,
        updateChapterNumber,
      };
      if (allowBiggerLimit) {
        body = { ...body, allowBiggerLimit: true };
      }

      // Start both the fetch and the minimum delay timer
      const [response] = await Promise.all([
        fetch("chapter/load", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
        // Ensure total time >= 0.5 seconds
        new Promise((resolve) => setTimeout(resolve, 500)),
      ]);

      if (!response.ok) {
        document.getElementById("chapter-content").innerHTML =
          "<p>An error occured</p>";
        console.error("Network response was not ok");
        return;
      }

      if (response.url.includes("/login")) {
        alert("Your session expired, please log in to access this page.");
        window.location.href = "/login";
        return;
      }

      const { html, scriptData } = await response.json();

      if (updateChapterNumber) {
        // we show the navbar under the chapter
        const bottomNavBar = document.getElementById(
          "navigation-under-chapter",
        );
        showElement(bottomNavBar);

        // we update the front to use the backend data
        syncNavigation(scriptData);
      }

      return html;
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
      throw new Error("Error happened");
    }
  }
  async function loadPreviousChapter(
    currentChapterNumber,
    updateChapterNumber,
  ) {
    try {
      if (!currentChapterNumber || currentChapterNumber <= 1) {
        return { success: false };
      }
      const chapterData = await loadChapter(
        currentChapterNumber - 1,
        updateChapterNumber,
      );
      return { success: true, chapterData };
    } catch (e) {
      return { success: false };
    }
  }
  async function loadCurrentChapter(
    currentChapterNumber,
    updateChapterNumber,
    allowBiggerLimit = false,
  ) {
    try {
      const chapterData = await loadChapter(
        currentChapterNumber,
        updateChapterNumber,
        allowBiggerLimit,
      );
      return { success: true, chapterData };
    } catch (e) {
      return { success: false };
    }
  }
  async function loadNextChapter(currentChapterNumber, updateChapterNumber) {
    try {
      const chapterData = await loadChapter(
        currentChapterNumber + 1,
        updateChapterNumber,
      );
      return { success: true, chapterData };
    } catch (e) {
      return { success: false };
    }
  }

  async function showCurrentChapter(allowBiggerLimit = false) {
    const currentChapter = chapterViewResponse.navigation.currentChapter;
    document.getElementById("chapter-content").innerHTML = "<p>loading...</p>";
    const response = await loadCurrentChapter(
      currentChapter,
      false,
      allowBiggerLimit,
    );
    if (!response.success) {
      return;
    }
    document.getElementById("chapter-content").innerHTML = response.chapterData; // Update the chapter content
    scrollTo({ behavior: "smooth", top: 0 });

    if (!allowBiggerLimit) {
      await Promise.all([
        // load next chapter first because more likely it's going to be visited instead of the previous one
        loadNextChapter(currentChapter, false),

        // load previous chapter
        loadPreviousChapter(currentChapter, false),
      ]);
    }
  }

  async function showPreviousChapter() {
    const currentChapter = chapterViewResponse.navigation.currentChapter;
    const lastChapter = currentChapter - 1;
    document.getElementById("chapter-content").innerHTML = "<p>loading...</p>";

    // load previous chapter
    const response = await loadPreviousChapter(currentChapter, true);
    if (!response.success) {
      return;
    }
    document.getElementById("chapter-content").innerHTML = response.chapterData; // Update the chapter content
    scrollTo({ behavior: "smooth", top: 0 });

    await Promise.all([
      // load 2 chapter before
      loadPreviousChapter(lastChapter, false),
    ]);
  }

  async function showNextChapter() {
    const currentChapter = chapterViewResponse.navigation.currentChapter;
    const nextChapter = currentChapter + 1;
    document.getElementById("chapter-content").innerHTML = "<p>loading...</p>";

    // load next chapter
    const response = await loadNextChapter(currentChapter, true);
    if (!response.success) {
      return;
    }
    document.getElementById("chapter-content").innerHTML = response.chapterData; // Update the chapter content
    scrollTo({ behavior: "smooth", top: 0 });

    await Promise.all([
      // load 2 chapter after
      loadNextChapter(nextChapter, false),
    ]);
  }

  async function showSpecificChapter(chapterNumberInputID) {
    const chapterNumberToLoad = parseInt(
      document.getElementById(chapterNumberInputID).value,
    );

    document.getElementById("chapter-content").innerHTML = "<p>loading...</p>";
    const response = await loadCurrentChapter(chapterNumberToLoad, true);
    if (!response.success) {
      return;
    }
    document.getElementById("chapter-content").innerHTML = response.chapterData; // Update the chapter content
    scrollTo({ behavior: "smooth", top: 0 });

    await Promise.all([
      // load next chapter first because more likely it's going to be visited instead of the previous one
      loadNextChapter(chapterNumberToLoad, false),

      // load previous chapter
      loadPreviousChapter(chapterNumberToLoad, false),
    ]);
  }

  function syncNavigation(chapterViewResponseUpdated) {
    // eslint-disable-next-line no-global-assign
    chapterViewResponse = chapterViewResponseUpdated;
    if (
      chapterViewResponse &&
      chapterViewResponse.navigation &&
      chapterViewResponse.navigation.currentChapter
    ) {
      const navigationChapterNumberTop = document.getElementById(
        "selected-chapter-input-top",
      );
      const navigationChapterNumberBottom = document.getElementById(
        "selected-chapter-input-bottom",
      );
      const btnPreviousTop = document.getElementById("prev-chapter-top");
      const btnPreviousBottom = document.getElementById("prev-chapter-bottom");

      if (navigationChapterNumberTop) {
        navigationChapterNumberTop.value =
          chapterViewResponse.navigation.currentChapter;
      }

      if (navigationChapterNumberBottom) {
        navigationChapterNumberBottom.value =
          chapterViewResponse.navigation.currentChapter;
      }

      if (chapterViewResponse.navigation.isNotFirstChapter) {
        showElement(btnPreviousTop);
        showElement(btnPreviousBottom);
      } else {
        hideElement(btnPreviousTop);
        hideElement(btnPreviousBottom);
      }
    }
  }

  function onMounted() {
    const btn = document.getElementById("backToTop");

    if (btn) {
      // Show button when scrolling down
      window.onscroll = function () {
        btn.style.display =
          document.body.scrollTop > 100 ||
          document.documentElement.scrollTop > 100
            ? "flex"
            : "none";
      };

      // Scroll smoothly to top when clicked
      btn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }

  onMounted();

  window.toggleElementVisibility = toggleElementVisibility;
  window.loadChapter = loadChapter;
  window.loadPreviousChapter = loadPreviousChapter;
  window.loadCurrentChapter = loadCurrentChapter;
  window.loadNextChapter = loadNextChapter;
  window.showCurrentChapter = showCurrentChapter;
  window.showPreviousChapter = showPreviousChapter;
  window.showNextChapter = showNextChapter;
  window.showSpecificChapter = showSpecificChapter;
});
