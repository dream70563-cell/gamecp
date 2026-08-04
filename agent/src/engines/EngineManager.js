const path = require("path");

class EngineManager {

    constructor(){

        this.engine="vanilla";

    }

    set(engine){

        this.engine=engine;

    }

    get(){

        return this.engine;

    }

    script(){

        return path.join(
            "/root/gamecp/minecraft/engines",
            this.engine + ".sh"
        );

    }

}

module.exports=new EngineManager();
