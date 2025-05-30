function tryLoadBoardString() {
  console.log('tryLoadBoardString called');
  if (typeof newBoardFromString !== 'function') {
    console.warn('newBoardFromString is not defined or not a function');
    return false;
  }
  if (!window._pendingBoardString) {
    console.warn('No pending board string to load');
    return false;
  }
  console.log('Loading board string:', window._pendingBoardString);
  newBoardFromString(window._pendingBoardString, false, true)
    .then(() => {
      console.log('newBoardFromString finished. Board should now be loaded.');
      // Re-enable the Analyse button in the control nav
      const analysisBtn = document.getElementById('AnalysisButton');
      if (analysisBtn) analysisBtn.disabled = false;
      doAnalysis()
    })
    .catch(e => console.error('newBoardFromString error:', e));
  window._pendingBoardString = null;
  return true;
}


if (!tryLoadBoardString()) {
  document.addEventListener('DOMContentLoaded', tryLoadBoardString);
  window.addEventListener('load', tryLoadBoardString);
  setTimeout(tryLoadBoardString, 500); // fallback in case scripts are slow
}

async function requestBoardStateFromPage() {
  // reset message
  const messageLine = document.getElementById('showMessage');
  if (messageLine) {
    messageLine.textContent = '';
  }

  chrome.runtime.sendMessage({
    to: 'content-script',
    type: 'REQUEST_BOARD_STATE'
  }, async function(response) {
    console.log('[Popup] Board state received from page:', response);
    if (!response || !response.board) {
      console.warn('[Popup] No board received from page.');
      return;
    }
    // Convert board object to string format: "widthxheightxmines\n..."
    let maxX = 0, maxY = 0, flagsPlaced = 0;
    for (const key in response.board) {
      const cell = response.board[key];
      maxX = Math.max(maxX, cell.x);
      maxY = Math.max(maxY, cell.y);
      if (cell.state === 'flag') flagsPlaced++;
    }
    const minesRemaining = typeof response.minesRemaining === 'number' ? response.minesRemaining : 0;
    const totalMines = flagsPlaced + minesRemaining;
    const width = maxX + 1;
    const height = maxY + 1;

    let boardString = `${width}x${height}x${totalMines}\n`;
    for (let y = 0; y < height; y++) {
      let row = '';
      for (let x = 0; x < width; x++) {
        const cell = response.board[`${x},${y}`];
        if (!cell) {
          row += 'H';
        } else if (cell.state === 'flag') {
          row += 'H';
        } else if (cell.state === 'closed') {
          row += 'H';
        } else if (typeof cell.state === 'number') {
          row += cell.state;
        } else {
          row += 'H';
        }
      }
      boardString += row + '\n';
    }
    console.log('[Popup] Converted board string (raw):', boardString);
    window._pendingBoardString = boardString;
    newBoardFromString(boardString, false, true)
      .then(() => {
        console.log('[Popup] newBoardFromString finished. Board should now be loaded.');
        // Re-enable the Analyse button in the control nav
        const analysisBtn = document.getElementById('AnalysisButton');
        if (analysisBtn) analysisBtn.disabled = false;
        // Do analysis after board is loaded
        if (typeof doAnalysis === 'function') doAnalysis();
      })
      .catch(e => console.error('[Popup] newBoardFromString error:', e));
  });
}

// Listener for BOARD_UPDATED messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'BOARD_UPDATED') {
      // Request the latest board state from the content script
      requestBoardStateFromPage();
  }
});

// Handle cursor position updates from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CURSOR_POSITION') {
        const cursor = document.getElementById('mirror-cursor');
        if (!cursor) return;

        // Get the board element and its position
        const boardEl = document.querySelector('#board');
        if (!boardEl) return;

        const rect = boardEl.getBoundingClientRect();
        const tileSize = parseInt(document.getElementById('tilesize').value);

        // Calculate cursor position based on tile coordinates
        // Subtract half the cursor size to center it on the tile
        const x = rect.left + (message.position.x * tileSize) + (tileSize / 2) - 6; // 6 = (cursor width + border) / 2
        const y = rect.top + (message.position.y * tileSize) + (tileSize / 2) - 6;

        // Update cursor position
        cursor.style.left = x + 'px';
        cursor.style.top = y + 'px';
        cursor.style.display = 'block';

        // Hide cursor when mouse leaves the board
        if (message.position.x < 0 || message.position.y < 0) {
            cursor.style.display = 'none';
        }
    }
});

document.addEventListener('DOMContentLoaded', function() {
  // Load board when user clicks the Load Board button
  const loadBtn = document.getElementById('loadBoardButton');
  if (loadBtn) {
    loadBtn.addEventListener('click', requestBoardStateFromPage);
  }

  if (typeof switchToAnalysis === 'function') switchToAnalysis(true);

  // Load board automatically when extension starts
  requestBoardStateFromPage();

  // Prevent right-click context menu on canvases
  var myCanvas = document.getElementById('myCanvas');
  if (myCanvas) myCanvas.addEventListener('contextmenu', function(e) { e.preventDefault(); });
  var myHints = document.getElementById('myHints');
  if (myHints) myHints.addEventListener('contextmenu', function(e) { e.preventDefault(); });
  var myMinesLeft = document.getElementById('myMinesLeft');
  if (myMinesLeft) myMinesLeft.addEventListener('contextmenu', function(e) { e.preventDefault(); });
 
  // Attach event listeners for Minesweeper controls
  var bombImg = document.getElementById('bombImg');
  if (bombImg) bombImg.addEventListener('click', function() { if (typeof propertiesOpen === 'function') propertiesOpen(); });

  // switchButton is now hidden and disabled above to prevent leaving analysis mode.

  var leftClickFlag = document.getElementById('leftClickFlag');
  if (leftClickFlag) leftClickFlag.addEventListener('click', function() { if (typeof doToggleFlag === 'function') doToggleFlag(); });

  var newGameSmiley = document.getElementById('newGameSmiley');
  if (newGameSmiley) newGameSmiley.addEventListener('click', function() { if (typeof apply === 'function') apply(); });

  var toggleScreen = document.getElementById('toggleScreen');
  if (toggleScreen) toggleScreen.addEventListener('click', function() { if (typeof doToggleScreen === 'function') doToggleScreen(); });

  var ngBuilderClose = document.getElementById('ngBuilderClose');
  if (ngBuilderClose) ngBuilderClose.addEventListener('click', function() { if (typeof noGuessCancel === 'function') noGuessCancel(); });

  var propertiesClose = document.getElementById('propertiesClose');
  if (propertiesClose) propertiesClose.addEventListener('click', function() { if (typeof propertiesClose === 'function') propertiesClose(); });

  var localStorageDelete = document.getElementById('localStorageDelete');
  if (localStorageDelete) localStorageDelete.addEventListener('click', function() { if (typeof deleteLocalStorage === 'function') deleteLocalStorage(); });

  var localStorageSave = document.getElementById('localStorageSave');
  if (localStorageSave) localStorageSave.addEventListener('click', function() { if (typeof saveLocalStorage === 'function') saveLocalStorage(); });

  var localStorageLoad = document.getElementById('localStorageLoad');
  if (localStorageLoad) localStorageLoad.addEventListener('click', function() { if (typeof loadLocalStorage === 'function') loadLocalStorage(); });

  var localStorageCancel = document.getElementById('localStorageCancel');
  if (localStorageCancel) localStorageCancel.addEventListener('click', function() { if (typeof closeLocalStorage === 'function') closeLocalStorage(); });

  if (typeof load_images === 'function') load_images();

  // Attach event to Load Board button under the board
  var loadBoardBtn = document.getElementById('loadBoardButton');
  if (loadBoardBtn) {
    loadBoardBtn.addEventListener('click', function(e) {
      e.preventDefault();
    });
    // Show/hide the button based on analysis mode
    function updateLoadBoardButtonVisibility() {
      if (typeof analysisMode !== 'undefined' && analysisMode) {
        loadBoardBtn.style.display = '';
      } else {
        loadBoardBtn.style.display = 'none';
      }
    }
    // Try to update on DOMContentLoaded
    updateLoadBoardButtonVisibility();
    // Patch switchToAnalysis to always update the button
    if (typeof switchToAnalysis === 'function' && !switchToAnalysis._patchedForLoadBoard) {
      const origSwitchToAnalysis = switchToAnalysis;
      window.switchToAnalysis = async function(doAnalysis) {
        const result = await origSwitchToAnalysis.apply(this, arguments);
        updateLoadBoardButtonVisibility();
        return result;
      };
      window.switchToAnalysis._patchedForLoadBoard = true;
    }
  }

  setTimeout(function() {
    if (typeof browserResized === 'function') browserResized();
    if (typeof doAnalysis === 'function') doAnalysis();
  }, 0);

  // Always ensure Analyse button works in popup context
  function attachAnalysisButtonHandler() {
    const analysisBtn = document.getElementById('AnalysisButton');
    if (analysisBtn && !analysisBtn._popupHandlerAttached) {
      analysisBtn.addEventListener('click', function() {
        console.log('Analyse button clicked');
        if (typeof doAnalysis === 'function') doAnalysis();
      });
      analysisBtn._popupHandlerAttached = true;
    }
  }
  attachAnalysisButtonHandler();
  // Also reattach handler when switching modes
  if (typeof switchToAnalysis === 'function' && !switchToAnalysis._patchedForAnalysisButton) {
    const origSwitchToAnalysis = switchToAnalysis;
    window.switchToAnalysis = async function(doAnalysis) {
      const result = await origSwitchToAnalysis.apply(this, arguments);
      attachAnalysisButtonHandler();
      return result;
    };
    window.switchToAnalysis._patchedForAnalysisButton = true;
  }
});

window.addEventListener('resize', function() {
  if (typeof browserResized === 'function') browserResized();
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SHOW_MESSAGE') {
    const messageLine = document.getElementById('showMessage');
    if (messageLine) messageLine.textContent = message.message;
  }
});

document.addEventListener('DOMContentLoaded', function () {
  const toggleBtn = document.getElementById('toggleBtn');
  const collapsibleDiv = document.getElementById('collapsibleDiv');

  toggleBtn.addEventListener('click', function () {
    if (collapsibleDiv.style.display === 'block') {
      collapsibleDiv.style.display = 'none';
    } else {
      collapsibleDiv.style.display = 'block';
    }
  });
});
