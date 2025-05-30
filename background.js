// Open a persistent, resizable popup window when the extension icon is clicked
chrome.action.onClicked.addListener(() => {
  chrome.windows.create({
    url: chrome.runtime.getURL('popup.html'),
    type: 'popup',
    width: 900,
    height: 700
  });
});

// Relay messages between popup (extension window) and content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.to === 'content-script') {
    // Relay message to the first minesweeper.online tab
    chrome.tabs.query({url: '*://minesweeper.online/*'}, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, message, sendResponse);
      } else {
        sendResponse && sendResponse({error: 'No minesweeper.online tab found'});
      }
    });
    return true; // async response
  }
  if (message.to === 'popup' || message.type === 'CURSOR_POSITION') {
    // Relay message to all extension windows (including the sender)
    chrome.runtime.sendMessage(message);
  }
});
