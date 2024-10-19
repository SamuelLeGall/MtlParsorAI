let store = {
  config: {
    init: true,
  },
  data: [
    {
      codeSource: "WTR_LAB",
      chaptersList: [],
    },
  ],
};

function saveStoreToLocalStorage() {
  // it is recommanded not to store a string bigger than 5MB in the localStorage. That around 2.5M characters.
  // So around 225 chapter of 11.000 characters. We currenlty limit it at 125 chapters max because no need for more seriously
  const chaptersInStore = countChaptersInStore();
  if (chaptersInStore > 100) {
    const result = cleanStoreChapters(
      store,
      75,
      configUrlSourceWebsite.sourceSiteCode,
      configUrlSourceWebsite.serieCode
    );
    console.log(
      `store cleaned because too many chapters where in cache. ${result?.cleaned} chapters deleted, still ${result?.remaining} chapter in cache`
    );
  }

  // now we know the store is small enough so we save it
  localStorage.setItem("storeMtlParsorAI", JSON.stringify(store));
}

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
  for (let i = 0; i < chaptersToRemove && nonCurrentChapters.length > 0; i++) {
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

function restoreLocalStorageStore() {
  const savedStore = localStorage.getItem("storeMtlParsorAI");
  if (savedStore) {
    console.log("Chapters were found in localStorage and were restored");
    store = JSON.parse(savedStore);
  }
}

function checkInitStore() {
  // check if the store was just initialized and if it was check if a store is in localstorage and restore it. In all case it change the flag afterwards
  if (store.config.init) {
    restoreLocalStorageStore();
  }
  store.config.init = false;
}

function countChaptersInStore() {
  let totalChapters = 0;

  store.data.forEach((source) => {
    if (Array.isArray(source.chaptersList)) {
      totalChapters += source.chaptersList.length; // enough because no duplicate
    }
  });

  return totalChapters;
}

function fetchCachedChapter(sourceSiteCode, serieCode, chapterNumber) {
  const sourceSiteCache = store.data.find(
    (el) => el.codeSource === sourceSiteCode
  );

  if (!sourceSiteCache) {
    return null;
  }

  console.log("checking store for chapter number", chapterNumber);
  const chapterData = sourceSiteCache.chaptersList.find(
    (el) =>
      el.urlData.serieCode === serieCode &&
      el.urlData.chapterNumber === chapterNumber
  );
  if (!chapterData) {
    return null;
  }

  return chapterData;
}

function addChapterToCache(sourceSiteCode, urlData, chapterData) {
  let storeForSourceSite = store.data.find(
    (el) => el.codeSource === sourceSiteCode
  );
  const chapter = {
    urlData,
    data: chapterData,
    created: new Date(),
  };

  // no cache for this source website
  if (!storeForSourceSite) {
    console.log(
      "adding sourceSite " +
        sourceSiteCode +
        " in store with chapter " +
        chapter.urlData.chapterNumber +
        " in it",
      chapter.urlData
    );
    store.data.push({ codeSource: sourceSiteCode, chaptersList: [chapter] });
    return;
  }

  const chapterFromStore = storeForSourceSite.chaptersList.find(
    (el) =>
      el.urlData.serieCode === urlData.serieCode &&
      el.urlData.chapterNumber === urlData.chapterNumber
  );

  // the current chapter is already cached. nothing to do
  if (chapterFromStore) {
    chapterFromStore.urlData.created = new Date();
    console.log(
      "chapter " +
        chapter.urlData.chapterNumber +
        " is already In store - dateCreated updated",
      chapter.urlData
    );
    return;
  }

  // there is cached chapter for this serie but not the current one
  console.log(
    "adding chapter " + chapter.urlData.chapterNumber + " In store",
    chapter.urlData
  );
  storeForSourceSite.chaptersList.push(chapter);
  return;
}

export {
  fetchCachedChapter,
  addChapterToCache,
  saveStoreToLocalStorage,
  checkInitStore,
};
