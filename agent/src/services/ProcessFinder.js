const { execSync } = require("child_process");

class ProcessFinder {

    findBedrock() {
        try {
            const result = execSync(
                "ps -eo pid=,comm=,args=",
                { encoding: "utf8" }
            );

            const line = result
                .split("\n")
                .map(row => row.trim())
                .find(row => {
                    if (!row) return false;

                    const parts = row.split(/\s+/);

                    if (parts.length < 3) {
                        return false;
                    }

                    const command = parts[1];
                    const args = parts.slice(2).join(" ");

                    return (
                        command === "bedrock_server" ||
                        /\/bedrock_server(?:\s|$)/.test(args)
                    );
                });

            if (!line) {
                return null;
            }

            const pid = Number(
                line.split(/\s+/)[0]
            );

            return Number.isInteger(pid) && pid > 0
                ? pid
                : null;

        } catch (err) {
            return null;
        }
    }


    findEndstoneParent(bedrockPid) {
        if (!bedrockPid) {
            return null;
        }

        try {
            const ppid = Number(
                execSync(
                    `ps -o ppid= -p ${Number(bedrockPid)}`,
                    { encoding: "utf8" }
                ).trim()
            );

            if (!ppid) {
                return null;
            }

            const command = execSync(
                `ps -o args= -p ${ppid}`,
                { encoding: "utf8" }
            ).trim();

            if (
                command.includes("python") &&
                command.includes("-m endstone")
            ) {
                return ppid;
            }

            return null;

        } catch (err) {
            return null;
        }
    }

}

module.exports = new ProcessFinder();
