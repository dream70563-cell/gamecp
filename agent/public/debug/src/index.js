const http = require("http");
const { WebSocketServer } = require("ws");


const fs=require("fs");
const path=require("path");
const express=require("express");

const BedrockProcess=require("./core/BedrockProcess");
const TunnelMonitor = require("./services/TunnelMonitor");
const PlayerParser = require("./parsers/PlayerParser");
const SystemMonitor = require("./services/SystemMonitor");
const ActionService = require("./services/ActionService");

const config=JSON.parse(
    fs.readFileSync(
        path.join(__dirname,"../config/config.json"),
        "utf8"
    )
);

const server=new BedrockProcess(config);

const app=express();

app.use(express.json());

app.get("/health",(req,res)=>{
    res.json({
        status:"online",
        ...server.status()
    });
});

app.get("/status", async (req,res)=>{

    const system = await SystemMonitor.get(server.status().pid);
    const tunnel = TunnelMonitor.get();

    res.json({
        ...server.status(),
        ...server.info(),
        tunnel,
        players: PlayerParser.get(),
        system
    });

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
