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

let myName = "";
let isPressed = false;

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
    const members = Array.from(document.querySelectorAll('.member-row')).map(row => ({
        name: row.querySelector('.member-name').value.trim(),
        no: row.querySelector('.member-no').value.trim()
    })).filter(m => m.name);

    if (team && room) {
        myName = team;
        db.ref('teamDetails/' + team).set({ classRoom: room, members: members });
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('bellSection').style.display = 'block';
        document.getElementById('welcomeText').innerText = `ทีม: ${myName}`;
        document.getElementById('classText').innerText = `ห้อง: ${room}`;
        listenForReset();
    } else alert("กรุณากรอกข้อมูลให้ครบถ้วน");
};

document.getElementById('bellBtn').onclick = () => {
    if (!isPressed) {
        isPressed = true;
        db.ref('queue/' + myName).set({ name: myName, timestamp: firebase.database.ServerValue.TIMESTAMP });
        const btn = document.getElementById('bellBtn');
        btn.disabled = true;
        btn.style.opacity = "0.5";
        document.getElementById('statusText').innerText = "ส่งคำตอบแล้ว! ⏳";
    }
};

function listenForReset() {
    db.ref('queue/' + myName).on('value', (snapshot) => {
        if (!snapshot.exists()) {
            isPressed = false;
            const btn = document.getElementById('bellBtn');
            btn.disabled = false;
            btn.style.opacity = "1";
            document.getElementById('statusText').innerText = "พร้อมกด! 🔥";
        }
    });
}
