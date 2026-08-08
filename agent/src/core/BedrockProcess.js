const fs = require("fs");
const { spawn } = require("child_process");
const ConsoleBuffer = require("../services/ConsoleBuffer");
const BedrockLogParser = require("../parsers/BedrockLogParser");
const ProcessFinder = require("../services/ProcessFinder");
const PlayerParser = require("../parsers/PlayerParser");

class BedrockProcess {

    constructor(config) {
        this.config = config;
        this.process = null;
        this.running = false;
        this.startedAt = null;
        this.logs = [];
    }


    attach(){

        const pid = ProcessFinder.findBedrock();

        if(!pid) return false;

        console.log("[Agent] Attaching Bedrock PID:", pid);

        this.running = true;
        this.startedAt = Date.now();

        return true;

    }

    start() {

        if (this.process) {
            try {
                process.kill(this.process.pid, 0);
                return false;
            } catch (e) {
                this.running = false;
                this.process = null;
            }
        }

        console.log("[Agent] Starting Bedrock Server...");

        this.process = spawn(
            "box64",
            [
                "/root/gamecp/minecraft/pyx64/python/bin/python3",
                "-m",
                "endstone"
            ],
            {
                cwd: "/root/gamecp/minecraft/endstone-26.40",
                stdio: ["pipe","pipe","pipe"]
            }
        );

        this.process.on("error",(err)=>{
            console.error("[Agent] Spawn error:", err);
        });

        this.startedAt = Date.now();

        this.process.on("spawn",()=>{
            this.running = true;
        });

        this.process.on("exit",(code,signal)=>{
            console.log("[Agent] Bedrock EXIT code=",code,"signal=",signal);
            this.running=false;
            this.process=null;
        });

        this.process.stdout.on("data",(data)=>{
            console.log("[STDOUT EVENT]", data.length);

            const line=data.toString();



            process.stdout.write(line);
            ConsoleBuffer.add(data);
            BedrockLogParser.parse(line);
            PlayerParser.parse(line);

            this.logs.push(line);

            if(this.onConsole){
                this.onConsole(line);
            }


            if(this.logs.length>1000){
                this.logs.shift();
            }

        });

        this.process.stderr.on("data",(data)=>{

            const line=data.toString();



            process.stderr.write(line);
            ConsoleBuffer.add(data);
            BedrockLogParser.parse(line);
            PlayerParser.parse(line);

            this.logs.push(line);

            if(this.onConsole){
                this.onConsole(line);
            }


            if(this.logs.length>1000){
                this.logs.shift();
            }

        });

        this.process.on("close",(code)=>{

            console.log("[Agent] Bedrock exited:",code);

            this.running=false;
            this.process=null;

        });

        return true;

    }

    send(command){

        console.log("[Agent] send(): process =", this.process ? this.process.pid : null);
        if(!this.process) return false;

        this.process.stdin.write(command+"\n");

        return true;

    }

    stop(){

        /*
         * Server dimulai oleh Agent.
         * Gunakan console command agar world tersimpan
         * dan Endstone/BDS shutdown dengan normal.
         */
        if (this.process) {

            try {

                if (
                    this.process.stdin &&
                    !this.process.stdin.destroyed
                ) {
                    console.log(
                        "[Agent] Graceful Bedrock shutdown..."
                    );

                    this.process.stdin.write("stop\n");

                    return true;
                }

            } catch (err) {

                console.error(
                    "[Agent] Graceful stop failed:",
                    err
                );

            }

        }

        /*
         * Agent mungkin direstart ketika server masih hidup.
         * Dalam kondisi tersebut this.process tidak tersedia.
         */
        const bedrockPid =
            ProcessFinder.findBedrock();

        if (!bedrockPid) {

            this.running = false;
            this.process = null;
            this.startedAt = null;

            return false;
        }

        const endstonePid =
            ProcessFinder.findEndstoneParent(
                bedrockPid
            );

        try {

            if (endstonePid) {

                console.log(
                    "[Agent] Stopping attached Endstone PID:",
                    endstonePid
                );

                process.kill(
                    endstonePid,
                    "SIGTERM"
                );

            } else {

                console.log(
                    "[Agent] Stopping attached Bedrock PID:",
                    bedrockPid
                );

                process.kill(
                    bedrockPid,
                    "SIGTERM"
                );

            }

            this.running = false;
            this.process = null;
            this.startedAt = null;

            return true;

        } catch (err) {

            console.error(
                "[Agent] Stop failed:",
                err
            );

            return false;
        }

    }

    restart(){

        if(this.running){

            this.stop();

            setTimeout(()=>{

                this.start();

            },3000);

        }else{

            this.start();

        }

        return true;

    }

    version(){
        try {
            const versionFile = require("path").join(
                this.config.server.path,
                "version.txt"
            );

            return fs.readFileSync(
                versionFile,
                "utf8"
            ).trim();
        } catch (err) {
            return null;
        }
    }

    status(){

        if(this.process){

            try{

                process.kill(this.process.pid,0);

            }catch(err){

                this.running=false;
                this.process=null;
                this.startedAt=null;

            }

        }

        const externalPid = this.process
            ? null
            : ProcessFinder.findBedrock();

        const pid = this.process
            ? this.process.pid
            : externalPid;

        return{

            running:!!pid,
            pid:pid,
            uptime:
                pid && this.startedAt
                    ? Math.floor((Date.now()-this.startedAt)/1000)
                    : 0

        };

    }

    console(){

        return this.logs;

    }

    info(){
        return BedrockLogParser.get();
    }

}

module.exports = BedrockProcess;
