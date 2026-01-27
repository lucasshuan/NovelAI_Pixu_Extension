console.log("NAI Wisp service worker alive");

chrome.runtime.onInstalled.addListener(() => {
  console.log("NAI Wisp installed");
});
