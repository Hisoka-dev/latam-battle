const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const {
WebcastPushConnection
} = require("tiktok-live-connector");


// =====================================================
// APP
// =====================================================

const app = express();

const server = http.createServer(app);

const io = new Server(server,{

    cors:{
        origin:"*"
    }

});

app.use(
    express.static(__dirname)
);


// =====================================================
// ROOMS
// =====================================================

const rooms = {};


// =====================================================
// SOCKET
// =====================================================

io.on("connection",(socket)=>{

    console.log("🌐 WEB CONECTADA");


    // =================================================
    // CONNECT LIVE
    // =================================================

    socket.on("connectLive", async(data)=>{

        try{

            // =========================================
            // USERNAME
            // =========================================

            const username =
            data.username
            .replace("@","")
            .trim()
            .toLowerCase();

            if(!username){

                socket.emit("status",{

                    ok:false,
                    message:"Usuario inválido"

                });

                return;

            }

            // =========================================
            // ROOM ID
            // =========================================

            const roomId = username;

            socket.join(roomId);

            console.log(`
            
====================================
🔴 NUEVO STREAMER
👤 ${username}
🏠 ROOM: ${roomId}
====================================

            `);

            // =========================================
            // ROOM EXISTE
            // =========================================

            if(rooms[roomId]){

                console.log(
                    "⚠️ ROOM YA ACTIVA"
                );

                socket.emit("status",{

                    ok:true,
                    reused:true,
                    roomId,
                    username,
                    message:"Reconectado"

                });

                return;

            }

            // =========================================
            // CREAR LIVE
            // =========================================

            const tiktokLive =
            new WebcastPushConnection(
                username
            );

            // =========================================
            // GUARDAR ROOM
            // =========================================

            rooms[roomId] = {

                roomId,
                username,
                tiktokLive

            };

            // =========================================
            // CONECTAR TIKTOK
            // =========================================

            console.log(
                "🧪 PROBANDO LIVE..."
            );

            await tiktokLive.connect();

            console.log(`
            
✅ TIKTOK CONECTADO
👤 ${username}

            `);

            // =========================================
            // STATUS OK
            // =========================================

            io.to(roomId).emit("status",{

                ok:true,
                roomId,
                username,
                message:"TikTok conectado"

            });

            // =========================================
            // TEST SOCKET
            // =========================================

            io.to(roomId).emit("gift",{

                name:"Rose",
                test:true

            });

            console.log(`
            
✅ TEST GIFT ENVIADO
🏠 ${roomId}

            `);


            // =========================================
            // GIFTS
            // =========================================

            tiktokLive.on(
                "gift",
                (data)=>{

                try{

                    console.log(`
                    
🎁 GIFT DETECTADO
👤 ${data.nickname}

                    `);

                    const giftName =

                    data.giftName ||

                    data.extendedGiftInfo?.name ||

                    "Unknown";

                    const diamonds =
                    data.diamondCount || 0;

                    console.log(`
                    
🎁 REGALO:
${giftName}

💰 MONEDAS:
${diamonds}

                    `);

                    // =================================
                    // ENVIAR SOLO A SU ROOM
                    // =================================

                    io.to(roomId).emit("gift",{

                        roomId,
                        user:data.nickname,
                        name:giftName,
                        coins:diamonds

                    });

                    console.log(`
                    
✅ GIFT ENVIADO
🏠 ${roomId}

                    `);

                }catch(err){

                    console.log(`
                    
❌ ERROR GIFT
                    
                    `);

                    console.log(err);

                }

            });


            // =========================================
            // CHAT
            // =========================================

            tiktokLive.on(
                "chat",
                (data)=>{

                console.log(`
                
💬 CHAT
👤 ${data.nickname}
📝 ${data.comment}

                `);

            });


            // =========================================
            // FOLLOW
            // =========================================

            tiktokLive.on(
                "follow",
                (data)=>{

                console.log(`
                
⭐ FOLLOW
👤 ${data.nickname}

                `);

            });


            // =========================================
            // SHARE
            // =========================================

            tiktokLive.on(
                "share",
                (data)=>{

                console.log(`
                
📤 SHARE
👤 ${data.nickname}

                `);

            });


            // =========================================
            // LIKE
            // =========================================

            tiktokLive.on(
                "like",
                (data)=>{

                console.log(`
                
❤️ LIKE
👤 ${data.nickname}

                `);

            });


            // =========================================
            // ERROR
            // =========================================

            tiktokLive.on(
                "error",
                (err)=>{

                console.log(`
                
❌ ERROR TIKTOK
🏠 ${roomId}

                `);

                console.log(err);

                io.to(roomId).emit("status",{

                    ok:false,
                    roomId,
                    message:"Error TikTok"

                });

            });


            // =========================================
            // DESCONECTADO
            // =========================================

            tiktokLive.on(
                "disconnected",
                ()=>{

                console.log(`
                
❌ LIVE DESCONECTADO
🏠 ${roomId}

                `);

                io.to(roomId).emit("status",{

                    ok:false,
                    roomId,
                    message:"Live desconectado"

                });

                delete rooms[roomId];

                console.log(`
                
🗑️ ROOM ELIMINADA
🏠 ${roomId}

                `);

            });

        }catch(err){

            console.log(`
            
❌ ERROR CONNECT LIVE
            
            `);

            console.log(err);

            socket.emit("status",{

                ok:false,
                message:"No se pudo conectar"

            });

        }

    });


    // =================================================
    // DISCONNECT WEB
    // =================================================

    socket.on(
        "disconnect",
        ()=>{

        console.log(
            "❌ WEB DESCONECTADA"
        );

    });

});


// =====================================================
// SERVER
// =====================================================

const PORT =
process.env.PORT || 3000;

server.listen(PORT,()=>{

    console.log(`
    
====================================
🌎 LATAM BATTLE PRO
====================================

✅ SERVER ONLINE
🚀 PORT: ${PORT}

====================================

    `);

});