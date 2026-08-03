const fs = require("fs");
const path = require("path");
class BedrockLogParser {

    constructor(){

        try{

            this.data = JSON.parse(
                fs.readFileSync(
                    path.join(__dirname,"../../data/bedrock-state.json"),
                    "utf8"
                )
            );

        }catch(err){

            this.data = {
                world:null,
                gamemode:null,
                difficulty:null,
                online:false
            };

        }

    }


    parse(line){

        if(line.includes("Level Name:")){

            this.data.world = line
                .split("Level Name:")[1]
                .split("\n")[0]
                .trim();

        }


        if(line.includes("Game mode:")){

            this.data.gamemode =
                line.includes("Survival")
                ? "survival"
                : "unknown";

        }


        if(line.includes("Difficulty:")){

            this.data.difficulty =
                line.includes("EASY")
                ? "easy"
                : "unknown";

        }


        if(line.includes("Server started.")){

            this.data.online=true;

        }



        fs.writeFileSync(
            path.join(__dirname,"../../data/bedrock-state.json"),
            JSON.stringify(this.data,null,2)
        );

        return this.data;

    }


    get(){

        return this.data;

    }

}


module.exports = new BedrockLogParser();
