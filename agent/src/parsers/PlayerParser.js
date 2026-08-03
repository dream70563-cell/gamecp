class PlayerParser {

    constructor(){
        this.players = [];
        this.online = 0;
        this.max = 0;
    }

    parse(data){

        const text = data.toString();


        const join = text.match(/Player connected: ([^,]+),/);

        if(join){
            const name = join[1].trim();

            if(!this.players.includes(name)){
                this.players.push(name);
            }
        }


        const list = text.match(/There are (\d+)\/(\d+) players online/);

        if(list){
            this.online = Number(list[1]);
            this.max = Number(list[2]);

            if(this.online === 0){
                this.players = [];
            }
        }


        if(this.players.length > 0){ this.online=this.players.length; }
        return this.get();

    }


    get(){

        return {
            online:this.online,
            max:this.max,
            players:this.players
        };

    }

}


module.exports = new PlayerParser();
