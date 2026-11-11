import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import * as TikTokModule from 'tiktok-live-connector';

const app = express();
const server = createServer(app);
const io = new Server(server);

// ดึงคลาสเชื่อมต่ออัตโนมัติ ไม่ว่าตัวแพ็กเกจจะส่งออกชื่ออะไรมา
const ConnectorClass = TikTokModule.WebcastPushConnection || 
                       TikTokModule.TikTokLiveConnection || 
                       TikTokModule.default || 
                       TikTokModule;

// ⚠️ ชื่อไอดี TikTok ของคุณ
const tiktokUsername = "inamianaorigins"; 

// สร้างตัวเชื่อมต่อพร้อม Option
const tiktokLiveConnection = new ConnectorClass(tiktokUsername, {
    processInitialData: false,
    enableExtendedGiftInfo: true
});

app.use(express.static('public'));

// เมื่อเชื่อมต่อสำเร็จ
tiktokLiveConnection.connect().then(state => {
    console.log(`[ SUCCESS ] เชื่อมต่อห้องไลฟ์สำเร็จแล้ว! (Room ID: ${state?.roomId || 'Connected'})`);
}).catch(err => {
    console.log('[ NOTE ] ระบบพร้อมทำงานแล้ว (จะเชื่อมต่อสำเร็จเมื่อเปิดไลฟ์จริง)');
});

// ดักจับเมื่อมีคนส่งของขวัญ
tiktokLiveConnection.on('gift', data => {
    // กรองและส่งข้อมูลของขวัญไปให้หน้าเว็บ
    if (data.repeatEnd || data.giftType !== 1) {
        console.log(`${data.uniqueId} ส่งของขวัญ: ${data.giftName}`);
        io.emit('new_gift', {
            username: data.uniqueId,
            avatarUrl: data.profilePictureUrl,
            giftName: data.giftName  // 👈 เพิ่มการส่งชื่อของขวัญ
        });
    }
});

// รองรับพอร์ตจาก Cloud (Render) หรือพอร์ต 3000 เดิม
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('------------------------------------');
    console.log(`เปิดเบราว์เซอร์ไปที่: http://localhost:${PORT}`);
    console.log('------------------------------------');
});