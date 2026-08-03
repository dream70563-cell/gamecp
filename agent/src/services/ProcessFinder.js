const { execSync } = require("child_process");

class ProcessFinder {

    findBedrock(){

        try{

            const result = execSync(
                "pgrep -af 'box64.*bedrock_server|bedrock_server'",
                {
                    encoding:"utf8"
                }
            ).trim();


            if(!result){
                return null;
            }


            const line = result
                .split("\n")
                .find(row => row.includes("bedrock_server") || row.includes("box64"));


            if(!line){
                return null;
            }


            return Number(
                line.split(" ")[0]
            );


        }catch(err){

            return null;

        }

    }

}


module.exports = new ProcessFinder();
