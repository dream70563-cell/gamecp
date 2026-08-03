class ActionService {

    static execute(server, action, data = {}) {

        let command = "";

        switch (action) {

            case "op":
                command = `op "${data.player}"`;
                break;

            case "deop":
                command = `deop "${data.player}"`;
                break;

            case "kick":
                command = `kick "${data.player}"`;
                break;

            case "gamemode":
                command = `gamemode ${data.mode} "${data.player}"`;
                break;

            case "tp":
                command = `tp "${data.player}" ${data.target || data.coordinates}`;
                break;


            case "save":
                command = "save hold";
                break;

            case "saveResume":
                command = "save resume";
                break;

            case "saveAll":
                command = "save-all";
                break;

            default:
                return {
                    success: false,
                    error: "Unknown action"
                };
        }

        return {
            success: server.send(command),
            command
        };
    }

}

module.exports = ActionService;
