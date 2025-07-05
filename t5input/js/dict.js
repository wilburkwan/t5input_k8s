let lastUploadedOutput = '';
let dictLoaded = false; // 新增變數追踪字典載入狀態

window.onload = function() {
    // 設置輸入框為載入中狀態
    const searchInput = document.getElementById('searchInput');
    searchInput.placeholder = '正在載入字典資料，請稍候...';
    searchInput.disabled = true;
    
    fetch('dict.txt')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        // 獲取文件總大小
        const totalSize = parseInt(response.headers.get('content-length'));
        let loadedSize = 0;
        
        // 創建一個可讀流的reader
        const reader = response.body.getReader();
        
        // 用於存儲接收到的所有塊
        let chunks = [];
        
        // 使用ReadableStream處理下載進度
        return new Promise((resolve, reject) => {
            function processResult(result) {
                if (result.done) {
                    // 合併所有塊並轉換為文本
                    const allChunks = new Uint8Array(loadedSize);
                    let position = 0;
                    for (const chunk of chunks) {
                        allChunks.set(chunk, position);
                        position += chunk.length;
                    }
                    resolve(new TextDecoder('utf-8').decode(allChunks));
                    return;
                }
                
                // 存儲當前塊並更新進度
                chunks.push(result.value);
                loadedSize += result.value.length;
                
                // 更新進度百分比，確保不超過100%
                if (totalSize && !isNaN(totalSize)) {
                    let percent = Math.min(Math.round((loadedSize / totalSize) * 100), 100);
                    searchInput.placeholder = `正在載入字典資料 (${percent}%)，請稍候...`;
                } else {
                    // 如果無法獲取可靠的總大小，則顯示已加載數據大小
                    const kbLoaded = (loadedSize / 1024).toFixed(1);
                    searchInput.placeholder = `正在載入字典資料 (${kbLoaded} KB)，請稍候...`;
                }
                
                // 繼續讀取下一個塊
                reader.read().then(processResult).catch(reject);
            }
            
            // 開始讀取
            reader.read().then(processResult).catch(reject);
        });
    })
    .then(data => {
        window.strokeData = parseData(data);
        dictLoaded = true; // 標記字典已載入
        
        // 恢復輸入框狀態
        searchInput.placeholder = '輸入漢字';
        searchInput.disabled = false;
    })
    .catch(error => {
        console.error('Failed to fetch stroke data:', error);
        document.getElementById('results').innerHTML = '<tr><td colspan="2">無法載入筆劃資料。</td></tr>';
        
        // 顯示錯誤狀態
        searchInput.placeholder = '無法載入字典資料，請重新整理頁面';
        searchInput.disabled = false;
    });
};

function parseData(data) {
    const lines = data.split('\n');
    const strokeDict = {};
    lines.forEach(line => {
        if (line.trim() && !line.startsWith('#')) {
            const parts = line.split('\t');
            if (parts.length === 2) {
                const char = parts[0].trim();
                const stroke = convertStrokeToSymbols(parts[1].trim());
                if (!strokeDict[char]) {
                    strokeDict[char] = [];
                }
                strokeDict[char].push(stroke);
            }
        }
    });
    return strokeDict;
}

function convertStrokeToSymbols(strokeCode) {
    return strokeCode.replace(/u/g, '一')
                     .replace(/i/g, '丨')
                     .replace(/o/g, '丿')
                     .replace(/j/g, '丶')
                     .replace(/k/g, '乛');
}

function searchCharacter() {
    const input = document.getElementById('searchInput').value.trim();
    const results = document.getElementById('results');
    results.innerHTML = ''; // 清空之前的結果

    if (!dictLoaded) {
        const loadingMessage = document.getElementById('searchInput').placeholder;
        results.innerHTML = `<tr><td colspan="2">${loadingMessage}</td></tr>`;
        return;
    }

    if (!input) {
        results.innerHTML = '<tr><td colspan="2">請輸入一個或多個漢字。</td></tr>';
        return;
    }

    // 處理輸入中的每個字元
    Array.from(input).forEach(char => {
        let rowHtml = '<tr>';
        if (window.strokeData[char]) {
            rowHtml += `<td>${char}</td><td>${window.strokeData[char].join(' <br> ')}</td>`;
        } else {
            rowHtml += `<td>${char}</td><td>未找到筆劃順序。</td>`;
        }
        rowHtml += '</tr>';
        results.innerHTML += rowHtml;
    });

    if (input && input !== lastUploadedOutput) {
        logSearch(input); // 使用 logSearch
        lastUploadedOutput = input;
    }
}

function logSearch(searchedCharacters) {
    const databaseURL = 'https://t5input-89750-default-rtdb.asia-southeast1.firebasedatabase.app/logs.json'; // 使用您的 Firebase Database URL
    const payload = {
        userId: "dict",
        output: searchedCharacters,
        timestamp: new Date().toISOString() // 添加時間戳
    };

    fetch(databaseURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
}


document.addEventListener('DOMContentLoaded', function () {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const sunIcon = darkModeToggle.querySelector('.swap-on');
    const moonIcon = darkModeToggle.querySelector('.swap-off');
    
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
});