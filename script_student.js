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

// ดึงชื่อทีมจาก LocalStorage (ถ้าเคยลงทะเบียนไว้แล้ว)
let myName = localStorage.getItem('myTeam') || "";
let isPressed = false;

// เช็คสถานะตอนเปิดเว็บ: ถ้าเคยมีชื่อแล้ว ให้ข้ามหน้าลงทะเบียนไปเลย
if (myName) {
    const room = localStorage.getItem('myRoom') || "";
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('bellSection').style.display = 'block';
    document.getElementById('welcomeText').innerText = `ทีม: ${myName}`;
    document.getElementById('classText').innerText = `ห้อง: ${room}`;
    listenForReset();
}

function addMemberInput() {
    const div = document.createElement('div');
    div.className = 'member-row';
    div.innerHTML = `<input type="text" class="small-input member-name" placeholder="ชื่อ-สกุล"><input type="number" class="small-input member-no" placeholder="เลขที่">`;
    document.getElementById('membersContainer').appendChild(div);
}
for(let i=0; i<5; i++) addMemberInput();

// ทำงานเมื่อกดปุ่ม "บันทึกและเริ่มเกม"
document.getElementById('joinBtn').onclick = () => {
    const team = document.getElementById('teamName').value.trim();
    const room = document.getElementById('classRoom').value.trim();
    const members = Array.from(document.querySelectorAll('.member-row')).map(row => ({
        name: row.querySelector('.member-name').value.trim(),
        no: row.querySelector('.member-no').value.trim()
    })).filter(m => m.name);

    if (team && room) {
        myName = team;
        
        // 1. บันทึกข้อมูลลงมือถือของนักเรียน (กันเน็ตหลุด/เผลอปิดหน้าจอ)
        localStorage.setItem('myTeam', team);
        localStorage.setItem('myRoom', room);

        // 2. ส่งข้อมูลสมาชิกลง Firebase
        db.ref('teamDetails/' + team).set({ classRoom: room, members: members });
        
        // 3. กำหนดคะแนนให้เป็น 0 เพื่อให้ชื่อทีมไปโผล่ที่หน้าจอครูทันที
        db.ref('scores/' + team).transaction((current) => current !== null ? current : 0);

        // เปลี่ยนหน้าจอ
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('bellSection').style.display = 'block';
        document.getElementById('welcomeText').innerText = `ทีม: ${myName}`;
        document.getElementById('classText').innerText = `ห้อง: ${room}`;
        listenForReset();
    } else alert("กรุณากรอกข้อมูลให้ครบถ้วน");
};

// ปุ่มกดกริ่ง
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

// รอฟังคำสั่งล้างคิวจากครู
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

// ปุ่มออกจากระบบ (เคลียร์ความจำแล้วรีเฟรชหน้าเว็บ)
document.getElementById('logoutBtn').onclick = () => {
    if(confirm("ต้องการเปลี่ยนทีม หรือออกจากระบบใช่หรือไม่?")) {
        localStorage.removeItem('myTeam');
        localStorage.removeItem('myRoom');
        location.reload(); 
    }
};
