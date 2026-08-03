const pidusage = require("pidusage");
const { execSync } = require("child_process");

class SystemMonitor {

    async get(pid){

        if(!pid){

            return {
                running:false,
                pid:null,
                cpu:0,
                ramMB:0,
                totalRamMB:0,
                ramPercent:0
            };

        }

        try{

            const stat = await pidusage(pid);

            const cpu = Number(
                (
                    parseFloat(
                        execSync(`ps -p ${pid} -o %cpu=`)
                            .toString()
                            .trim()
                    ) || 0
                ).toFixed(1)
            );

            const ramMB = Number(
                (stat.memory / 1024 / 1024).toFixed(1)
            );

            const meminfo = execSync("grep MemTotal /proc/meminfo")
                .toString()
                .trim();

            const totalRamMB = Number(
                (
                    parseInt(meminfo.split(/\s+/)[1],10)
                    /1024
                ).toFixed(1)
            );

            const ramPercent = Number(
                (
                    ramMB / totalRamMB * 100
                ).toFixed(1)
            );

            return {

                running:true,
                pid,
                cpu,
                ramMB,
                totalRamMB,
                ramPercent

            };

        }catch(err){

            return {

                running:false,
                pid:null,
                cpu:0,
                ramMB:0,
                totalRamMB:0,
                ramPercent:0

            };

        }

    }

}

module.exports = new SystemMonitor();
