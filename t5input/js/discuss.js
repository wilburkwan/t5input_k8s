// 引入並設置 Day.js
dayjs.locale('zh-hk');
dayjs.extend(window.dayjs_plugin_customParseFormat);

document.getElementById('google-form').addEventListener('submit', function(event) {
    event.preventDefault(); // 阻止預設提交行為

    var form = event.target;
    var data = new FormData(form);

    fetch('https://docs.google.com/forms/d/e/1FAIpQLSeVOywfy-DGrt6JGDy_jZp6TCmRnvAc7VB-x6KLd3kvDAtgww/formResponse', {
        method: 'POST',
        body: data,
        mode: 'no-cors'
    }).then(function() {
        document.getElementById('success-message').style.display = 'block';
        form.reset();
        // 15秒後重新載入留言區
        setTimeout(fetchSheetData, 15000);
    }).catch(function(error) {
        console.error('Error:', error);
    });
});

function fetchSheetData() {
    const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTLrqIF3Nxqqcs-GVvLxkOcf08-qwJy3Tpg1XHAveKbo6n6lQ7ZqZQwY0--ZWZmm4NKfYC13UToodBU/pub?output=csv';

    fetch(url)
        .then(response => response.text())
        .then(data => {
            console.log('Data fetched successfully');

            // 使用 PapaParse 解析 CSV 資料
            const parsedData = Papa.parse(data, {
                header: true,
                skipEmptyLines: true,
            });

            const comments = parsedData.data.map(row => ({
                timestamp: parseDate(row['時間戳記']),
                nickname: row['暱稱：'],
                message: row['意見：']
            }));

            // 過濾無效的日期
            const validComments = comments.filter(comment => comment.timestamp);

            validComments.sort((a, b) => b.timestamp - a.timestamp); // 按時間從新到舊排序
            displayComments(validComments);
        })
        .catch(error => console.error('Error fetching data:', error));
}

function parseDate(dateString) {
    // 使用 Day.js 解析日期
    const date = dayjs(dateString, 'YYYY/M/D A h:mm:ss');
    return date.isValid() ? date.toDate() : null;
}

function displayComments(comments) {
    const commentSection = document.getElementById('comment-section');
    commentSection.innerHTML = ''; // 清空現有留言

    comments.forEach(comment => {
        if (comment.timestamp && comment.nickname && comment.message &&
            comment.nickname.trim() !== '' && comment.message.trim().replace(/\s/g, '') !== '') {

            const commentDiv = document.createElement('div');
            commentDiv.className = 'comment';

            const nicknameDiv = document.createElement('div');
            nicknameDiv.className = 'nickname';
            nicknameDiv.textContent = comment.nickname;

            const timestampDiv = document.createElement('div');
            timestampDiv.className = 'timestamp';
            timestampDiv.textContent = dayjs(comment.timestamp).format('YYYY/MM/DD HH:mm:ss');

            const messageDiv = document.createElement('div');
            messageDiv.className = 'message';
            // 方法一：將換行符替換為 <br>
            messageDiv.innerHTML = comment.message.replace(/\n/g, '<br>');

            commentDiv.appendChild(nicknameDiv);
            commentDiv.appendChild(timestampDiv);
            commentDiv.appendChild(messageDiv);

            commentSection.appendChild(commentDiv);
        }
    });
}

document.addEventListener('DOMContentLoaded', fetchSheetData);
