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

let myName = localStorage.getItem('myTeam') || "";
let myRoom = localStorage.getItem('myRoom') || "";
let isPressed = false;

// ถ้ามีข้อมูลเดิมให้เข้าห้องเลย
if (myName && myRoom) {
    showBellSection();
}

function addMemberInput() {
    const div = document.createElement('div');
    div.className = 'member-row';
    div.innerHTML = `<input type="text" class="small-input member-name" placeholder="ชื่อ-สกุล"><input type="number" class="small-input member-no" placeholder="เลขที่">`;
    document.getElementById('membersContainer').appendChild(div);
}
for(let i=0; i<5; i++) addMemberInput();

document.getElementById('joinBtn').onclick = () => {
    const team = document.getElementById('teamName').value.trim();
    const room = document.getElementById('classRoom').value.trim();
    const pin = document.getElementById('roomPin').value.trim();
    const members = Array.from(document.querySelectorAll('.member-row')).map(row => ({
        name: row.querySelector('.member-name').value.trim(),
        no: row.querySelector('.member-no').value.trim()
    })).filter(m => m.name);

    if (team && room && pin) {
        myName = team;
        myRoom = pin;
        localStorage.setItem('myTeam', team);
        localStorage.setItem('myRoom', pin);
        localStorage.setItem('myClass', room);

        // บันทึกข้อมูลแยกห้อง และตั้งคะแนนเริ่มต้นที่ 0 เพื่อให้ชื่อโผล่ฝั่งครู
        db.ref(`rooms/${myRoom}/teamDetails/${myName}`).set({ classRoom: room, members: members });
        db.ref(`rooms/${myRoom}/scores/${myName}`).transaction((current) => (current === null ? 0 : current));

        showBellSection();
    } else alert("กรุณากรอกข้อมูลให้ครบถ้วน รวมถึงรหัสห้อง");
};

function showBellSection() {
    const roomClass = localStorage.getItem('myClass') || "";
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('bellSection').style.display = 'block';
    document.getElementById('welcomeText').innerText = `ทีม: ${myName}`;
    document.getElementById('classText').innerText = `ห้อง: ${roomClass}`;
    document.getElementById('roomDisplay').innerText = `ROOM PIN: ${myRoom}`;
    listenForReset();
}

document.getElementById('bellBtn').onclick = () => {
    if (!isPressed) {
        isPressed = true;
        db.ref(`rooms/${myRoom}/queue/${myName}`).set({ name: myName, timestamp: firebase.database.ServerValue.TIMESTAMP });
        const btn = document.getElementById('bellBtn');
        btn.disabled = true;
        btn.style.opacity = "0.5";
        document.getElementById('statusText').innerText = "ส่งคำตอบแล้ว! ⏳";
    }
};

function listenForReset() {
    db.ref(`rooms/${myRoom}/queue/${myName}`).on('value', (snapshot) => {
        if (!snapshot.exists()) {
            isPressed = false;
            const btn = document.getElementById('bellBtn');
            btn.disabled = false;
            btn.style.opacity = "1";
            document.getElementById('statusText').innerText = "พร้อมกด! 🔥";
        }
    });
}

document.getElementById('logoutBtn').onclick = () => {
    if(confirm("ต้องการออกจากห้องใช่หรือไม่?")) {
        localStorage.clear();
        location.reload();
    }
};
