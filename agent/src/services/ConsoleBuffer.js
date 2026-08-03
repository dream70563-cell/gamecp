class ConsoleBuffer {

    constructor(limit = 1000){

        this.logs = [];
        this.limit = limit;

    }


    add(data){

        const lines = data
            .toString()
            .split("\n")
            .filter(Boolean);

        this.logs.push(...lines);


        if(this.logs.length > this.limit){

            this.logs =
                this.logs.slice(-this.limit);

        }

    }


    get(){

        return this.logs;

    }


    clear(){

        this.logs = [];

    }

}


module.exports = new ConsoleBuffer();
