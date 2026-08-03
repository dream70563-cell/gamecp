const fs = require("fs");

class LogTailer {

    constructor(){
        this.file = null;
        this.position = 0;
    }


    attach(file){

        if(!fs.existsSync(file)){
            return false;
        }

        this.file = file;
        this.position = fs.statSync(file).size;

        return true;
    }


    read(){

        if(!this.file){
            return [];
        }

        try{

            const stat = fs.statSync(this.file);

            if(stat.size <= this.position){
                return [];
            }


            const fd = fs.openSync(this.file,"r");

            const buffer = Buffer.alloc(
                stat.size - this.position
            );


            fs.readSync(
                fd,
                buffer,
                0,
                buffer.length,
                this.position
            );


            fs.closeSync(fd);


            this.position = stat.size;


            return buffer
                .toString()
                .split("\n")
                .filter(Boolean);


        }catch(err){

            return [];

        }

    }

}


module.exports = new LogTailer();
