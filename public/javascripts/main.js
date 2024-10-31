import {
  fetchCachedChapter,
  addChapterToCache,
  checkInitStore,
  saveStoreToLocalStorage,
  setReaderConfig,
  fetchCachedReaderConfig,
  setChapterNumber,
} from "./cache.js";
document.addEventListener("DOMContentLoaded", () => {
  function toggleElementVisibility(id) {
    const element = document.getElementById(id);

    if (element && !element.classList.contains("visible")) {
      element.classList.add("visible");
      element.classList.remove("hidden");
    } else if (element) {
      element.classList.add("hidden");
      element.classList.remove("visible");
    }
  }

  async function loadChapter(chapterNumber, allowBiggerLimit = false) {
    try {
      let destinationToSend = destination;
      if (
        chapterNumber !==
        destination.params.find((el) => el.code === "CHAPTER_NUMBER")?.value
      ) {
        destinationToSend = JSON.parse(JSON.stringify(destination));
        destinationToSend.params.find(
          (el) => el.code === "CHAPTER_NUMBER"
        ).value = chapterNumber;
      }
      const destinationToSendChapterNumber = destinationToSend.params.find(
        (el) => el.code === "CHAPTER_NUMBER"
      ).value;

      // destination is set in index.hbs using data from the back
      const chapterStore = fetchCachedChapter(destinationToSend);

      // chapter in the store, no need to call the api again
      if (chapterStore) {
        console.log(
          "chapter " + destinationToSendChapterNumber + " is in the store",
          chapterStore
        );
        // we show the navbar under the chapter
        toggleElementVisibility("navigation-under-chapter");
        return chapterStore.data;
      }

      console.log(
        "fetching the chapter " + destinationToSendChapterNumber + " by API"
      );

      const key = document.getElementById("temp-key-input").value;
      let body = { destination: destinationToSend, key };
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
        // destination is about the current chapter, so we update the number is this shallow copy without affecting the original object
        addChapterToCache(destinationToSend, chapterHtml);
      }

      // we show the navbar under the chapter
      toggleElementVisibility("navigation-under-chapter");

      return chapterHtml;
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
      throw new Error("Error happened");
    }
  }
  async function loadPreviousChapter(currentChapterNumber) {
    try {
      if (!currentChapterNumber || currentChapterNumber <= 1) {
        return { success: false };
      }
      const chapterData = await loadChapter(currentChapterNumber - 1);
      return { success: true, chapterData };
    } catch (e) {
      return { success: false };
    }
  }
  async function loadCurrentChapter(
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
  }
  async function loadNextChapter(currentChapterNumber) {
    try {
      const chapterData = await loadChapter(currentChapterNumber + 1);
      return { success: true, chapterData };
    } catch (e) {
      return { success: false };
    }
  }

  async function updateDestinationBack(newConfigDestination) {
    try {
      const key = document.getElementById("temp-key-input").value;
      const response = await fetch("/destination", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newConfigDestination,
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
  }

  async function showCurrentChapter(allowBiggerLimit = false) {
    const { chapterNumber } = fetchCachedReaderConfig();
    document.getElementById("chapter-content").innerHTML = "<p>loading...</p>";
    const response = await loadCurrentChapter(chapterNumber, allowBiggerLimit);
    if (!response.success) {
      return;
    }
    document.getElementById("chapter-content").innerHTML = response.chapterData; // Update the chapter content
    scrollTo({ behavior: "smooth", top: 0 });

    if (!allowBiggerLimit) {
      await Promise.all([
        // load next chapter first because more likely it's going to be visited instead of the previous one
        loadNextChapter(chapterNumber),

        // load previous chapter
        loadPreviousChapter(chapterNumber),
      ]);
    }

    // we save the store into localStorage
    saveStoreToLocalStorage();
  }

  async function showPreviousChapter() {
    const { chapterNumber } = fetchCachedReaderConfig();
    const lastChapter = chapterNumber - 1;
    document.getElementById("chapter-content").innerHTML = "<p>loading...</p>";

    // load previous chapter
    const response = await loadPreviousChapter(chapterNumber);
    if (!response.success) {
      return;
    }
    document.getElementById("chapter-content").innerHTML = response.chapterData; // Update the chapter content
    scrollTo({ behavior: "smooth", top: 0 });

    // we update the current chapterNumber
    setChapterNumber(lastChapter);

    await Promise.all([
      // we tell the backend that we changed chapter (necessary because of the cached chapter)
      await updateDestinationBack(destination),

      // load 2 chapter before ( because we just updated the chapter number)
      loadPreviousChapter(lastChapter),
    ]);

    // we save the store into localStorage
    saveStoreToLocalStorage();
  }

  async function showNextChapter() {
    const { chapterNumber } = fetchCachedReaderConfig();
    const nextChapter = chapterNumber + 1;
    document.getElementById("chapter-content").innerHTML = "<p>loading...</p>";

    // load next chapter
    const response = await loadNextChapter(chapterNumber);
    if (!response.success) {
      return;
    }
    document.getElementById("chapter-content").innerHTML = response.chapterData; // Update the chapter content
    scrollTo({ behavior: "smooth", top: 0 });

    // we update the current chapterNumber
    setChapterNumber(nextChapter);

    await Promise.all([
      // we tell the backend that we changed chapter (necessary because of the cached chapter)
      updateDestinationBack(destination),

      // load 2 chapter after ( because we just updated the chapter number)
      loadNextChapter(nextChapter),
    ]);

    // we save the store into localStorage
    saveStoreToLocalStorage();
  }

  async function showSpecificChapter() {
    const chapterNumberToLoad = parseInt(
      document.getElementById("selected-chapter-input").value
    );

    // we update the duplicated fields
    document.getElementById("config-chapter-number-input").value =
      chapterNumberToLoad;

    document.getElementById("chapter-content").innerHTML = "<p>loading...</p>";
    const response = await loadCurrentChapter(chapterNumberToLoad);
    if (!response.success) {
      return;
    }
    document.getElementById("chapter-content").innerHTML = response.chapterData; // Update the chapter content
    scrollTo({ behavior: "smooth", top: 0 });

    // we update the current chapterNumber
    setChapterNumber(chapterNumberToLoad);

    await Promise.all([
      // we tell the backend that we changed chapter (necessary because of the cached chapter)
      updateDestinationBack(destination),

      // load next chapter first because more likely it's going to be visited instead of the previous one
      loadNextChapter(chapterNumberToLoad),

      // load previous chapter
      loadPreviousChapter(chapterNumberToLoad),
    ]);

    // we save the store into localStorage
    saveStoreToLocalStorage();
  }

  async function saveConfigAndIdentity() {
    // TODO on se crée une identité coté back ?
    const securityKey = document.getElementById("temp-key-input").value;
    const sourceSiteCode = document.getElementById("site-source-select").value;
    const pathTemplate = document.getElementById("path-template-input").value;
    const serieFragment = document.getElementById("serie-input").value;
    const chapterNumberToLoad = parseInt(
      document.getElementById("config-chapter-number-input").value
    );
    // we update the duplicated fields
    document.getElementById("selected-chapter-input").value =
      chapterNumberToLoad;

    // we update the destination with the input values
    const destinationCreated = {
      sourceSiteCode,
      userId: "default",
      urlParam: pathTemplate,
      params: [
        {
          code: "SERIE_FRAGMENT",
          value: serieFragment,
        },
        {
          code: "CHAPTER_NUMBER",
          value: chapterNumberToLoad,
        },
      ],
    };
    setReaderConfig(
      securityKey,
      sourceSiteCode,
      pathTemplate,
      serieFragment,
      chapterNumberToLoad
    );

    // we udpate the destination
    destination = destinationCreated;
    updateDestinationBack(destination);

    // we save the store into localStorage
    saveStoreToLocalStorage();

    toggleElementVisibility("config-container");

    // show the chapter
    showCurrentChapter();
  }

  function onMounted() {
    // we restore the store from localStorage if it exist on first page load
    checkInitStore();

    // we restore the inputs fields from the store values
    const configReader = fetchCachedReaderConfig();

    if (configReader.securityKey) {
      document.getElementById("temp-key-input").value =
        configReader.securityKey;
    }
    if (configReader.sourceSiteCode) {
      document.getElementById("site-source-select").value =
        configReader.sourceSiteCode;
    }
    if (configReader.serieFragment) {
      document.getElementById("serie-input").value = configReader.serieFragment;
    }
    if (configReader.chapterNumber) {
      document.getElementById("config-chapter-number-input").value =
        configReader.chapterNumber;

      // we update the duplicated fields
      document.getElementById("selected-chapter-input").value =
        configReader.chapterNumber;
    }
    if (configReader.pathTemplate) {
      document.getElementById("path-template-input").value =
        configReader.pathTemplate;
    }
  }

  onMounted();

  window.toggleElementVisibility = toggleElementVisibility;
  window.loadChapter = loadChapter;
  window.loadPreviousChapter = loadPreviousChapter;
  window.loadCurrentChapter = loadCurrentChapter;
  window.loadNextChapter = loadNextChapter;
  window.updateDestinationBack = updateDestinationBack;
  window.showCurrentChapter = showCurrentChapter;
  window.showPreviousChapter = showPreviousChapter;
  window.showNextChapter = showNextChapter;
  window.showSpecificChapter = showSpecificChapter;
  window.saveConfigAndIdentity = saveConfigAndIdentity;
});
