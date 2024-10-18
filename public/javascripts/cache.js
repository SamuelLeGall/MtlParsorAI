const store = {
  WTR_LAB: [],
}; // Cache object to store chapters by URL

function fetchCachedChapter(sourceSiteCode, serieCode, chapterNumber) {
  const sourceSiteCache = store[sourceSiteCode];

  if (!sourceSiteCache) {
    return null;
  }

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
    urlData,
    data: chapterData,
  };

  // no cache for this source website
  if (!storeForSourceSite) {
    store[sourceSiteCode] = [chapter];
    return;
  }

  const chapterFromStore = storeForSourceSite.find(
    (el) => el.serieCode === serieCode && el.chapterNumber === chapterNumber
  );

  // the current chapter is already cached. nothing to do
  if (chapterFromStore) {
    return;
  }

  // there is cached chapter for this serie but not the current one
  storeForSourceSite.push(chapter);
  return;
}

export { fetchCachedChapter, addChapterToCache };
