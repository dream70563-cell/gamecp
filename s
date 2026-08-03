[1mdiff --git a/agent/data/bedrock-state.json b/agent/data/bedrock-state.json[m
[1mindex f474773..6415c40 100644[m
[1m--- a/agent/data/bedrock-state.json[m
[1m+++ b/agent/data/bedrock-state.json[m
[36m@@ -1,5 +1,5 @@[m
 {[m
[31m-  "world": "Dream70563_Server",[m
[32m+[m[32m  "world": "TestWorld",[m
   "gamemode": "survival",[m
   "difficulty": "easy",[m
   "online": true[m
[1mdiff --git a/agent/src/core/BedrockProcess.js b/agent/src/core/BedrockProcess.js[m
[1mindex e17d17b..667f090 100644[m
[1m--- a/agent/src/core/BedrockProcess.js[m
[1m+++ b/agent/src/core/BedrockProcess.js[m
[36m@@ -73,6 +73,8 @@[m [mclass BedrockProcess {[m
 [m
             const line=data.toString();[m
 [m
[32m+[m
[32m+[m
             process.stdout.write(line);[m
             ConsoleBuffer.add(data);[m
             BedrockLogParser.parse(line);[m
[36m@@ -80,6 +82,11 @@[m [mclass BedrockProcess {[m
 [m
             this.logs.push(line);[m
 [m
[32m+[m[32m            if(this.onConsole){[m
[32m+[m[32m                this.onConsole(line);[m
[32m+[m[32m            }[m
[32m+[m
[32m+[m
             if(this.logs.length>1000){[m
                 this.logs.shift();[m
             }[m
[36m@@ -90,6 +97,8 @@[m [mclass BedrockProcess {[m
 [m
             const line=data.toString();[m
 [m
[32m+[m
[32m+[m
             process.stderr.write(line);[m
             ConsoleBuffer.add(data);[m
             BedrockLogParser.parse(line);[m
[36m@@ -97,6 +106,11 @@[m [mclass BedrockProcess {[m
 [m
             this.logs.push(line);[m
 [m
[32m+[m[32m            if(this.onConsole){[m
[32m+[m[32m                this.onConsole(line);[m
[32m+[m[32m            }[m
[32m+[m
[32m+[m
             if(this.logs.length>1000){[m
                 this.logs.shift();[m
             }[m
[1mdiff --git a/agent/src/index.js b/agent/src/index.js[m
[1mindex c41807a..01c794b 100644[m
[1m--- a/agent/src/index.js[m
[1m+++ b/agent/src/index.js[m
[36m@@ -1,3 +1,7 @@[m
[32m+[m[32mconst http = require("http");[m
[32m+[m[32mconst { WebSocketServer } = require("ws");[m
[32m+[m
[32m+[m
 const fs=require("fs");[m
 const path=require("path");[m
 const express=require("express");[m
[36m@@ -7,6 +11,7 @@[m [mconst TunnelMonitor = require("./services/TunnelMonitor");[m
 const PlayerParser = require("./parsers/PlayerParser");[m
 const SystemMonitor = require("./services/SystemMonitor");[m
 const ActionService = require("./services/ActionService");[m
[32m+[m[32mconst WorldService = require("./services/WorldService");[m
 [m
 const config=JSON.parse([m
     fs.readFileSync([m
[36m@@ -16,6 +21,7 @@[m [mconst config=JSON.parse([m
 );[m
 [m
 const server=new BedrockProcess(config);[m
[32m+[m[32mconst worlds = new WorldService(config);[m
 [m
 const app=express();[m
 [m
[36m@@ -45,6 +51,30 @@[m [mapp.get("/status", async (req,res)=>{[m
 [m
 [m
 [m
[32m+[m[32mapp.get("/worlds",(req,res)=>{[m
[32m+[m[32m    res.json(worlds.list());[m
[32m+[m[32m});[m
[32m+[m
[32m+[m[32mapp.post("/worlds/activate",(req,res)=>{[m
[32m+[m
[32m+[m[32m    const result = worlds.activate(req.body.world);[m
[32m+[m
[32m+[m[32m    if(result.success){[m
[32m+[m[32m        server.restart();[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    res.json(result);[m
[32m+[m
[32m+[m[32m});[m
[32m+[m
[32m+[m[32mapp.post("/worlds/create",(req,res)=>{[m
[32m+[m
[32m+[m[32m    const result = worlds.create(req.body.world);[m
[32m+[m
[32m+[m[32m    res.json(result);[m
[32m+[m
[32m+[m[32m});[m
[32m+[m
 app.get("/console",(req,res)=>{[m
     res.json(server.console());[m
 });[m
[36m@@ -75,6 +105,90 @@[m [mapp.post("/action",(req,res)=>{[m
     res.json(result);[m
 });[m
 [m
[31m-app.listen(8080,()=>{[m
[31m-    console.log("[Agent] HTTP Server running on :8080");[m
[32m+[m[32mconst httpServer = http.createServer(app);[m
[32m+[m[32mconst wss = new WebSocketServer({ server: httpServer });[m
[32m+[m
[32m+[m[32mfunction wsBroadcast(type,data){[m
[32m+[m[32m    const msg=JSON.stringify({type,data});[m
[32m+[m[32m    wss.clients.forEach(client=>{[m
[32m+[m[32m        if(client.readyState===1){[m
[32m+[m[32m            client.send(msg);[m
[32m+[m[32m        }[m
[32m+[m[32m    });[m
[32m+[m[32m}[m
[32m+[m
[32m+[m
[32m+[m
[32m+[m[32mserver.onConsole = (line)=>{[m
[32m+[m[32m    wsBroadcast("console", line);[m
[32m+[m[32m};[m
[32m+[m
[32m+[m[32mhttpServer.listen(8080,()=>{[m
[32m+[m[32mwss.on("connection", async (ws)=>{[m
[32m+[m[32m    console.log("[WS] Client connected");[m
[32m+[m
[32m+[m[32m    ws.send(JSON.stringify({[m
[32m+[m[32m        type:"console_history",[m
[32m+[m[32m        data:server.console()[m
[32m+[m[32m    }));[m
[32m+[m
[32m+[m[32m    ws.send(JSON.stringify({[m
[32m+[m[32m        type:"status",[m
[32m+[m[32m        data:{[m
[32m+[m[32m            ...server.status(),[m
[32m+[m[32m            ...server.info(),[m
[32m+[m[32m            tunnel:TunnelMonitor.get(),[m
[32m+[m[32m            players:PlayerParser.get(),[m
[32m+[m[32m            system: await SystemMonitor.get(server.status().pid),[m
[32m+[m[32m        }[m
[32m+[m[32m    }));[m
[32m+[m
[32m+[m[32m    ws.on("message",(raw)=>{[m
[32m+[m[32m        try{[m
[32m+[m[32m            const msg=JSON.parse(raw.toString());[m
[32m+[m
[32m+[m[32m            switch(msg.type){[m
[32m+[m
[32m+[m[32m                case "command":[m
[32m+[m[32m                    server.send(msg.data);[m
[32m+[m[32m                    break;[m
[32m+[m
[32m+[m[32m                case "power":[m
[32m+[m[32m                    if(msg.action==="start") server.start();[m
[32m+[m[32m                    if(msg.action==="stop") server.stop();[m
[32m+[m[32m                    if(msg.action==="restart") server.restart();[m
[32m+[m[32m                    break;[m
[32m+[m[32m            }[m
[32m+[m
[32m+[m[32m        }catch(err){[m
[32m+[m[32m            console.error("[WS]",err);[m
[32m+[m[32m        }[m
[32m+[m[32m    });[m
[32m+[m
[32m+[m[32m    ws.on("close",()=>{[m
[32m+[m[32m        console.log("[WS] Client disconnected");[m
[32m+[m[32m    });[m
[32m+[m[32m});[m
[32m+[m
[32m+[m[32msetInterval(async ()=>{[m
[32m+[m[32m    const status=JSON.stringify({[m
[32m+[m[32m        type:"status",[m
[32m+[m[32m        data:{[m
[32m+[m[32m            ...server.status(),[m
[32m+[m[32m            ...server.info(),[m
[32m+[m[32m            tunnel:TunnelMonitor.get(),[m
[32m+[m[32m            players:PlayerParser.get(),[m
[32m+[m[32m            system: await SystemMonitor.get(server.status().pid),[m
[32m+[m[32m        }[m
[32m+[m[32m    });[m
[32m+[m
[32m+[m[32m    wss.clients.forEach(client=>{[m
[32m+[m[32m        if(client.readyState===1){[m
[32m+[m[32m            console.log("[WS STATUS]", status);[m
[32m+[m
[32m+[m[32m            client.send(status);[m
[32m+[m[32m        }[m
[32m+[m[32m    });[m
[32m+[m[32m},1000);[m
[32m+[m[32m    console.log("[Agent] HTTP + WebSocket Server running on :8080");[m
 });[m
[1mdiff --git a/agent/src/parsers/BedrockLogParser.js b/agent/src/parsers/BedrockLogParser.js[m
[1mindex 48c9245..90bfb10 100644[m
[1m--- a/agent/src/parsers/BedrockLogParser.js[m
[1m+++ b/agent/src/parsers/BedrockLogParser.js[m
[36m@@ -31,8 +31,9 @@[m [mclass BedrockLogParser {[m
 [m
         if(line.includes("Level Name:")){[m
 [m
[31m-            this.data.world =[m
[31m-                line.split("Level Name:")[1][m
[32m+[m[32m            this.data.world = line[m
[32m+[m[32m                .split("Level Name:")[1][m
[32m+[m[32m                .split("\n")[0][m
                 .trim();[m
 [m
         }[m
[1mdiff --git a/agent/src/services/ActionService.js b/agent/src/services/ActionService.js[m
[1mindex f877419..331c3d9 100644[m
[1m--- a/agent/src/services/ActionService.js[m
[1m+++ b/agent/src/services/ActionService.js[m
[36m@@ -26,6 +26,19 @@[m [mclass ActionService {[m
                 command = `tp "${data.player}" ${data.target || data.coordinates}`;[m
                 break;[m
 [m
[32m+[m
[32m+[m[32m            case "save":[m
[32m+[m[32m                command = "save hold";[m
[32m+[m[32m                break;[m
[32m+[m
[32m+[m[32m            case "saveResume":[m
[32m+[m[32m                command = "save resume";[m
[32m+[m[32m                break;[m
[32m+[m
[32m+[m[32m            case "saveAll":[m
[32m+[m[32m                command = "save-all";[m
[32m+[m[32m                break;[m
[32m+[m
             default:[m
                 return {[m
                     success: false,[m
[1mdiff --git a/agent/src/services/ProcessFinder.js b/agent/src/services/ProcessFinder.js[m
[1mindex c3112ca..1d67500 100644[m
[1m--- a/agent/src/services/ProcessFinder.js[m
[1m+++ b/agent/src/services/ProcessFinder.js[m
[36m@@ -7,7 +7,7 @@[m [mclass ProcessFinder {[m
         try{[m
 [m
             const result = execSync([m
[31m-                "pgrep -f 'bedrock_server'",[m
[32m+[m[32m                "pgrep -af 'box64.*bedrock_server|bedrock_server'",[m
                 {[m
                     encoding:"utf8"[m
                 }[m
[36m@@ -19,8 +19,18 @@[m [mclass ProcessFinder {[m
             }[m
 [m
 [m
[32m+[m[32m            const line = result[m
[32m+[m[32m                .split("\n")[m
[32m+[m[32m                .find(row => row.includes("bedrock_server") || row.includes("box64"));[m
[32m+[m
[32m+[m
[32m+[m[32m            if(!line){[m
[32m+[m[32m                return null;[m
[32m+[m[32m            }[m
[32m+[m
[32m+[m
             return Number([m
[31m-                result.split("\n")[0][m
[32m+[m[32m                line.split(" ")[0][m
             );[m
 [m
 [m
[1mdiff --git a/agent/src/services/SystemMonitor.js b/agent/src/services/SystemMonitor.js[m
[1mindex b48a7aa..9cd4635 100644[m
[1m--- a/agent/src/services/SystemMonitor.js[m
[1m+++ b/agent/src/services/SystemMonitor.js[m
[36m@@ -11,42 +11,69 @@[m [mclass SystemMonitor {[m
                 running:false,[m
                 pid:null,[m
                 cpu:0,[m
[31m-                ramMB:0[m
[32m+[m[32m                ramMB:0,[m
[32m+[m[32m                totalRamMB:0,[m
[32m+[m[32m                ramPercent:0[m
             };[m
 [m
         }[m
 [m
[31m-[m
         try{[m
 [m
             const stat = await pidusage(pid);[m
 [m
[32m+[m[32m            const cpu = Number([m
[32m+[m[32m                ([m
[32m+[m[32m                    parseFloat([m
[32m+[m[32m                        execSync(`ps -p ${pid} -o %cpu=`)[m
[32m+[m[32m                            .toString()[m
[32m+[m[32m                            .trim()[m
[32m+[m[32m                    ) || 0[m
[32m+[m[32m                ).toFixed(1)[m
[32m+[m[32m            );[m
[32m+[m
[32m+[m[32m            const ramMB = Number([m
[32m+[m[32m                (stat.memory / 1024 / 1024).toFixed(1)[m
[32m+[m[32m            );[m
[32m+[m
[32m+[m[32m            const meminfo = execSync("grep MemTotal /proc/meminfo")[m
[32m+[m[32m                .toString()[m
[32m+[m[32m                .trim();[m
[32m+[m
[32m+[m[32m            const totalRamMB = Number([m
[32m+[m[32m                ([m
[32m+[m[32m                    parseInt(meminfo.split(/\s+/)[1],10)[m
[32m+[m[32m                    /1024[m
[32m+[m[32m                ).toFixed(1)[m
[32m+[m[32m            );[m
[32m+[m
[32m+[m[32m            const ramPercent = Number([m
[32m+[m[32m                ([m
[32m+[m[32m                    ramMB / totalRamMB * 100[m
[32m+[m[32m                ).toFixed(1)[m
[32m+[m[32m            );[m
[32m+[m
             return {[m
 [m
                 running:true,[m
[31m-[m
[31m-                pid:pid,[m
[31m-                  cpu:Number((parseFloat(execSync(`ps -p ${pid} -o %cpu=`).toString().trim()) || 0).toFixed(1)),[m
[31m-[m
[31m-                ramMB:Number([m
[31m-                    (stat.memory / 1024 / 1024)[m
[31m-                    .toFixed(1)[m
[31m-                )[m
[32m+[m[32m                pid,[m
[32m+[m[32m                cpu,[m
[32m+[m[32m                ramMB,[m
[32m+[m[32m                totalRamMB,[m
[32m+[m[32m                ramPercent[m
 [m
             };[m
 [m
[31m-[m
         }catch(err){[m
 [m
             return {[m
 [m
                 running:false,[m
[31m-[m
                 pid:null,[m
[31m-[m
                 cpu:0,[m
[31m-[m
[31m-                ramMB:0[m
[32m+[m[32m                ramMB:0,[m
[32m+[m[32m                totalRamMB:0,[m
[32m+[m[32m                ramPercent:0[m
 [m
             };[m
 [m
[1mdiff --git a/frontend/package.json b/frontend/package.json[m
[1mindex 753f6e1..3ecfb9f 100644[m
[1m--- a/frontend/package.json[m
[1m+++ b/frontend/package.json[m
[36m@@ -4,7 +4,7 @@[m
   "version": "0.0.0",[m
   "type": "module",[m
   "scripts": {[m
[31m-    "dev": "vite",[m
[32m+[m[32m    "dev": "vite --host 0.0.0.0",[m
     "build": "vite build",[m
     "lint": "eslint .",[m
     "preview": "vite preview"[m
[1mdiff --git a/frontend/src/App.jsx b/frontend/src/App.jsx[m
[1mindex ed68b14..3a527f8 100644[m
[1m--- a/frontend/src/App.jsx[m
[1m+++ b/frontend/src/App.jsx[m
[36m@@ -4,6 +4,7 @@[m [mimport { MainLayout } from './components/layout/MainLayout';[m
 import { DashboardPage } from './pages/DashboardPage';[m
 import { ConsolePage } from './pages/ConsolePage';[m
 import { PlayersPage } from './pages/PlayersPage';[m
[32m+[m[32mimport { WorldsPage } from './pages/WorldsPage';[m
 import { FilesPage } from './pages/FilesPage';[m
 import { SettingsPage } from './pages/SettingsPage';[m
 import { ActionsPage } from './pages/ActionsPage';[m
[36m@@ -55,6 +56,7 @@[m [mexport default function App() {[m
             />[m
           } [m
         />[m
[32m+[m[32m        <Route path="/worlds" element={<WorldsPage />} />[m
         <Route path="/files" element={<FilesPage />} />[m
         <Route path="/settings" element={<SettingsPage />} />[m
         <Route path="/actions" element={<ActionsPage />} />[m
[1mdiff --git a/frontend/src/api.js b/frontend/src/api.js[m
[1mindex 6f0fac5..e2a8ac5 100644[m
[1m--- a/frontend/src/api.js[m
[1m+++ b/frontend/src/api.js[m
[36m@@ -23,6 +23,7 @@[m [mexport async function getServerHealth() {[m
             : "OFFLINE",[m
 [m
         system:{[m
[32m+[m[32m            ...data.system,[m
             usedRamMB: data.system?.ramMB ?? 0,[m
             totalRamMB: "-",[m
             diskUsedGB: "-",[m
[1mdiff --git a/frontend/src/components/layout/Sidebar.jsx b/frontend/src/components/layout/Sidebar.jsx[m
[1mindex c72e067..3ce990a 100644[m
[1m--- a/frontend/src/components/layout/Sidebar.jsx[m
[1m+++ b/frontend/src/components/layout/Sidebar.jsx[m
[36m@@ -1,11 +1,12 @@[m
 import { NavLink } from 'react-router-dom';[m
[31m-import { [m
[31m-  LayoutDashboard, [m
[31m-  Terminal, [m
[31m-  Users, [m
[31m-  FolderTree, [m
[31m-  Sliders, [m
[31m-  Save, [m
[32m+[m[32mimport {[m
[32m+[m[32m  LayoutDashboard,[m
[32m+[m[32m  Terminal,[m
[32m+[m[32m  Users,[m
[32m+[m[32m  Globe,[m
[32m+[m[32m  FolderTree,[m
[32m+[m[32m  Sliders,[m
[32m+[m[32m  Save,[m
   Box,[m
   ShieldCheck[m
 } from 'lucide-react';[m
[36m@@ -19,6 +20,7 @@[m [mexport function Sidebar({ status }) {[m
     { to: '/', label: 'Dashboard', icon: LayoutDashboard },[m
     { to: '/console', label: 'Console', icon: Terminal },[m
     { to: '/players', label: 'Players', icon: Users, badge: isOnline ? `${playerCount}/${maxPlayers}` : null },[m
[32m+[m[32m    { to: '/worlds', label: 'Worlds', icon: Globe },[m
     { to: '/files', label: 'File Manager', icon: FolderTree },[m
     { to: '/settings', label: 'Server Settings', icon: Sliders },[m
     { to: '/actions', label: 'Backups & Saves', icon: Save },[m
[36m@@ -37,7 +39,6 @@[m [mexport function Sidebar({ status }) {[m
         </div>[m
       </div>[m
 [m
[31m-      {/* Navigation Links */}[m
       <nav className="flex-1 px-3 py-4 space-y-1">[m
         {navItems.map((item) => {[m
           const Icon = item.icon;[m
[36m@@ -58,6 +59,7 @@[m [mexport function Sidebar({ status }) {[m
                 <Icon className="w-4 h-4" />[m
                 <span>{item.label}</span>[m
               </div>[m
[32m+[m
               {item.badge && ([m
                 <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded-full bg-slate-800 text-blue-400 border border-slate-700">[m
                   {item.badge}[m
[36m@@ -68,13 +70,14 @@[m [mexport function Sidebar({ status }) {[m
         })}[m
       </nav>[m
 [m
[31m-      {/* Footer Info Card */}[m
       <div className="p-4 border-t border-slate-800/80 m-3 rounded-xl bg-slate-900/50 border border-slate-800">[m
         <div className="flex items-center gap-2 text-xs font-medium text-slate-300">[m
           <ShieldCheck className="w-4 h-4 text-emerald-400" />[m
           <span>Pterodactyl Engine</span>[m
         </div>[m
[31m-        <p className="text-[11px] text-slate-500 mt-1">Single source of truth REST & WebSocket backend.</p>[m
[32m+[m[32m        <p className="text-[11px] text-slate-500 mt-1">[m
[32m+[m[32m          Single source of truth REST & WebSocket backend.[m
[32m+[m[32m        </p>[m
       </div>[m
     </aside>[m
   );[m
[1mdiff --git a/frontend/src/hooks/useWebSocket.js b/frontend/src/hooks/useWebSocket.js[m
[1mindex 684486a..df20250 100644[m
[1m--- a/frontend/src/hooks/useWebSocket.js[m
[1m+++ b/frontend/src/hooks/useWebSocket.js[m
[36m@@ -21,6 +21,8 @@[m [mexport function useWebSocket() {[m
     });[m
 [m
     const unsubscribeStatus = gameCPWS.onStatus((newStatus) => {[m
[32m+[m[32m      console.log("\[FRONTEND STATUS\]", JSON.stringify(newStatus, null, 2));[m
[32m+[m
       setStatus(newStatus);[m
     });[m
 [m
[1mdiff --git a/frontend/src/pages/DashboardPage.jsx b/frontend/src/pages/DashboardPage.jsx[m
[1mindex 89c9506..02f282d 100644[m
[1m--- a/frontend/src/pages/DashboardPage.jsx[m
[1m+++ b/frontend/src/pages/DashboardPage.jsx[m
[36m@@ -19,6 +19,8 @@[m [mexport function DashboardPage({ status, sendPower, sendAction, logs, onNavigateC[m
   const isOnline = status?.running ?? false;[m
   const cpu = status?.system?.cpu ?? 0;[m
   const ram = status?.system?.ramMB ?? 0;[m
[32m+[m[32m  const totalRam = status?.system?.totalRamMB ?? 0;[m
[32m+[m[32m  const ramPercent = status?.system?.ramPercent ?? 0;[m
   const uptimeSeconds = status?.uptime ?? 0;[m
 [m
   const formatUptime = (totalSeconds) => {[m
[36m@@ -110,11 +112,11 @@[m [mexport function DashboardPage({ status, sendPower, sendAction, logs, onNavigateC[m
             </div>[m
           </div>[m
           <div className="mt-4">[m
[31m-            <div className="text-2xl font-bold font-mono text-slate-100">{ram} MB</div>[m
[32m+[m[32m            <div className="text-2xl font-bold font-mono text-slate-100">{ram} / {totalRam} MB</div>[m
             <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">[m
               <div [m
                 className="bg-purple-500 h-full rounded-full transition-all duration-500" [m
[31m-                style={{ width: `${Math.min((ram / 4096) * 100, 100)}%` }}[m
[32m+[m[32m                style={{ width: `${Math.min(ramPercent, 100)}%` }}[m
               ></div>[m
             </div>[m
           </div>[m
[1mdiff --git a/frontend/src/services/api.js b/frontend/src/services/api.js[m
[1mindex bf14144..6f47fcc 100644[m
[1m--- a/frontend/src/services/api.js[m
[1m+++ b/frontend/src/services/api.js[m
[36m@@ -4,7 +4,7 @@[m
 const API_BASE = '/api';[m
 [m
 async function fetchJSON(endpoint, options = {}) {[m
[31m-  const url = endpoint.startsWith('/') ? endpoint : `${API_BASE}/${endpoint}`;[m
[32m+[m[32m  const url = endpoint.startsWith(API_BASE) ? endpoint : `${API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;[m
   const res = await fetch(url, {[m
     headers: {[m
       'Content-Type': 'application/json',[m
[36m@@ -89,6 +89,18 @@[m [mexport async function createFolderItem(path) {[m
 }[m
 [m
 // Settings APIs[m
[32m+[m[32m// Worlds APIs[m
[32m+[m[32m// Worlds APIs[m
[32m+[m[32mexport async function getWorlds() {[m
[32m+[m[32m  return fetchJSON("/worlds");[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32mexport async function activateWorld(world) {[m
[32m+[m[32m  return fetchJSON("/worlds/activate", {[m
[32m+[m[32m    method: "POST",[m
[32m+[m[32m    body: JSON.stringify({ world }),[m
[32m+[m[32m  });[m
[32m+[m[32m}[m
 export async function getServerSettings() {[m
   return fetchJSON('/settings');[m
 }[m
[1mdiff --git a/frontend/src/services/ws.js b/frontend/src/services/ws.js[m
[1mindex 6f108ce..f97a444 100644[m
[1m--- a/frontend/src/services/ws.js[m
[1m+++ b/frontend/src/services/ws.js[m
[36m@@ -116,6 +116,9 @@[m [mclass GameCPWebSocket {[m
   }[m
 [m
   sendCommand(cmd) {[m
[32m+[m[32m    console.log("[WS] sendCommand:", cmd, "readyState=", this.ws ? this.ws.readyState : "null");[m
[32m+[m
[32m+[m
     if (this.ws && this.ws.readyState === WebSocket.OPEN) {[m
       this.ws.send(JSON.stringify({ type: 'command', data: cmd }));[m
       return true;[m
[1mdiff --git a/frontend/vite.config.js b/frontend/vite.config.js[m
[1mindex eabb149..fe687a5 100644[m
[1m--- a/frontend/vite.config.js[m
[1m+++ b/frontend/vite.config.js[m
[36m@@ -1,3 +1,4 @@[m
[32m+[m[32mimport { resolve } from 'path'[m
 import { defineConfig } from 'vite'[m
 import react from '@vitejs/plugin-react'[m
 import tailwindcss from '@tailwindcss/vite'[m
[36m@@ -10,6 +11,9 @@[m [mexport default defineConfig({[m
   server: {[m
     host: "0.0.0.0",[m
     port: 3000,[m
[32m+[m[32m    fs: {[m
[32m+[m[32m      allow: [resolve(__dirname, "../debug")][m
[32m+[m[32m    },[m
     proxy: {[m
       "/api": {[m
         target: "http://127.0.0.1:8080",[m
[36m@@ -21,15 +25,6 @@[m [mexport default defineConfig({[m
         ws: true,[m
         changeOrigin: true[m
       },[m
[31m-      "/status": { target: "http://127.0.0.1:8080", changeOrigin: true },[m
[31m-      "/console": { target: "http://127.0.0.1:8080", changeOrigin: true },[m
[31m-      "/start": { target: "http://127.0.0.1:8080", changeOrigin: true },[m
[31m-      "/stop": { target: "http://127.0.0.1:8080", changeOrigin: true },[m
[31m-      "/restart": { target: "http://127.0.0.1:8080", changeOrigin: true },[m
[31m-      "/command": { target: "http://127.0.0.1:8080", changeOrigin: true },[m
[31m-      "/files": { target: "http://127.0.0.1:8080", changeOrigin: true },[m
[31m-      "/settings": { target: "http://127.0.0.1:8080", changeOrigin: true },[m
[31m-      "/action": { target: "http://127.0.0.1:8080", changeOrigin: true }[m
     }[m
   }[m
 })[m
