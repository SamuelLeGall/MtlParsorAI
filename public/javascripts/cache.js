const store = {
  WTR_LAB: [],
}; // Cache object to store chapters by URL

function fetchCachedChapter(sourceSiteCode, serieCode, chapterNumber) {
  const sourceSiteCache = store[sourceSiteCode];

  if (!sourceSiteCache) {
    return null;
  }

  console.log("checking store for chapter number", chapterNumber);
  const chapterData = sourceSiteCache.find(
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
  let storeForSourceSite = store[sourceSiteCode];
  const chapter = {
    urlData: { ...urlData },
    data: chapterData,
  };

  // no cache for this source website
  if (!storeForSourceSite) {
    store[sourceSiteCode] = [chapter];
    return;
  }

  const chapterFromStore = storeForSourceSite.find(
    (el) =>
      el.urlData.serieCode === urlData.serieCode &&
      el.urlData.chapterNumber === urlData.chapterNumber
  );

  // the current chapter is already cached. nothing to do
  if (chapterFromStore) {
    return;
  }

  // there is cached chapter for this serie but not the current one
  console.log(
    "adding chapter " + chapter.urlData.chapterNumber + " In store",
    chapter.urlData
  );
  storeForSourceSite.push(chapter);
  return;
}

export { fetchCachedChapter, addChapterToCache };
