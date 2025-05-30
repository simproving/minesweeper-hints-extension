// Expose UI handler functions for extension popup
window.apply = typeof apply !== 'undefined' ? apply : undefined;
window.propertiesOpen = typeof propertiesOpen !== 'undefined' ? propertiesOpen : undefined;
window.setAnalysis = typeof setAnalysis !== 'undefined' ? setAnalysis : undefined;
window.doToggleFlag = typeof doToggleFlag !== 'undefined' ? doToggleFlag : undefined;
window.doToggleScreen = typeof doToggleScreen !== 'undefined' ? doToggleScreen : undefined;
window.noGuessCancel = typeof noGuessCancel !== 'undefined' ? noGuessCancel : undefined;
window.propertiesClose = typeof propertiesClose !== 'undefined' ? propertiesClose : undefined;
window.deleteLocalStorage = typeof deleteLocalStorage !== 'undefined' ? deleteLocalStorage : undefined;
window.saveLocalStorage = typeof saveLocalStorage !== 'undefined' ? saveLocalStorage : undefined;
window.loadLocalStorage = typeof loadLocalStorage !== 'undefined' ? loadLocalStorage : undefined;
window.closeLocalStorage = typeof closeLocalStorage !== 'undefined' ? closeLocalStorage : undefined;
window.load_images = typeof load_images !== 'undefined' ? load_images : undefined;
window.browserResized = typeof browserResized !== 'undefined' ? browserResized : undefined;
