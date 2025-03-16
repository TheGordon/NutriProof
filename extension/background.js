// Listen for keyboard shortcut (can be customized)
chrome.commands.onCommand.addListener((command) => {
    if (command === "run-fact-check") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "runFactCheck" });
      });
    }
  });
  
  // Optional: Add context menu for right-click fact checking
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "fact-check-selection",
      title: "Fact Check This",
      contexts: ["selection"]
    });
  });
  
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "fact-check-selection") {
      chrome.tabs.sendMessage(tab.id, { action: "runFactCheck" });
    }
  });