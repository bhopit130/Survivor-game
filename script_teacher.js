const firebaseConfig = {
  apiKey: "AIzaSyBPfA9hUsJ194I0nCS6KCbHqAvQiPLlh5A",
  authDomain: "kindergarten-system-23604.firebaseapp.com",
  databaseURL: "https://kindergarten-system-23604-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kindergarten-system-23604",
  storageBucket: "kindergarten-system-23604.firebasestorage.app",
  messagingSenderId: "173614788791",
  appId: "1:173614788791:web:e4779177a48814389f9d32"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const queueList = document.getElementById('queueList');
const scoreList = document.getElementById('scoreList');
const bellSound = document.getElementById('bellSound');
let currentScores = {};
let currentTeamDetails = {};
let countdownTimerId = null;
let roomPin = "";

// ฟังก์ชันสุ่มรหัสห้อง 4 หลัก
window.generateNewRoom = () => {
    roomPin = Math.floor(1000 + Math.random() * 9000).toString();
    document.getElementById('roomPinDisplay').innerText = roomPin;
    initListeners();
};

generateNewRoom(); // ทำงานทันทีที่เปิดเว็บ

function initListeners() {
    db.ref().off(); 

    // ดึงข้อมูลคะแนน
    db.ref(`rooms/${roomPin}/scores`).on('value', (snapshot) => {
        currentScores = snapshot.val() || {};
        renderLeaderboard(currentScores);
    });

    db.ref(`rooms/${roomPin}/teamDetails`).on('value', (snapshot) => {
        currentTeamDetails = snapshot.val() || {};
    });

    // ดึงคิวกดกริ่ง (เอาการจับเวลา 5 วิออกไปแล้ว)
    db.ref(`rooms/${roomPin}/queue`).orderByChild('timestamp').on('value', (snapshot) => {
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
            // เล่นเสียงเมื่อมีคนกดคนแรก
            if (index === 1) {
                bellSound.play().catch(e => console.log(e));
            }
        });
        if (index === 0) {
            queueList.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:30px; color:#aaa;">รอรับคำตอบ...</td></tr>`;
        }
    });

    // ติดตามสถานะเกม (GameState) สำหรับแสดงเวลานับถอยหลังหน้าจอครู
    db.ref(`rooms/${roomPin}/gameState`).on('value', (snapshot) => {
        const state = snapshot.val();
        const timerEl = document.getElementById('countdownTimer');
        
        if (!state) {
            timerEl.style.display = 'none';
            return;
        }

        if (state.startsWith('counting_')) {
            const num = state.split('_')[1];
            timerEl.style.display = 'flex';
            timerEl.innerText = num;
            timerEl.classList.add('timer-active');
            timerEl.style.backgroundColor = "#ff7675"; // สีแดง
        } else if (state === 'ready') {
            timerEl.style.display = 'flex';
            timerEl.innerText = "GO!";
            timerEl.style.backgroundColor = "#00b894"; // สีเขียว
            setTimeout(() => {
                timerEl.classList.remove('timer-active');
                timerEl.style.display = 'none';
            }, 1500);
        }
    });
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

// 📌 เมื่อครูให้คะแนน จะลบชื่อออกจากคิว แต่ไม่เปลี่ยน GameState (นักเรียนจะยังกดซ้ำไม่ได้)
window.adjustScore = (name, amount) => {
    db.ref(`rooms/${roomPin}/scores/${name}`).transaction((current) => (current || 0) + amount);
    db.ref(`rooms/${roomPin}/queue/${name}`).remove();
};

// 📌 เมื่อครูกด "ล้างคิวคนกด" จะเริ่มนับถอยหลัง 3.. 2.. 1.. 
document.getElementById('resetQueueBtn').onclick = () => {
    // 1. ล้างคิวคนกดทั้งหมด
    db.ref(`rooms/${roomPin}/queue`).remove();
    
    // 2. เคลียร์เวลานับถอยหลังเก่า (ถ้ามี)
    if(countdownTimerId) clearInterval(countdownTimerId);
    
    // 3. เริ่มส่งสัญญาณนับถอยหลังไปที่ Firebase
    let count = 3;
    db.ref(`rooms/${roomPin}/gameState`).set('counting_' + count);
    
    countdownTimerId = setInterval(() => {
        count--;
        if(count > 0) {
            db.ref(`rooms/${roomPin}/gameState`).set('counting_' + count);
        } else {
            clearInterval(countdownTimerId);
            db.ref(`rooms/${roomPin}/gameState`).set('ready'); // พร้อมกด!
        }
    }, 1000);
};

document.getElementById('resetGameBtn').onclick = () => {
    if(confirm(`ล้างคะแนนและข้อมูลทั้งหมดของห้อง [ ${roomPin} ] ใช่หรือไม่?`)) {
        db.ref(`rooms/${roomPin}`).remove();
    }
};

window.openReport = () => {
    const tbody = document.getElementById('reportBody');
    document.getElementById('reportDate').innerText = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('reportRoom').innerText = roomPin;
    tbody.innerHTML = '';
    Object.entries(currentScores).sort((a,b)=>b[1]-a[1]).forEach(([team, score], i) => {
        const d = currentTeamDetails[team] || { classRoom: '-', members: [] };
        let mHtml = '<ul>' + (d.members?.map(m => `<li>${m.name} (${m.no})</li>`).join('') || '-') + '</ul>';
        tbody.innerHTML += `<tr><td style="text-align:center;">${i+1}</td><td><b>${team}</b></td><td>${d.classRoom}</td><td>${mHtml}</td><td style="text-align:center;"><b>${score}</b></td></tr>`;
    });
    document.getElementById('reportModal').style.display = 'flex';
};
window.closeReport = () => document.getElementById('reportModal').style.display = 'none';
