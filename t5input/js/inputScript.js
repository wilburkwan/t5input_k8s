let ranking = {};
let currentCharacters = [];
let currentPage = 0;
let itemsPerPage = 10;
let phrases = {};
let currentPhrases = [];
let selectedChar = '';
let punctuation = [];
let punctuationPage = 0;
let phrasePage = 0;
let currentDisplayType = 'characters'; // track what is currently being displayed
let lastUploadedOutput = '';
let isChineseMode = true; // true 為中文輸入模式，false 為英文輸入模式
let isUIOModeActive = true; // true 為 UIOJKL 模式，false 為 JKLUIO 模式
let isNumericAscendingMode = false; // false 為 0-9 模式，true 為 1-0 模式

const selectionKeyMap = {
    '0': 1,
    '9': 2,
    '8': 3,
    '7': 4,
    '6': 5,
    '5': 6,
    '4': 7,
    '3': 8,
    '2': 9,
    '1': 10
};

function copyToClipboard() {
    var copyText = document.getElementById("Output");
    copyText.select();
    copyText.setSelectionRange(0, 99999); // For mobile devices
    navigator.clipboard.writeText(copyText.value).then(function () {
        //alert("文字已複製到剪貼板");
    }, function (err) {
        alert("無法複製文字: ", err);
    });
}

function findCharacters() {
    const input = document.getElementById('strokeInput').value.trim().toLowerCase();
    document.getElementById('strokeInput').value = input;
    displayStrokeCode(input);
    if (!input) {
        updateDisplay([]);
        return;
    }

    // 根據當前模式處理輸入映射
    let processedInput = isUIOModeActive ? input : mapJKLUIOtoUIOJKL(input);
    
    // 将 'l' 替换为 '.' 以兼容正则表达式
    let regexString = processedInput.replace(/l/g, '.');
    const regex = new RegExp('^' + regexString);  // 确保模式从字符串开始匹配

    let exactMatches = [];
    let partialMatches = [];

    for (const [strokes, chars] of Object.entries(window.strokeData)) {
        if (strokes === processedInput) {
            // 完全匹配的字符
            chars.forEach(char => {
                exactMatches.push({ strokes, char });
            });
        } else if (regex.test(strokes)) {
            // 部分匹配的字符
            chars.forEach(char => {
                partialMatches.push({ strokes, char });
            });
        }
    }

    if (exactMatches.length === 0 && partialMatches.length === 0) {
        console.log("未找到匹配項：", processedInput);
    }

    // 对部分匹配的字符先根据 ranking-traditional.txt 进行排序
    let rankedChars = [];
    let unrankedChars = [];

    partialMatches.forEach(item => {
        if (ranking[item.char] !== undefined) {
            rankedChars.push(item);
        } else {
            unrankedChars.push(item);
        }
    });

    // 按排名进行排序
    rankedChars.sort((a, b) => {
        return ranking[a.char] - ranking[b.char];
    });

    // 合并结果：完全匹配的字符 + 排序后的有排名字符 + 无排名字符
    let foundCharacters = exactMatches.concat(rankedChars, unrankedChars);

    currentCharacters = foundCharacters;
    currentPage = 0;
    currentDisplayType = 'characters';
    updateDisplay(currentCharacters);
}

// JKLUIO 模式轉換為 UIOJKL 模式的按鍵映射
function mapJKLUIOtoUIOJKL(input) {
    let result = '';
    for (let i = 0; i < input.length; i++) {
        switch (input[i]) {
            case 'j': result += 'u'; break;
            case 'k': result += 'i'; break;
            case 'l': result += 'o'; break;
            case 'u': result += 'j'; break;
            case 'i': result += 'k'; break;
            case 'o': result += 'l'; break;
            default: result += input[i];
        }
    }
    return result;
}

// 處理 control 按鍵事件
let isCtrlPressed = false;
function handleKeyDown(event) {
    // 檢查是否按下Ctrl鍵，並避免多次觸發
    if (event.key === 'Control' && !isCtrlPressed) {
        isCtrlPressed = true;
    }
}

function handleKeyUp(event) {
    // 確保鬆開的是純Ctrl鍵，且沒有與其他鍵組合
    if (event.key === 'Control' && isCtrlPressed && !event.shiftKey && !event.altKey && !event.metaKey) {
        isCtrlPressed = false;
        isChineseMode = !isChineseMode;
        // 保存模式設定到 localStorage
        localStorage.setItem('isChineseMode', isChineseMode);
        updateModeIndicator();

        const strokeInput = document.getElementById('strokeInput');
        if (strokeInput) {
            strokeInput.placeholder = isChineseMode ? '筆畫輸入模式' : '英文輸入模式';
        }
    } else {
        // 如果不是純Ctrl，重置狀態
        isCtrlPressed = false;
    }
}

function handleEscKey(event) {
    if (event.key === 'Escape') {
        event.preventDefault();
        isChineseMode = !isChineseMode;
        // 保存模式設定到 localStorage
        localStorage.setItem('isChineseMode', isChineseMode);
        updateModeIndicator();
        
        const strokeInput = document.getElementById('strokeInput');
        if (strokeInput) {
            strokeInput.placeholder = isChineseMode ? '筆畫輸入模式' : '英文輸入模式';
        }
    }
}

// 更新模式指示器顯示
function updateModeIndicator() {
    const indicator = document.getElementById('modeIndicator');
    if (indicator) {
        indicator.textContent = isChineseMode ? '中文' : 'EN';
        indicator.style.backgroundColor = isChineseMode ? '#4CAF50' : '#2196F3';
    }
}

// 保留原有的鍵盤事件處理函數
document.getElementById('Output').addEventListener('keydown', function(event) {
    if (!isChineseMode) {
        return;
    }
    
    const strokeInput = document.getElementById('strokeInput');
    let keyMap;
    
    if (isUIOModeActive) {
        keyMap = {
            'Numpad7': 'u',
            'Numpad8': 'i',
            'Numpad9': 'o',
            'Numpad4': 'j',
            'Numpad5': 'k',
            'Numpad6': 'l',
            'Numpad0': 'Backspace'
        };
    } else {
        keyMap = {
            'Numpad7': 'u',
            'Numpad8': 'i',
            'Numpad9': 'o',
            'Numpad4': 'j',
            'Numpad5': 'k',
            'Numpad6': 'l',
            'Numpad0': 'Backspace'
        };
    }
    
    const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    
    if (!arrowKeys.includes(event.key)) {
        if (['u', 'i', 'o', 'j', 'k', 'l', 'U', 'I', 'O', 'J', 'K', 'L'].includes(event.key)) {
            event.preventDefault();
            strokeInput.value += event.key.toLowerCase();
            findCharacters();
        } else if (event.key === 'Backspace' || event.code === 'Numpad0') {
            if (strokeInput.value) {
                event.preventDefault();
                strokeInput.value = strokeInput.value.slice(0, -1);
                findCharacters();
            }
        } else if (keyMap[event.code]) {
            event.preventDefault();
            strokeInput.value += keyMap[event.code];
            findCharacters();
        } else if (/[a-zA-Z]/.test(event.key) && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
        }
    }
});

document.addEventListener('DOMContentLoaded', function () {
    loadRanking();
    fetch('database.txt')
        .then(response => response.text())
        .then(data => {
            window.strokeData = parseData(data);
        })
        .catch(error => {
            console.error('Failed to fetch stroke data:', error);
        });

    loadPhrases();
    loadPunctuation();

    // 載入之前保存的輸入模式設定
    if (localStorage.getItem('isUIOModeActive') !== null) {
        isUIOModeActive = localStorage.getItem('isUIOModeActive') === 'true';
    }
    
    // 載入之前保存的中英文模式設定
    if (localStorage.getItem('isChineseMode') !== null) {
        isChineseMode = localStorage.getItem('isChineseMode') === 'true';
    }

    // 載入之前保存的數字鍵盤排序模式設定
    if (localStorage.getItem('isNumericAscendingMode') !== null) {
        isNumericAscendingMode = localStorage.getItem('isNumericAscendingMode') === 'true';
    }

    document.getElementById('strokeInput').addEventListener('input', function (event) {
        if (isUIOModeActive) {
            this.value = this.value.replace(/[^uijokl7894560]/gi, '');
            this.value = this.value.toLowerCase();
            this.value = this.value.replace(/7/g, 'u').replace(/8/g, 'i').replace(/9/g, 'o').replace(/4/g, 'j').replace(/5/g, 'k').replace(/6/g, 'l');
        } else {
            this.value = this.value.replace(/[^uijokl7894560]/gi, '');
            this.value = this.value.toLowerCase();
            this.value = this.value.replace(/7/g, 'j').replace(/8/g, 'k').replace(/9/g, 'l').replace(/4/g, 'u').replace(/5/g, 'i').replace(/6/g, 'o');
        }
        findCharacters();
    });

    document.addEventListener('keydown', function (event) {
        // Skip the handling if the event target is strokeInput
        if (document.activeElement === document.getElementById('strokeInput')) {
            return;
        }
    
        // Allow number keys in English mode
        if (!isChineseMode && event.code.startsWith('Digit')) {
            return; // Let the default behavior handle the number keys
        }
    
        // Allow spacebar in English mode
        if (!isChineseMode && event.key === ' ') {
            return; // Let the default behavior handle the spacebar
        }
    
        // Handle number keys in Chinese mode
        if (isChineseMode && event.code.startsWith('Digit')) { // Check if it's a digit key
            const pressedKey = event.key;
            let currentSelectionKeyMap = {};
            if (isNumericAscendingMode) {
                // 數字 1-0 模式
                currentSelectionKeyMap = {
                    '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
                    '6': 6, '7': 7, '8': 8, '9': 9, '0': 10
                };
            } else {
                // 數字 0-9 模式 (原有的)
                currentSelectionKeyMap = {
                    '0': 1, '9': 2, '8': 3, '7': 4, '6': 5,
                    '5': 6, '4': 7, '3': 8, '2': 9, '1': 10
                };
            }

            if (currentSelectionKeyMap[pressedKey] !== undefined) { // Check if the pressed key is in our map
                event.preventDefault();
                const keyIndex = currentSelectionKeyMap[pressedKey]; // Use our custom mapping
                const selectedCharCell = document.querySelector(`#char-${keyIndex}`);
                if (selectedCharCell) {
                    const character = selectedCharCell.querySelector('td:nth-child(2)').textContent.trim();
                    selectCharacter(character, keyIndex);
                } else {
                    const selectedPhraseCell = document.querySelector(`#phrase-${keyIndex}`);
                    if (selectedPhraseCell) {
                        const phrase = selectedPhraseCell.querySelector('td:nth-child(2)').textContent.trim();
                        selectPhrase(phrase);
                    } else {
                        const selectedPunctuationCell = document.querySelector(`#punctuation-${keyIndex}`);
                        if (selectedPunctuationCell) {
                            const symbol = selectedPunctuationCell.querySelector('td:nth-child(2)').textContent.trim();
                            selectPunctuation(symbol);
                        }
                    }
                }
            }
        } else if (isChineseMode && event.key === ' ') {
            event.preventDefault();
            if (currentDisplayType === 'characters') {
                nextPage();
            } else if (currentDisplayType === 'phrases') {
                nextPage();
            } else if (currentDisplayType === 'punctuation') {
                nextPage();
            }
        } else if (isChineseMode && event.key === '=') {
            event.preventDefault();
            if (currentDisplayType === 'characters') {
                nextPage();
            } else if (currentDisplayType === 'phrases') {
                nextPage();
            } else if (currentDisplayType === 'punctuation') {
                nextPage();
            }
        } else if (isChineseMode && event.key === '+') {
            event.preventDefault();
            if (currentDisplayType === 'characters') {
                nextPage();
            } else if (currentDisplayType === 'phrases') {
                nextPage();
            } else if (currentDisplayType === 'punctuation') {
                nextPage();
            }
        } else if (isChineseMode && event.key === '-') {
            event.preventDefault();
            if (currentDisplayType === 'characters') {
                previousPage();
            } else if (currentDisplayType === 'phrases') {
                previousPage();
            } else if (currentDisplayType === 'punctuation') {
                previousPage();
            }
        } else if (isChineseMode && event.key === '`') {
            event.preventDefault();
            punctuationPage = 0;
            currentDisplayType = 'punctuation';
            displayPunctuation();
        } else if (isChineseMode && event.key === ',') {
            event.preventDefault();
            insertAtCursor('，');
        } else if (isChineseMode && event.key === '.' && event.code !== 'NumpadDecimal') {
            event.preventDefault();
            insertAtCursor('。');
        } else if (isChineseMode && event.key === '<') {
            event.preventDefault();
            insertAtCursor('《');
        } else if (isChineseMode && event.key === '>') {
            event.preventDefault();
            insertAtCursor('》');
        } else if (isChineseMode && event.key === '/') {
            event.preventDefault();
            insertAtCursor('／');
        } else if (isChineseMode && event.key === '?') {
            event.preventDefault();
            insertAtCursor('？');
        } else if (isChineseMode && event.key === ';') {
            event.preventDefault();
            insertAtCursor('；');
        } else if (isChineseMode && event.key === ':') {
            event.preventDefault();
            insertAtCursor('：');
        } else if (isChineseMode && event.key === "'") {
            event.preventDefault();
            insertAtCursor('、');
        } else if (isChineseMode && event.key === '"') {
            event.preventDefault();
            insertAtCursor('＂');
        } else if (isChineseMode && event.key === '[') {
            event.preventDefault();
            insertAtCursor('「');
        } else if (isChineseMode && event.key === '{') {
            event.preventDefault();
            insertAtCursor('『');
        } else if (isChineseMode && event.key === ']') {
            event.preventDefault();
            insertAtCursor('」');
        } else if (isChineseMode && event.key === '}') {
            event.preventDefault();
            insertAtCursor('』');
        } else if (isChineseMode && event.key === "\\") {
            event.preventDefault();
            insertAtCursor('＼');
        } else if (isChineseMode && event.key === '|') {
            event.preventDefault();
            insertAtCursor('｜');
        } else if (isChineseMode && event.key === 'Enter') {
            event.preventDefault();
            insertAtCursor('\n');
        } else if (isChineseMode && event.code === 'Numpad0') {
            event.preventDefault();  // 只阻止默認行為，不執行任何操作
        }
        // Allow arrow keys for navigation
        else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            // Do nothing, allow default behavior
        }


    });

    // 創建模式切換按鈕
    const modeButton = document.createElement('button');
    modeButton.id = 'modeIndicator';
    
    // 設置按鈕樣式
    modeButton.style.position = 'fixed';
    modeButton.style.bottom = '70px';
    modeButton.style.right = '20px';
    modeButton.style.padding = '8px 15px';
    modeButton.style.backgroundColor = '#4CAF50';
    modeButton.style.color = 'white';
    modeButton.style.border = 'none';
    modeButton.style.borderRadius = '5px';
    modeButton.style.cursor = 'pointer';
    modeButton.style.zIndex = '1000';
    modeButton.style.fontSize = '16px';
    modeButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    modeButton.style.transition = 'all 0.3s ease';
    
    // 添加懸停效果
    modeButton.addEventListener('mouseover', function() {
        this.style.transform = 'scale(1.05)';
        this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    });
    
    modeButton.addEventListener('mouseout', function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    });
    
    // 添加點擊事件
    modeButton.addEventListener('click', function() {
        isChineseMode = !isChineseMode;
        // 保存模式設定到 localStorage
        localStorage.setItem('isChineseMode', isChineseMode);
        updateModeIndicator();
        
        // 更新輸入框狀態
        const strokeInput = document.getElementById('strokeInput');
        if (strokeInput) {
            strokeInput.placeholder = isChineseMode ? '筆畫輸入模式' : '英文輸入模式';
        }
    });
    
    document.body.appendChild(modeButton);
    
    // 獲取設定按鈕和彈出式視窗元素
    const settingsButton = document.getElementById('settingsButton');
    const settingsModal = document.getElementById('settingsModal');
    const closeModalBtn = settingsModal.querySelector('.close-modal-btn');
    
    // 獲取彈出式視窗內的模式切換按鈕
    const strokeModeButton = document.getElementById('strokeModeIndicator');
    const numericModeButton = document.getElementById('numericModeIndicator');

    // 顯示設定彈出式視窗
    settingsButton.addEventListener('click', function() {
        settingsModal.style.display = 'block';
    });

    // 隱藏設定彈出式視窗
    closeModalBtn.addEventListener('click', function() {
        settingsModal.style.display = 'none';
    });

    // 點擊彈出式視窗外部關閉視窗
    window.addEventListener('click', function(event) {
        if (event.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });

    // 添加點擊事件到彈出式視窗內的 UIOJKL/JKLUIO 模式切換按鈕
    strokeModeButton.addEventListener('click', function() {
        isUIOModeActive = !isUIOModeActive;
        localStorage.setItem('isUIOModeActive', isUIOModeActive);
        updateStrokeModeIndicator();
        const strokeInput = document.getElementById('strokeInput');
        if (strokeInput) {
            strokeInput.value = '';
            findCharacters();
        }
    });

    // 添加點擊事件到彈出式視窗內的數字鍵盤排序模式按鈕
    numericModeButton.addEventListener('click', function() {
        isNumericAscendingMode = !isNumericAscendingMode;
        localStorage.setItem('isNumericAscendingMode', isNumericAscendingMode);
        updateNumericModeIndicator();
        findCharacters(); // 更新顯示，以便立即反映數字鍵盤排序的變化
    });

    updateModeIndicator();
    updateStrokeModeIndicator();
    updateNumericModeIndicator(); // 初始化數字鍵盤排序指示器

    // 保留 ESC 鍵切換功能
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('keydown', handleEscKey);
    
    // 在頁面載入完成後更新鍵盤示意圖
    updateKeyboardImages();
});

// 更新筆畫模式指示器顯示
function updateStrokeModeIndicator() {
    const button = document.getElementById('strokeModeIndicator');
    if (button) {
        button.textContent = isUIOModeActive ? 'UIOJKL模式' : 'JKLUIO模式';
        button.style.backgroundColor = isUIOModeActive ? '#4CAF50' : '#9E9E9E';
    }
    
    // 更新鍵盤示意圖
    updateKeyboardImages();
}

// 更新數字鍵盤排序模式指示器顯示
function updateNumericModeIndicator() {
    const button = document.getElementById('numericModeIndicator');
    if (button) {
        button.textContent = isNumericAscendingMode ? '數字 1-0' : '數字 0-9';
        button.style.backgroundColor = isNumericAscendingMode ? '#4CAF50' : '#9E9E9E';
    }
}

// 更新鍵盤示意圖顯示
function updateKeyboardImages() {
    // 取得英文鍵盤和數字鍵盤圖片元素
    const engKeyboardImg = document.querySelector('img[alt*="輸入法英文鍵盤示意圖"]');
    const numKeyboardImg = document.querySelector('img[alt*="輸入法數字鍵盤示意圖"]');
    
    if (engKeyboardImg && numKeyboardImg) {
        if (isUIOModeActive) {
            // UIOJKL 模式
            engKeyboardImg.src = "image/uiojkl_eng.png";
            engKeyboardImg.alt = "UIOJKL輸入法英文鍵盤示意圖";
            numKeyboardImg.src = "image/uiojkl_num.png";
            numKeyboardImg.alt = "UIOJKL輸入法數字鍵盤示意圖";
        } else {
            // JKLUIO 模式
            engKeyboardImg.src = "image/jkluio_eng.png";
            engKeyboardImg.alt = "JKLUIO輸入法英文鍵盤示意圖";
            numKeyboardImg.src = "image/jkluio_num.png";
            numKeyboardImg.alt = "JKLUIO輸入法數字鍵盤示意圖";
        }
    }
}

function loadRanking() {
    fetch('ranking-traditional.txt')
        .then(response => response.text())
        .then(data => {
            const lines = data.split('\n');
            let rank = 0;
            lines.forEach(line => {
                if (line.trim() && !line.startsWith('#')) {
                    Array.from(line).forEach(char => {
                        if (!ranking[char]) {
                            ranking[char] = rank++;
                        }
                    });
                }
            });
        });
}

function parseData(data) {
    const lines = data.split('\n');
    const strokeDict = {};
    lines.forEach(line => {
        if (line.trim() && !line.startsWith('#') && line.includes('\t')) {
            const parts = line.split('\t');
            const character = parts[0].trim();
            const strokes = parts[1].trim();
            if (!strokeDict[strokes]) {
                strokeDict[strokes] = [];
            }
            strokeDict[strokes].push(character);
        }
    });
    return strokeDict;
}

function loadPhrases() {
    fetch('phrases-traditional.txt')
        .then(response => response.text())
        .then(data => {
            const lines = data.split('\n');
            lines.forEach(line => {
                if (line.trim() && !line.startsWith('#')) {
                    const char = line[0];
                    if (!phrases[char]) {
                        phrases[char] = [];
                    }
                    phrases[char].push(line.trim());
                }
            });
        });
}

function loadPunctuation() {
    fetch('punctuation.txt')
        .then(response => response.text())
        .then(data => {
            const lines = data.split('\n');
            lines.forEach(line => {
                if (line.trim() && !line.startsWith('#')) {
                    punctuation.push(line.trim());
                }
            });
        });
}

const mappings = { 
    'u': '一', 
    'i': '丨', 
    'o': '丿', 
    'j': '丶', 
    'k': '乛', 
    'l': '*'
};

function getDisplayNumber(index) {
    if (isNumericAscendingMode) {
        // 1, 2, ..., 9, 0 模式
        return (index + 1) % itemsPerPage === 0 ? '0' : ((index + 1) % itemsPerPage).toString();
    } else {
        // 0, 9, 8, ..., 1 模式
        if (index === 0) {
            return '0';
        } else {
            return (itemsPerPage - index).toString();
        }
    }
}

function displayStrokeCode(input) {
    const checkInput = document.getElementById('checkInput');
    let displayCode = '';
    
    // 如果是 JKLUIO 模式，先將輸入轉換為 UIOJKL 格式以正確顯示筆畫
    let processedInput = isUIOModeActive ? input : mapJKLUIOtoUIOJKL(input);
    
    for (let char of processedInput) {
        if (mappings[char]) {
            displayCode += mappings[char];
        } else {
            displayCode += char; // For any unexpected characters
        }
    }
    checkInput.value = displayCode;
}

function updateDisplay(characters) {
    const results = document.getElementById('results');
    results.innerHTML = '';

    const pageCharacters = characters.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
    if (pageCharacters.length === 0) {
        results.innerHTML = '<tr><td colspan="3">未找到相應的漢字。</td></tr>';
        return;
    }

    pageCharacters.forEach((item, index) => {
        const displayStrokes = item.strokes.split('').map(char => mappings[char] || char).join('');
        results.innerHTML += `<tr id="char-${index + 1}"><td>${getDisplayNumber(index)}</td><td>${item.char}</td><td>${displayStrokes}</td></tr>`;
    });
}

function displayPunctuation() {
    const results = document.getElementById('results');
    results.innerHTML = '';

    const pagePunctuation = punctuation.slice(punctuationPage * itemsPerPage, (punctuationPage + 1) * itemsPerPage);
    if (pagePunctuation.length === 0) {
        results.innerHTML = '<tr><td colspan="3">未找到相應的標點符號。</td></tr>';
        return;
    }

    pagePunctuation.forEach((symbol, index) => {
        results.innerHTML += `<tr id="punctuation-${index + 1}"><td>${getDisplayNumber(index)}</td><td colspan="2">${symbol}</td></tr>`;
    });
}

function selectCharacter(character, charIndex) {
    selectedChar = character;
    insertAtCursor(character);
    document.getElementById('strokeInput').value = '';
    currentPhrases = phrases[character] || [];
    phrasePage = 0;
    currentDisplayType = 'phrases';
    displayPhrases();
}

function selectPunctuation(symbol) {
    insertAtCursor(symbol);
}

function displayPhrases() {
    const results = document.getElementById('results');
    results.innerHTML = '';

    const pagePhrases = currentPhrases.slice(phrasePage * itemsPerPage, (phrasePage + 1) * itemsPerPage);
    if (pagePhrases.length === 0) {
        results.innerHTML = '<tr><td colspan="3">未找到相應的詞語。</td></tr>';
        return;
    }

    pagePhrases.forEach((phrase, index) => {
        // 顯示時去掉第一個字元
        const displayPhrase = phrase.substring(1);
        results.innerHTML += `<tr id="phrase-${index + 1}"><td>${getDisplayNumber(index)}</td><td colspan="2">${displayPhrase}</td></tr>`;
    });
}

function selectPhrase(phrase) {
    const outputInput = document.getElementById('Output');
    
    // 插入完整的詞語
    insertAtCursor(phrase);
    
    // 獲取詞語的最後一個字元
    const lastCharOfPhrase = phrase.slice(-1);

    // 根據最後一個字元進行新的詞語搜尋
    selectedChar = lastCharOfPhrase;
    currentPhrases = phrases[selectedChar] || [];
    phrasePage = 0;
    currentDisplayType = 'phrases';
    displayPhrases();
}


function previousPage() {
    if (currentDisplayType === 'phrases' && phrasePage > 0) {
        phrasePage--;
        displayPhrases();
    } else if (currentDisplayType === 'characters' && currentPage > 0) {
        currentPage--;
        updateDisplay(currentCharacters);
    } else if (currentDisplayType === 'punctuation' && punctuationPage > 0) {
        punctuationPage--;
        displayPunctuation();
    }
}


function nextPage() {
    if (currentDisplayType === 'phrases') {
        phrasePage++;
        if ((phrasePage * itemsPerPage) >= currentPhrases.length) {
            phrasePage = 0;
        }
        displayPhrases();
    } else if (currentDisplayType === 'characters') {
        currentPage++;
        if ((currentPage * itemsPerPage) >= currentCharacters.length) {
            currentPage = 0;
        }
        updateDisplay(currentCharacters);
    } else if (currentDisplayType === 'punctuation') {
        punctuationPage++;
        if ((punctuationPage * itemsPerPage) >= punctuation.length) {
            punctuationPage = 0;
        }
        displayPunctuation();
    }
}

function insertAtCursor(text) {
    const outputInput = document.getElementById('Output');
    const start = outputInput.selectionStart;
    const end = outputInput.selectionEnd;
    const originalText = outputInput.value;

    outputInput.value = originalText.substring(0, start) + text + originalText.substring(end);
    outputInput.selectionStart = outputInput.selectionEnd = start + text.length;
    var output = document.getElementById("Output").value.trim();
    logoutput(output);
    // 當 Output 內容改變時，儲存到 localStorage
    localStorage.setItem('savedOutputText', outputInput.value);
}


document.addEventListener('DOMContentLoaded', function () {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const sunIcon = darkModeToggle.querySelector('.swap-on');
    const moonIcon = darkModeToggle.querySelector('.swap-off');
    const outputTextarea = document.getElementById('Output');

    // 檢查用戶之前的選擇
    if (localStorage.getItem('darkMode') === 'enabled') {
        enableDarkMode();
    } else {
        disableDarkMode();
    }

    function enableDarkMode() {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'enabled');
        // 顯示太陽圖示，隱藏月亮圖示
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    }

    function disableDarkMode() {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'disabled');
        // 顯示月亮圖示，隱藏太陽圖示
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    }

    darkModeToggle.addEventListener('click', function () {
        if (localStorage.getItem('darkMode') === 'enabled') {
            disableDarkMode();
        } else {
            enableDarkMode();
        }
    });

    const savedHeight = localStorage.getItem('outputHeight');
    if (savedHeight) {
        outputTextarea.style.height = savedHeight + 'px';
      }
      outputTextarea.addEventListener('mouseup', function() {
        // 以 clientHeight 或 offsetHeight 取得實際高度
        const currentHeight = outputTextarea.clientHeight;
        localStorage.setItem('outputHeight', currentHeight);
      });

    // 載入之前儲存的 Output 文字
    const savedOutputText = localStorage.getItem('savedOutputText');
    if (savedOutputText) {
        outputTextarea.value = savedOutputText;
    }

    // 當 Output 內容手動輸入或貼上改變時，儲存到 localStorage
    outputTextarea.addEventListener('input', function() {
        localStorage.setItem('savedOutputText', this.value);
    });
});

function googleSearch() {
    var query = document.getElementById("Output").value.trim();
    console.log("Query: ", query);
    var googleSearchUrl = "https://www.google.com/search?ie=UTF-8&q=" + encodeURIComponent(query);
    console.log("Search URL: ", googleSearchUrl);
    window.open(googleSearchUrl, "_blank");
}

function convertTraditionalToSimplified() {
    const outputElement = document.getElementById('Output');
    const traditionalText = outputElement.value;

    // Create a converter instance
    const converter = OpenCC.Converter({ from: 'tw', to: 'cn' });

    // Perform the conversion
    const simplifiedText = converter(traditionalText);

    // Update the output element with the converted text
    outputElement.value = simplifiedText;
}


//google sheet
function logoutput(searchedCharacters) {
    const databaseURL = 'https://t5input-89750-default-rtdb.asia-southeast1.firebasedatabase.app/logs.json'; // 使用您的 Firebase Database URL
    const payload = {
        userId: "index",
        output: searchedCharacters,
        timestamp: new Date().toISOString(), // 添加時間戳
        inputMode: isUIOModeActive ? "UIOJKL" : "JKLUIO" // 記錄輸入模式
    };

    fetch(databaseURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
}