const fs = require("fs");

module.exports = function(app){

    const file="/root/gamecp/minecraft/endstone-26.40/bedrock_server/allowlist.json";

    function read(){
        if(!fs.existsSync(file)) return [];
        return JSON.parse(fs.readFileSync(file,"utf8"));
    }

    function save(data){
        fs.writeFileSync(file,JSON.stringify(data,null,2));
    }

    app.get("/players",(req,res)=>{
        res.json(read());
    });

    app.post("/players/add",(req,res)=>{

        const {name,xuid=""}=req.body;

        if(!name){
            return res.status(400).json({
                success:false,
                error:"name required"
            });
        }

        const players=read();

        if(players.find(v=>v.name===name)){
            return res.json({
                success:true,
                message:"already exists"
            });
        }

        players.push({
            name,
            xuid,
            ignoresPlayerLimit:false
        });

        save(players);

        res.json({success:true});
    });

    app.post("/players/remove",(req,res)=>{

        save(
            read().filter(v=>v.name!==req.body.name)
        );

        res.json({success:true});

    });

};
