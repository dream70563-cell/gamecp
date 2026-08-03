const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

class BackupService {

    constructor(config) {
        this.root = config.server.path;
        this.worldsPath = path.join(this.root, "worlds");
        this.backupPath = path.join(this.root, "backups");

        fs.mkdirSync(this.backupPath, {
            recursive: true
        });
    }

    getActiveWorld() {
        const properties = path.join(
            this.root,
            "server.properties"
        );

        const text = fs.readFileSync(properties, "utf8");
        const match = text.match(/^level-name=(.*)$/m);

        if (!match) {
            throw new Error("Active world not found");
        }

        return match[1].trim();
    }

    createWorldBackup() {
        const world = this.getActiveWorld();
        const worldPath = path.join(this.worldsPath, world);

        if (!fs.existsSync(worldPath)) {
            throw new Error(`World "${world}" not found`);
        }

        const timestamp = new Date()
            .toISOString()
            .replace(/[:.]/g, "-");

        const filename =
            `${world}-${timestamp}.mcworld`;

        const output = path.join(
            this.backupPath,
            filename
        );

        execFileSync(
            "/usr/bin/zip",
            [
                "-r",
                "-q",
                output,
                "."
            ],
            {
                cwd: worldPath
            }
        );

        return {
            filename,
            path: output,
            world
        };
    }
}

module.exports = BackupService;
