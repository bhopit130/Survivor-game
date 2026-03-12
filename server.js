const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, '/')));

let bellQueue = [];
let scores = {}; 
let teamDetails = {}; // 🆕 ตัวแปรเก็บข้อมูลสมาชิกในทีม

io.on('connection', (socket) => {
    // ส่งข้อมูลตั้งต้น
    socket.emit('updateBellList', bellQueue);
    socket.emit('updateScores', scores);
    socket.emit('updateTeamDetails', teamDetails); // ส่งข้อมูลทีมให้ครู

    // 🆕 1. รับข้อมูลลงทะเบียนทีม (ชื่อ, ชั้น, สมาชิก)
    socket.on('registerTeam', (data) => {
        teamDetails[data.teamName] = {
            classRoom: data.classRoom,
            members: data.members // Array ของ { name, no }
        };
        // เริ่มต้นคะแนนเป็น 0 ถ้ายังไม่มี
        if (!scores[data.teamName]) {
            scores[data.teamName] = 0;
        }
        io.emit('updateTeamDetails', teamDetails);
        io.emit('updateScores', scores);
    });

    // 2. รับการกดกระดิ่ง
    socket.on('ring', (data) => {
        const exists = bellQueue.find(item => item.name === data.name);
        if (!exists) {
            const entry = {
                order: bellQueue.length + 1,
                name: data.name,
                time: data.time,
                id: socket.id
            };
            bellQueue.push(entry);
            io.emit('updateBellList', bellQueue);
            
            if (bellQueue.length === 1) {
                io.emit('startTimer'); 
            }
        }
    });

    // 3. ปรับคะแนน
    socket.on('adjustScore', ({ name, amount }) => {
        if (!scores[name]) scores[name] = 0;
        scores[name] += amount;
        io.emit('updateScores', scores);
    });

    // 4. รีเซ็ตข้อ
    socket.on('resetQueue', () => {
        bellQueue = [];
        io.emit('resetClient');
        io.emit('updateBellList', []);
        io.emit('stopTimer');
    });

    // 5. ล้างเกม (เคลียร์ข้อมูลทั้งหมด)
    socket.on('resetGame', () => {
        bellQueue = [];
        scores = {};
        teamDetails = {}; // ล้างข้อมูลทีมด้วย
        io.emit('resetClient');
        io.emit('updateBellList', []);
        io.emit('updateScores', {});
        io.emit('updateTeamDetails', {});
        io.emit('stopTimer');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});