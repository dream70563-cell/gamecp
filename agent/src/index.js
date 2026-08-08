const { spawn } = require("child_process");
const http = require("http");
const { WebSocketServer } = require("ws");


const fs=require("fs");
const path=require("path");
const express=require("express");
const multer=require("multer");

const upload = multer({
    dest: "/tmp/gamecp-uploads/",
    limits: {
        fileSize: 1024 * 1024 * 1024
    }
});

const BedrockProcess=require("./core/BedrockProcess");
const TunnelMonitor = require("./services/TunnelMonitor");
const PlayerParser = require("./parsers/PlayerParser");
const SystemMonitor = require("./services/SystemMonitor");
const ProcessFinder = require("./services/ProcessFinder");
const ActionService = require("./services/ActionService");
const WorldService = require("./services/WorldService");
const FileService = require("./services/FileService");
const BackupService = require("./services/BackupService");
const AddonService = require("./services/AddonService");
const healthRoute = require("./routes/health");
const statusRoute = require("./routes/status");
const filesRoute = require("./routes/files");
const worldsRoute = require("./routes/worlds");
const playersRoute = require("./routes/players");

const config=JSON.parse(
    fs.readFileSync(
        path.join(__dirname,"../config/config.json"),
        "utf8"
    )
);

// ===== WORLD CHAT HISTORY =====
const CHAT_HISTORY_FILE = path.join(__dirname, "../data/chat-history.json");
const CHAT_HISTORY_LIMIT = 500;

function loadChatHistory() {
    try {
        if (!fs.existsSync(CHAT_HISTORY_FILE)) {
            return [];
        }

        const data = JSON.parse(
            fs.readFileSync(CHAT_HISTORY_FILE, "utf8")
        );

        return Array.isArray(data)
            ? data.slice(-CHAT_HISTORY_LIMIT)
            : [];
    } catch (err) {
        console.error("[ChatHistory] Load failed:", err);
        return [];
    }
}

let chatHistory = loadChatHistory();

function saveChatHistory() {
    try {
        fs.mkdirSync(path.dirname(CHAT_HISTORY_FILE), {
            recursive: true
        });

        fs.writeFileSync(
            CHAT_HISTORY_FILE,
            JSON.stringify(chatHistory, null, 2),
            "utf8"
        );
    } catch (err) {
        console.error("[ChatHistory] Save failed:", err);
    }
}

function addChatHistory(chatData) {
    chatHistory.push(chatData);

    if (chatHistory.length > CHAT_HISTORY_LIMIT) {
        chatHistory = chatHistory.slice(-CHAT_HISTORY_LIMIT);
    }

    saveChatHistory();
}

const server=new BedrockProcess(config);
const worlds = new WorldService(config);
const files = new FileService(config);
const backups = new BackupService(config);
const addons = new AddonService(config);

const app=express();

app.use(express.json());

healthRoute(app, server);

statusRoute(
    app,
    server,
    SystemMonitor,
    TunnelMonitor,
    PlayerParser
);

filesRoute(app, files);

worldsRoute(app, worlds, server, upload);
playersRoute(app);






// ==============================
app.get("/backups/download",(req,res)=>{

    try {

        const backup = backups.createWorldBackup();

        res.download(
            backup.path,
            backup.filename,
            (err)=>{
                if(err){
                    console.error("[BACKUP DOWNLOAD]", err);
                }
            }
        );

    } catch(err) {

        console.error("[BACKUP]", err);

        if(!res.headersSent){
            res.status(500).json({
                success:false,
                error:err.message
            });
        }

    }

});

app.get("/addons",(req,res)=>{

    try {
        res.json(addons.listInstalled());
    } catch(err) {
        res.status(500).json({
            success:false,
            error:err.message
        });
    }

});

app.get("/addons/download",(req,res)=>{

    try{

        const file = addons.getAddonFile(
            req.query.uuid,
            req.query.type
        );

        res.download(file);

    }catch(err){

        res.status(404).json({
            success:false,
            error:err.message
        });

    }

});


app.post("/addons/delete",(req,res)=>{

    try {

        const result = addons.deleteAddon(
            req.body.uuid,
            req.body.type
        );

        res.json(result);

    } catch(err) {

        console.error("[ADDON DELETE]", err);

        res.status(400).json({
            success:false,
            error:err.message
        });

    }

});


app.post("/addons/import", upload.single("addon"), (req,res)=>{

    if(!req.file){
        return res.status(400).json({
            success:false,
            error:"No addon file uploaded"
        });
    }

    try {

        const result = addons.importAddon(
            req.file.path,
            req.file.originalname
        );

        res.json(result);

    } catch(err) {

        console.error("[ADDON IMPORT]", err);

        res.status(400).json({
            success:false,
            error:err.message
        });

    }

});

app.get("/console",(req,res)=>{
    res.json(server.console());
});

app.post("/start",(req,res)=>{
    const success = server.start();

    // Ensure Playit tunnel is running.
    // Agent and frontend are intentionally NOT restarted here.
    const { execSync } = require("child_process");

    try {
        execSync("pgrep -f playitd", {
            stdio: "ignore"
        });
    } catch {
        const playit = spawn(
            "/root/playitd",
            [],
            {
                cwd: "/root",
                detached: true,
                stdio: "ignore"
            }
        );

        playit.unref();
    }

    res.json({success});
});

app.post("/stop",(req,res)=>{
    res.json({success:server.stop()});
});

app.post("/restart",(req,res)=>{
    res.json({success:server.restart()});
});



app.post("/command",(req,res)=>{
    console.log("[HTTP] command:", req.body.command, "process:", server.process ? server.process.pid : null);
    res.json({
        success:server.send(req.body.command)
    });
});

app.post("/action",(req,res)=>{
    const result = ActionService.execute(server, req.body.action, req.body);
    res.json(result);
});

const httpServer = http.createServer(app);
const wss = new WebSocketServer({ server: httpServer });

function wsBroadcast(type,data){
    const msg=JSON.stringify({type,data});
    wss.clients.forEach(client=>{
        if(client.readyState===1){
            client.send(msg);
        }
    });
}



server.onConsole = (line)=>{
    // Semua output Bedrock tetap dikirim ke Console web.
    wsBroadcast("console", line);

    // Essentials Menu:
    // [Scripting] [WORLD_CHAT] PlayerName: message
    const chatMatch = line.match(/\[WORLD_CHAT\]\s+([^:]+):\s*(.*)/);

    if(chatMatch){
        const chatData = {
            player: chatMatch[1].trim(),
            message: chatMatch[2].trim(),
            timestamp: Date.now()
        };

        console.log("[WORLD CHAT EVENT]", chatData);
        addChatHistory(chatData);
        wsBroadcast("world_chat", chatData);
    }
};

httpServer.listen(8080,()=>{
wss.on("connection", async (ws)=>{
    console.log("[WS] Client connected");

    ws.send(JSON.stringify({
        type:"console_history",
        data:server.console()
    }));

    ws.send(JSON.stringify({
        type:"chat_history",
        data:chatHistory
    }));

    ws.send(JSON.stringify({
        type:"status",
        data:{
            ...server.status(),
            ...server.info(),
            bedrockVersion: server.version(),
            tunnel:TunnelMonitor.get(),
            players:PlayerParser.get(),
            system: await SystemMonitor.get(
                server.status().pid || ProcessFinder.findBedrock()
            ),
        }
    }));

    ws.on("message",(raw)=>{
        try{
            const msg=JSON.parse(raw.toString());

            switch(msg.type){

                case "command": {
                    const command = String(msg.data ?? "").trim();

                    server.send(command);

                    // Command "say ..." dari World Chat web juga
                    // dimasukkan ke kotak dialog World Chat.
                    const sayMatch = command.match(/^say\s+(.+)$/i);

                    if (sayMatch) {
                        const chatData = {
                            player: "SERVER",
                            message: sayMatch[1].trim(),
                            timestamp: Date.now()
                        };

                        console.log("[WORLD CHAT EVENT]", chatData);
                        addChatHistory(chatData);
                        wsBroadcast("world_chat", chatData);
                    }

                    break;
                }

                case "power":
                    if(msg.action==="start") server.start();
                    if(msg.action==="stop") server.stop();
                    if(msg.action==="restart") server.restart();
                    break;
            }

        }catch(err){
            console.error("[WS]",err);
        }
    });

    ws.on("close",()=>{
        console.log("[WS] Client disconnected");
    });
});

setInterval(async ()=>{
    const status=JSON.stringify({
        type:"status",
        data:{
            ...server.status(),
            ...server.info(),
            bedrockVersion: server.version(),
            tunnel:TunnelMonitor.get(),
            players:PlayerParser.get(),
            system: await SystemMonitor.get(
                server.status().pid || ProcessFinder.findBedrock()
            ),
        }
    });

    wss.clients.forEach(client=>{
        if(client.readyState===1){
            console.log("[WS STATUS]", status);

            client.send(status);
        }
    });
},1000);
    console.log("[Agent] HTTP + WebSocket Server running on :8080");
});
