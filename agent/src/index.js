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
const ActionService = require("./services/ActionService");
const WorldService = require("./services/WorldService");
const FileService = require("./services/FileService");
const BackupService = require("./services/BackupService");
const AddonService = require("./services/AddonService");
const healthRoute = require("./routes/health");
const statusRoute = require("./routes/status");

const config=JSON.parse(
    fs.readFileSync(
        path.join(__dirname,"../config/config.json"),
        "utf8"
    )
);

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






// ==============================
// FILE MANAGER
// ==============================

app.get("/files",(req,res)=>{
    const result = files.list(req.query.path || "");
    res.status(result.success ? 200 : 400).json(result);
});

app.get("/files/read",(req,res)=>{
    const result = files.read(req.query.path);

    res.status(result.success ? 200 : 400).json(result);
});

app.post("/files/save",(req,res)=>{
    const result = files.save(
        req.body.path,
        req.body.content
    );

    res.status(result.success ? 200 : 400).json(result);
});

app.post("/files/folder",(req,res)=>{
    const result = files.createFolder(
        req.body.path
    );

    res.status(result.success ? 200 : 400).json(result);
});

app.post("/files/delete",(req,res)=>{
    const result = files.delete(
        req.body.path
    );

    res.status(result.success ? 200 : 400).json(result);
});


app.get("/worlds",(req,res)=>{
    res.json(worlds.list());
});

app.post("/worlds/activate",(req,res)=>{

    const result = worlds.activate(req.body.world);

    if(result.success){
        server.restart();
    }

    res.json(result);

});


app.delete("/worlds/:world",(req,res)=>{
    const result = worlds.deleteWorld(req.params.world);

    res.status(result.success ? 200 : 400).json(result);
});

app.post("/worlds/import", upload.single("world"), (req,res)=>{

    if(!req.file){
        return res.status(400).json({
            success:false,
            error:"No world file uploaded"
        });
    }

    const result = worlds.importWorld(
        req.file.path,
        req.file.originalname
    );

    if(!result.success){
        return res.status(400).json(result);
    }

    res.json(result);
});

app.post("/worlds/create",(req,res)=>{

    const result = worlds.create(req.body.world);

    res.json(result);

});

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
    res.json({success:server.start()});
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
    wsBroadcast("console", line);
};

httpServer.listen(8080,()=>{
wss.on("connection", async (ws)=>{
    console.log("[WS] Client connected");

    ws.send(JSON.stringify({
        type:"console_history",
        data:server.console()
    }));

    ws.send(JSON.stringify({
        type:"status",
        data:{
            ...server.status(),
            ...server.info(),
            tunnel:TunnelMonitor.get(),
            players:PlayerParser.get(),
            system: await SystemMonitor.get(server.status().pid),
        }
    }));

    ws.on("message",(raw)=>{
        try{
            const msg=JSON.parse(raw.toString());

            switch(msg.type){

                case "command":
                    server.send(msg.data);
                    break;

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
            tunnel:TunnelMonitor.get(),
            players:PlayerParser.get(),
            system: await SystemMonitor.get(server.status().pid),
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
