const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

class WorldService {

    constructor(config) {
        this.config = config;
        this.root = config.server.path;
        this.worldsPath = path.join(this.root, "worlds");
    }

    list() {
        try {
            const items = fs.readdirSync(this.worldsPath, {
                withFileTypes: true
            });

            const serverProperties = path.join(
                this.root,
                "server.properties"
            );

            let activeWorld = this.config.server.name;

            if (fs.existsSync(serverProperties)) {
                const text = fs.readFileSync(serverProperties, "utf8");
                const match = text.match(/^level-name=(.*)$/m);

                if (match) {
                    activeWorld = match[1].trim();
                }
            }

            const worlds = items
                .filter(item => item.isDirectory())
                .map(item => ({
                    name: item.name,
                    active: item.name === activeWorld
                }));

            return {
                success: true,
                worlds
            };
        } catch (err) {
            return {
                success: false,
                error: err.message,
                worlds: []
            };
        }
    }

    getActiveWorld() {
        return this.config.server.name;
    }

    activate(worldName) {
        try {
            const worldPath = path.join(this.worldsPath, worldName);

            if (!fs.existsSync(worldPath)) {
                return {
                    success: false,
                    error: "World not found"
                };
            }

            const serverProperties = path.join(
                this.root,
                "server.properties"
            );

            let text = fs.readFileSync(serverProperties, "utf8");

            text = text.replace(
                /^level-name=.*$/m,
                `level-name=${worldName}`
            );

            fs.writeFileSync(serverProperties, text);

            this.config.server.name = worldName;

            return {
                success: true
            };
        } catch (err) {
            return {
                success: false,
                error: err.message
            };
        }
    }

    create(worldName) {
        try {
            const worldPath = path.join(
                this.worldsPath,
                worldName
            );

            if (fs.existsSync(worldPath)) {
                return {
                    success: false,
                    error: "World already exists"
                };
            }

            fs.mkdirSync(worldPath, {
                recursive: true
            });

            return {
                success: true
            };
        } catch (err) {
            return {
                success: false,
                error: err.message
            };
        }
    }

    importWorld(uploadPath, originalName) {
        const tempRoot = path.join(this.root, ".gamecp-import");
        const tempDir = path.join(
            tempRoot,
            `world-${Date.now()}-${Math.random().toString(36).slice(2)}`
        );

        try {
            const extension = path.extname(originalName).toLowerCase();

            if (![".mcworld", ".zip"].includes(extension)) {
                throw new Error("Only .mcworld and .zip files are supported");
            }

            fs.mkdirSync(tempDir, { recursive: true });

            execFileSync("/usr/bin/unzip", [
                "-q",
                uploadPath,
                "-d",
                tempDir
            ]);

            let sourceDir = tempDir;

            if (!fs.existsSync(path.join(sourceDir, "level.dat"))) {
                const dirs = fs.readdirSync(tempDir, {
                    withFileTypes: true
                }).filter(item => item.isDirectory());

                if (dirs.length === 1) {
                    const nested = path.join(tempDir, dirs[0].name);

                    if (fs.existsSync(path.join(nested, "level.dat"))) {
                        sourceDir = nested;
                    }
                }
            }

            if (!fs.existsSync(path.join(sourceDir, "level.dat"))) {
                throw new Error(
                    "Invalid Bedrock world: level.dat was not found"
                );
            }

            let worldName = path.basename(
                originalName,
                extension
            );

            worldName = worldName
                .replace(/[^a-zA-Z0-9 _.-]/g, "")
                .trim();

            if (!worldName) {
                worldName = `ImportedWorld-${Date.now()}`;
            }

            let finalName = worldName;
            let counter = 2;

            while (
                fs.existsSync(
                    path.join(this.worldsPath, finalName)
                )
            ) {
                finalName = `${worldName}-${counter}`;
                counter++;
            }

            const destination = path.join(
                this.worldsPath,
                finalName
            );

            fs.cpSync(sourceDir, destination, {
                recursive: true
            });

            return {
                success: true,
                world: finalName
            };

        } catch (err) {
            return {
                success: false,
                error: err.message
            };

        } finally {
            try {
                fs.rmSync(tempDir, {
                    recursive: true,
                    force: true
                });
            } catch {}

            try {
                fs.unlinkSync(uploadPath);
            } catch {}
        }
    }

    deleteWorld(worldName) {
        try {
            if (!worldName || typeof worldName !== "string") {
                return {
                    success: false,
                    error: "World name is required"
                };
            }

            const safeName = path.basename(worldName);

            if (safeName !== worldName || safeName === "." || safeName === "..") {
                return {
                    success: false,
                    error: "Invalid world name"
                };
            }

            const activeWorld = this.getActiveWorld();

            if (worldName === activeWorld) {
                return {
                    success: false,
                    error: "Active world cannot be deleted"
                };
            }

            const worldPath = path.join(this.worldsPath, worldName);

            if (!fs.existsSync(worldPath)) {
                return {
                    success: false,
                    error: "World not found"
                };
            }

            const stat = fs.statSync(worldPath);

            if (!stat.isDirectory()) {
                return {
                    success: false,
                    error: "Invalid world"
                };
            }

            fs.rmSync(worldPath, {
                recursive: true,
                force: false
            });

            return {
                success: true,
                world: worldName
            };

        } catch (err) {
            return {
                success: false,
                error: err.message
            };
        }
    }

}

module.exports = WorldService;
