// ======================================================
// LATAM BATTLE PRO - SERVER
// ======================================================

const express = require("express");

const http = require("http");

const { Server } = require("socket.io");

const {
    WebcastPushConnection
} = require("tiktok-live-connector");


// ======================================================
// APP
// ======================================================

const app = express();

const server = http.createServer(app);

const io = new Server(server,{

    cors:{
        origin:"*"
    }

});


// ======================================================
// PUBLIC HTML
// ======================================================

app.use(
    express.static(__dirname)
);


// ======================================================
// TIKTOK LIVE
// ======================================================

let tiktokLive = null;


// ======================================================
// SOCKET
// ======================================================

io.on("connection",(socket)=>{

    console.log("✅ Usuario conectado");


    // ==================================================
    // CONECTAR LIVE
    // ==================================================

    socket.on("connectLive",async(data)=>{

        try{

            const username =
            data.username
            .replace("@","");

            console.log(
                "🔴 Conectando a:",
                username
            );

            // DESCONECTAR ANTERIOR

            if(tiktokLive){

                try{

                    tiktokLive.disconnect();

                }catch(err){}

            }

            // NUEVA CONEXION

            tiktokLive =
            new WebcastPushConnection(
                username
            );

            // CONECTAR

            await tiktokLive.connect();

            console.log(
                "✅ LIVE CONECTADO"
            );

            io.emit("status",{

                connected:true,
                username

            });


            // ==========================================
            // CHAT
            // ==========================================

            tiktokLive.on(
                "chat",
                data=>{

                console.log(
                    `💬 ${data.nickname}: ${data.comment}`
                );

                io.emit("chat",{

                    user:data.nickname,
                    message:data.comment

                });

            });


            // ==========================================
            // GIFTS
            // ==========================================

            tiktokLive.on(
                "gift",
                data=>{

                const giftName =
                data.giftName;

                const diamonds =
                data.diamondCount;

                console.log(
                    `🎁 ${giftName} (${diamonds})`
                );

                // SOLO GIFTS 1 MONEDA

                if(diamonds === 1){

                    io.emit("gift",{

                        name:giftName,
                        coins:diamonds,
                        user:data.nickname

                    });

                }

            });


            // ==========================================
            // LIKES
            // ==========================================

            tiktokLive.on(
                "like",
                data=>{

                console.log(
                    `❤️ ${data.nickname} likes`
                );

            });


            // ==========================================
            // SHARE
            // ==========================================

            tiktokLive.on(
                "share",
                data=>{

                console.log(
                    `📤 ${data.nickname} compartió`
                );

            });


            // ==========================================
            // FOLLOW
            // ==========================================

            tiktokLive.on(
                "follow",
                data=>{

                console.log(
                    `⭐ Nuevo follow`
                );

            });


            // ==========================================
            // ERROR
            // ==========================================

            tiktokLive.on(
                "error",
                err=>{

                console.log(
                    "❌ ERROR:",
                    err
                );

                io.emit("status",{

                    connected:false

                });

            });


            // ==========================================
            // DESCONECTADO
            // ==========================================

            tiktokLive.on(
                "disconnected",
                ()=>{

                console.log(
                    "❌ LIVE DESCONECTADO"
                );

                io.emit("status",{

                    connected:false

                });

            });

        }catch(err){

            console.log(err);

            socket.emit("status",{

                connected:false,
                error:true

            });

        }

    });


    // ==================================================
    // DESCONECTAR
    // ==================================================

    socket.on(
        "disconnect",
        ()=>{

        console.log(
            "❌ Usuario desconectado"
        );

    });

});


// ======================================================
// START
// ======================================================

const PORT = 3000;

server.listen(PORT,()=>{

    console.log(`
    
🌎 LATAM BATTLE PRO

✅ SERVER:
http://localhost:${PORT}

    `);

});
