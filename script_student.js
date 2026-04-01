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

        db.ref(`rooms/${myRoom}/teamDetails/${myName}`).set({ classRoom: room, members: members });
        db.ref(`rooms/${myRoom}/scores/${myName}`).transaction((current) => (current === null ? 0 : current));

        showBellSection();
    } else alert("กรุณากรอกข้อมูลให้ครบถ้วน รวมถึงรหัสห้อง 4 หลัก");
};

function showBellSection() {
    const roomClass = localStorage.getItem('myClass') || "";
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('bellSection').style.display = 'block';
    document.getElementById('welcomeText').innerText = `ทีม: ${myName}`;
    document.getElementById('classText').innerText = `ชั้น: ${roomClass}`;
    document.getElementById('roomDisplay').innerText = `🟢 ROOM PIN: ${myRoom}`;
    
    listenForGameState(); // เปลี่ยนมาเรียกฟังก์ชันนี้แทน
}

// 📌 ฟังก์ชันหลัก: ควบคุมปุ่มกดตามจังหวะที่ครูสั่ง
function listenForGameState() {
    db.ref(`rooms/${myRoom}/gameState`).on('value', (snapshot) => {
        const state = snapshot.val();
        const btn = document.getElementById('bellBtn');
        const statusText = document.getElementById('statusText');
        
        if (!state) {
            // โหมดสแตนด์บาย (รอครูเริ่มเกม)
            isPressed = true; // ล็อคปุ่ม
            btn.disabled = true;
            btn.style.opacity = "0.5";
            btn.innerHTML = `<span>⏳</span><br><span style="font-size:1.2rem">รอครูเริ่มเกม</span>`;
            statusText.innerText = "รอสัญญาณจากครู...";
            
        } else if (state.startsWith('counting_')) {
            // โหมดกำลังนับถอยหลัง (3.. 2.. 1..)
            const num = state.split('_')[1];
            isPressed = true; // ยังคงล็อคปุ่มอยู่
            btn.disabled = true;
            btn.style.opacity = "1";
            btn.style.background = "#ff7675"; // เปลี่ยนปุ่มเป็นสีแดง
            btn.innerHTML = `<span style="font-size:4rem; line-height:1.5;">${num}</span>`;
            statusText.innerText = "เตรียมตัว...";
            statusText.style.color = "#e67e22";
            
        } else if (state === 'ready') {
            // โหมดพร้อมกด (GO!)
            isPressed = false; // ปลดล็อคปุ่ม!
            btn.disabled = false;
            btn.style.opacity = "1";
            btn.style.background = ""; // คืนค่าสีปุ่มกลับเป็นค่าเริ่มต้นตาม CSS
            btn.innerHTML = `<span>⚡</span><br><span>กด!</span>`;
            statusText.innerText = "พร้อมกด! 🔥";
            statusText.style.color = "#27ae60";
        }
    });
}

document.getElementById('bellBtn').onclick = () => {
    if (!isPressed) {
        isPressed = true;
        // ส่งข้อมูลขึ้น Firebase
        db.ref(`rooms/${myRoom}/queue/${myName}`).set({ name: myName, timestamp: firebase.database.ServerValue.TIMESTAMP });
        
        // ล็อคปุ่มตัวเองทันทีที่กดเสร็จ
        const btn = document.getElementById('bellBtn');
        btn.disabled = true;
        btn.style.opacity = "0.5";
        btn.innerHTML = `<span>✔️</span><br><span style="font-size:1.2rem">ส่งแล้ว</span>`;
        document.getElementById('statusText').innerText = "ส่งคำตอบแล้ว! ⏳";
    }
};

document.getElementById('logoutBtn').onclick = () => {
    if(confirm("ต้องการออกจากห้อง หรือ เปลี่ยนทีม ใช่หรือไม่?")) {
        localStorage.clear();
        location.reload();
    }
};
