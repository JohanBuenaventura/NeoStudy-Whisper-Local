let capturing = false;

async function ensureOffscreen() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [chrome.runtime.getURL("offscreen.html")]
  });
  if (!contexts.length) {
    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: ["USER_MEDIA"],
      justification: "Capture the active NeoStudy tab audio for local speech transcription."
    });
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  try {
    if (capturing) {
      await chrome.runtime.sendMessage({target: "offscreen", type: "STOP_CAPTURE"});
      capturing = false;
      await chrome.action.setBadgeText({text: ""});
      await chrome.tabs.sendMessage(tab.id, {type: "CAPTURE_STATE", active: false}).catch(()=>{});
      return;
    }
    const streamId = await chrome.tabCapture.getMediaStreamId({targetTabId: tab.id});
    await ensureOffscreen();
    await chrome.runtime.sendMessage({
      target: "offscreen",
      type: "START_CAPTURE",
      streamId
    });
    capturing = true;
    await chrome.action.setBadgeText({text: "REC"});
    await chrome.action.setBadgeBackgroundColor({color: "#c62828"});
    await chrome.tabs.sendMessage(tab.id, {type: "CAPTURE_STATE", active: true}).catch(()=>{});
  } catch (e) {
    console.error("NeoStudy capture error:", e);
    await chrome.action.setBadgeText({text: "ERR"});
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "CAPTURE_STOPPED") {
    capturing = false;
    chrome.action.setBadgeText({text: ""});
  }
});