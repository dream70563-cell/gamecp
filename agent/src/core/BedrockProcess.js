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
            [this.config.server.binary],
            {
                cwd: this.config.server.path,
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

        let pid = this.process
            ? this.process.pid
            : ProcessFinder.findBedrock();

        if(!pid) return false;

        process.kill(pid,"SIGTERM");

        this.running = false;
        this.process = null;

        return true;

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
