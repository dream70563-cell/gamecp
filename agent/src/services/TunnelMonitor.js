const {execSync}=require("child_process");

class TunnelMonitor{

    get(){

        try{

            const result = execSync(
                "pgrep -f playitd",
                {
                    encoding:"utf8"
                }
            ).trim();

            return {
                running: !!result,
                pid: result ? Number(result.split("\n")[0]) : null
            };

        }catch(e){

            return {
                running:false,
                pid:null
            };

        }

    }

}

module.exports = new TunnelMonitor();
