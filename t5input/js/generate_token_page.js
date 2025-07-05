document.addEventListener('DOMContentLoaded', () => {
    const watchAdBtn = document.getElementById('watchAdBtn');
    const adStatus = document.getElementById('adStatus');
    const tokenDisplay = document.getElementById('tokenDisplay');
    const tokenOutput = document.getElementById('tokenOutput');

    // !!! 警告：此秘密金鑰絕對不應暴露在客戶端程式碼中。在實際生產環境中，請務必將其保存在安全的伺服器端。
    // For demonstration purposes only.
    const SECRET_KEY = '~zVQ<R2y(gR4,Xr9.ZXqiCMJ{dKjT_£7,=[H0q.l3:b_8J<K9~'; // 請替換為您自己的強大金鑰

    // 新增：檢查所有必要的 DOM 元素是否存在
    if (!watchAdBtn || !adStatus || !tokenDisplay || !tokenOutput) {
        console.error('錯誤：缺少一個或多個必要的 DOM 元素，請檢查 generate_token_page.html。');
        return; // 停止執行以避免 TypeError
    }

    // 新增：深色模式切換邏輯
    const darkModeToggle = document.getElementById('darkModeToggle');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    // 函數：應用深色模式
    function applyDarkMode(isDark) {
        if (isDark) {
            document.body.classList.add('dark-mode');
            if (darkModeToggle) {
                darkModeToggle.querySelector('.swap-on').style.display = 'block';
                darkModeToggle.querySelector('.swap-off').style.display = 'none';
            }
        } else {
            document.body.classList.remove('dark-mode');
            if (darkModeToggle) {
                darkModeToggle.querySelector('.swap-on').style.display = 'none';
                darkModeToggle.querySelector('.swap-off').style.display = 'block';
            }
        }
    }

    // 初始化深色模式：從 localStorage 讀取或根據系統偏好
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyDarkMode(savedTheme === 'dark');
    } else {
        applyDarkMode(systemPrefersDark.matches);
    }

    // 監聽深色模式切換按鈕點擊事件
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            const isDark = document.body.classList.contains('dark-mode');
            applyDarkMode(!isDark);
            localStorage.setItem('theme', !isDark ? 'dark' : 'light');
        });
    }

    // 監聽系統主題偏好變化
    systemPrefersDark.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) { // 只有當用戶沒有手動設定時才響應系統變化
            applyDarkMode(e.matches);
        }
    });

    if (watchAdBtn) {
        watchAdBtn.addEventListener('click', () => {
            // 如果 Token 已經顯示，則執行複製操作
            if (tokenOutput.value) {
                tokenOutput.select();
                tokenOutput.setSelectionRange(0, 99999); // For mobile devices
                try {
                    document.execCommand('copy');
                    watchAdBtn.textContent = '已複製!';
                    setTimeout(() => {
                        watchAdBtn.textContent = '複製 Token';
                    }, 2000);
                } catch (err) {
                    console.error('複製失敗', err);
                    watchAdBtn.textContent = '複製失敗';
                }
                return; // 執行複製後直接返回
            }

            // 否則，執行獲取 Token 的操作
            watchAdBtn.disabled = true;
            adStatus.textContent = '請稍候...';
            tokenDisplay.style.display = 'none'; // 隱藏 tokenDisplay
            tokenOutput.value = '';
            watchAdBtn.textContent = '正在獲取 Token...';

            // 模擬廣告播放時間 (例如 5 秒)
            setTimeout(() => {
                adStatus.textContent = '廣告播放完畢！';
                
                const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 1 day in milliseconds
                const expiresAt = Math.floor((Date.now() + ONE_DAY_MS) / 1000); // Token expires 24 hours from now, in seconds
                
                // Create a simple token object
                const tokenPayload = {
                    exp: expiresAt, // JWT 的過期時間 (Expiration Time)
                    iat: Math.floor(Date.now() / 1000), // JWT 的簽發時間 (Issued At)
                    appName: "t5input-extension",
                    // 您可以在此添加更多數據
                };

                // 將秘密金鑰轉換為 Uint8Array，因為 jose 函式庫需要這個格式
                const secret = new TextEncoder().encode(SECRET_KEY);
                
                // 使用 jose 簽署 JWT
                // 請注意：此處的秘密金鑰仍然暴露在前端，存在安全風險。
                new jose.SignJWT(tokenPayload)
                    .setProtectedHeader({ alg: 'HS256' })
                    .sign(secret)
                    .then(signedToken => {
                        tokenOutput.value = signedToken;
                tokenDisplay.style.display = 'block'; // Make sure it's visible
                
                // 自動選中 Token 文本
                tokenOutput.select();
                tokenOutput.setSelectionRange(0, 99999); // For mobile devices
                
                // 提示用戶複製
                adStatus.textContent = '請複製您的 Token 碼並貼到擴充功能中。 ';
                watchAdBtn.textContent = '複製 Token'; // 改變按鈕文字為複製 Token
                watchAdBtn.disabled = false; // 重新啟用按鈕
                    })
                    .catch(error => {
                        console.error('生成 Token 失敗:', error);
                        adStatus.textContent = '生成 Token 失敗！';
                        watchAdBtn.textContent = '重新獲取 Token';
                        watchAdBtn.disabled = false;
                    });

            },300); // 5 秒
        });
    }
}); 