// Content script injected into minesweeper.online
(function() {
    function hasClassContaining(element, pattern) {
        return Array.from(element.classList).some(className => className.includes(pattern));
    }

    //console.log('[Content Script] Loaded');
    // Only run if the URL contains 'minesweeper.online'
    if (!window.location.href.includes('minesweeper.online')) return;

    // Observe cell openings and send board state to the extension
    const observer = new MutationObserver((mutations) => {
        let boardChanged = false;
        for (const mutation of mutations) {
            if (mutation.type === 'attributes' && mutation.target.classList.contains('cell') && mutation.attributeName === 'class') {
                if (hasClassContaining(mutation.target, "_opened")) {
                    boardChanged = true;
                    break;
                }
            }
        }
        if (boardChanged) {
            //console.log('[Content Script] Sending BOARD_UPDATED message');
            chrome.runtime.sendMessage({ type: 'BOARD_UPDATED' });
        }
    });

    // Start observing the board for cell openings
    // wait for the board to load
    const waitForBoard = () => {
        const boardEl = document.querySelector('#AreaBlock');
        if (boardEl) {
            //console.log('[Content Script] Starting to observe board');
            observer.observe(boardEl, {subtree: true, attributes: true, attributeFilter: ['class']});
        } else {
            setTimeout(waitForBoard, 100);
        }
    };
    waitForBoard();

    // Track cursor position and send to extension
    let lastCursorPos = null;
    document.addEventListener('mousemove', (e) => {
        const boardEl = document.querySelector('#AreaBlock');
        if (!boardEl) return;

        const rect = boardEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Only send if cursor is over the board
        if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
            const cell = document.elementFromPoint(e.clientX, e.clientY);
            if (cell && cell.classList.contains('cell')) {
                const cellX = parseInt(cell.getAttribute('data-x'));
                const cellY = parseInt(cell.getAttribute('data-y'));
                if (lastCursorPos?.x !== cellX || lastCursorPos?.y !== cellY) {
                    lastCursorPos = {x: cellX, y: cellY};
                    chrome.runtime.sendMessage({
                        type: 'CURSOR_POSITION',
                        position: lastCursorPos
                    });
                }
            }
        }
    });

    // Listen for direct messages from the extension window
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'REQUEST_BOARD_STATE') {
        // Scrape and send the board state as a response
        const cells = Array.from(document.querySelectorAll('.cell[data-x][data-y]'));
        if (cells.length === 0) return sendResponse({error: 'No board found'});
        const board = {};
        let maxX = 0, maxY = 0;
        cells.forEach(cell => {
            const x = parseInt(cell.getAttribute('data-x'));
            const y = parseInt(cell.getAttribute('data-y'));
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
            let state = 'unknown';
            if (hasClassContaining(cell, "_closed") && hasClassContaining(cell, "_flag")) {
                state = 'flag';
            } else if (hasClassContaining(cell, "_closed")) {
                state = 'closed';
            } else if (hasClassContaining(cell, "_opened")) {
                let foundType = false;
                for (let n = 0; n <= 8; n++) {
                    if (hasClassContaining(cell, "_rtype")) {
                        chrome.runtime.sendMessage({
                            type: 'SHOW_MESSAGE',
                            message: "Random colours and random letters not supported."
                        });
                    }
                    if (hasClassContaining(cell, "_type" + n)) {
                        state = n;
                        foundType = true;
                        break;
                    }
                }
                if (!foundType) state = 'open';
            }
            board[`${x},${y}`] = {x, y, state};
        });
        const minesRemaining = (function() {
          function getDigitFromClass(element) {
              if (!element) return 0;
              for (const cls of element.classList) {
                  const lastChar = cls.charAt(cls.length - 1)
                  if (!isNaN(lastChar) && lastChar !== ' ') {
                    return parseInt(lastChar)
                  }
              }
              return 0;
          }
          const hundreds = getDigitFromClass(document.getElementById('top_area_mines_100'));
          const tens     = getDigitFromClass(document.getElementById('top_area_mines_10'));
          const ones     = getDigitFromClass(document.getElementById('top_area_mines_1'));
          return hundreds * 100 + tens * 10 + ones;
        })();
        sendResponse({board, minesRemaining, maxX, maxY});
        return true;
      }
    });

})();
