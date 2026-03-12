
const firebaseConfig = {
  apiKey: "AIzaSyBIzSM-7JFm5UKTlTIQ6lddgcQ7TEY3bng",
  authDomain: "treequestproject.firebaseapp.com",
  databaseURL: "https://treequestproject-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "treequestproject",
  storageBucket: "treequestproject.firebasestorage.app",
  messagingSenderId: "120187551632",
  appId: "1:120187551632:web:fd02a953fb532ceefbbd15"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const queueList = document.getElementById('queueList');
const scoreList = document.getElementById('scoreList');
const bellSound = document.getElementById('bellSound');
const timerEl = document.getElementById('countdownTimer');

let currentScores = {};
let currentTeamDetails = {};
let timerInterval = null;

// ดึงข้อมูลคะแนน
db.ref('scores').on('value', (snapshot) => {
    currentScores = snapshot.val() || {};
    renderLeaderboard(currentScores);
});

// ดึงข้อมูลสมาชิก
db.ref('teamDetails').on('value', (snapshot) => {
    currentTeamDetails = snapshot.val() || {};
});

// ติดตามลำดับการกด (Queue)
db.ref('queue').orderByChild('timestamp').on('value', (snapshot) => {
    queueList.innerHTML = '';
    let index = 0;
    
    snapshot.forEach((child) => {
        index++;
        const entry = child.val();
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><h1>${index}</h1></td>
            <td><span style="font-size:1.2rem; font-weight:bold;">${entry.name}</span><br><small style="color:#888;">${new Date(entry.timestamp).toLocaleTimeString()}</small></td>
            <td>
                <button class="btn-score btn-plus" onclick="adjustScore('${entry.name}', 1)">+1</button>
                <button class="btn-score btn-minus" onclick="adjustScore('${entry.name}', -1)">-1</button>
            </td>
        `;
        queueList.appendChild(tr);

        // ถ้าเป็นคนแรก ให้เริ่มจับเวลา
        if (index === 1 && !timerInterval) {
            startCountdown();
            bellSound.play().catch(e => console.log(e));
        }
    });

    if (index === 0) {
        queueList.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:30px; color:#aaa;">รอสัญญาณ...</td></tr>`;
        stopCountdown();
    }
});

function startCountdown() {
    let timeLeft = 5;
    timerEl.innerText = timeLeft;
    timerEl.classList.add('timer-active');
    timerInterval = setInterval(() => {
        timeLeft--;
        timerEl.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerEl.innerText = "หมดเวลา!";
            timerEl.style.backgroundColor = "#2d3436";
        }
    }, 1000);
}

function stopCountdown() {
    if(timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    timerEl.classList.remove('timer-active');
    timerEl.style.backgroundColor = "#ff7675";
}

function renderLeaderboard(scores) {
    scoreList.innerHTML = '';
    const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    sortedScores.forEach(([name, score], index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${index===0?'👑 ':''}${name}</span><span class="score-badge ${index===0?'rank-1-score':''}">${score}</span>`;
        scoreList.appendChild(li);
    });
}

window.adjustScore = (name, amount) => {
    db.ref('scores/' + name).transaction((current) => (current || 0) + amount);
    db.ref('queue/' + name).remove();
    stopCountdown();
};

document.getElementById('resetQueueBtn').onclick = () => db.ref('queue').remove();

document.getElementById('resetGameBtn').onclick = () => {
    if(confirm("ล้างข้อมูลทั้งหมด?")) db.ref().remove();
};

// PDF Report Logic (เหมือนเดิม)
window.openReport = () => {
    const tbody = document.getElementById('reportBody');
    document.getElementById('reportDate').innerText = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    tbody.innerHTML = '';
    Object.entries(currentScores).sort((a,b)=>b[1]-a[1]).forEach(([team, score], i) => {
        const d = currentTeamDetails[team] || { classRoom: '-', members: [] };
        let mHtml = '<ul>' + (d.members?.map(m => `<li>${m.name} (${m.no})</li>`).join('') || '-') + '</ul>';
        tbody.innerHTML += `<tr><td style="text-align:center;">${i+1}</td><td><b>${team}</b></td><td>${d.classRoom}</td><td>${mHtml}</td><td style="text-align:center;"><b>${score}</b></td></tr>`;
    });
    document.getElementById('reportModal').style.display = 'flex';
};
window.closeReport = () => document.getElementById('reportModal').style.display = 'none';