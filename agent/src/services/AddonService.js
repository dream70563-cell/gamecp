const fs = require("fs");
const path = require("path");
const JSON5 = require("json5");
const { execFileSync } = require("child_process");

class AddonService {

    constructor(config) {
        this.root = config.server.path;
        this.behaviorPath = path.join(this.root, "behavior_packs");
        this.resourcePath = path.join(this.root, "resource_packs");
        this.worldsPath = path.join(this.root, "worlds");
    }

    findManifests(dir) {
        const results = [];

        function walk(current) {
            for (const item of fs.readdirSync(current, { withFileTypes: true })) {
                const full = path.join(current, item.name);

                if (item.isDirectory()) {
                    walk(full);
                } else if (item.name.toLowerCase() === "manifest.json") {
                    results.push(full);
                }
            }
        }

        walk(dir);
        return results;
    }

    getActiveWorld() {
        const properties = path.join(this.root, "server.properties");
        const text = fs.readFileSync(properties, "utf8");
        const match = text.match(/^level-name=(.*)$/m);

        if (!match) {
            throw new Error("Active world not found");
        }

        return match[1].trim();
    }

    attachToWorld(pack) {
        const world = this.getActiveWorld();
        const worldPath = path.join(this.worldsPath, world);

        if (!fs.existsSync(worldPath)) {
            throw new Error(`Active world "${world}" not found`);
        }

        const filename = pack.type === "resource"
            ? "world_resource_packs.json"
            : "world_behavior_packs.json";

        const jsonPath = path.join(worldPath, filename);

        let packs = [];

        if (fs.existsSync(jsonPath)) {
            try {
                packs = JSON.parse(
                    fs.readFileSync(jsonPath, "utf8")
                );

                if (!Array.isArray(packs)) {
                    packs = [];
                }
            } catch {
                packs = [];
            }
        }

        const entry = {
            pack_id: pack.uuid,
            version: pack.version
        };

        const index = packs.findIndex(
            item => item.pack_id === pack.uuid
        );

        if (index >= 0) {
            packs[index] = entry;
        } else {
            packs.push(entry);
        }

        fs.writeFileSync(
            jsonPath,
            JSON.stringify(packs, null, 2)
        );

        return world;
    }

    listInstalled() {
        const world = this.getActiveWorld();
        const worldPath = path.join(this.worldsPath, world);

        const attached = {
            behavior: new Set(),
            resource: new Set()
        };

        const loadAttached = (filename, type) => {
            const jsonPath = path.join(worldPath, filename);

            if (!fs.existsSync(jsonPath)) return;

            try {
                const data = JSON.parse(
                    fs.readFileSync(jsonPath, "utf8")
                );

                if (Array.isArray(data)) {
                    for (const pack of data) {
                        if (pack.pack_id) {
                            attached[type].add(pack.pack_id);
                        }
                    }
                }
            } catch {}
        };

        loadAttached(
            "world_behavior_packs.json",
            "behavior"
        );

        loadAttached(
            "world_resource_packs.json",
            "resource"
        );

        const packs = [];

        const scan = (root, type) => {
            if (!fs.existsSync(root)) return;

            for (const item of fs.readdirSync(root, {
                withFileTypes: true
            })) {
                if (!item.isDirectory()) continue;

                const manifestPath = path.join(
                    root,
                    item.name,
                    "manifest.json"
                );

                if (!fs.existsSync(manifestPath)) continue;

                try {
                    const text = fs
                        .readFileSync(manifestPath, "utf8")
                        .replace(/^\uFEFF/, "");

                    const manifest = JSON5.parse(text);
                    const uuid = manifest.header?.uuid;

                    if (!uuid) continue;

                    // Hanya pack yang attached ke world aktif.
                    if (!attached[type].has(uuid)) continue;

                    packs.push({
                        name: manifest.header.name || item.name,
                        uuid,
                        version: manifest.header.version,
                        type,
                        folder: item.name,
                        world
                    });

                } catch {}
            }
        };

        scan(this.behaviorPath, "behavior");
        scan(this.resourcePath, "resource");

        return {
            success: true,
            world,
            addons: packs
        };
    }

    deleteAddon(uuid, type) {
        if (!uuid) {
            throw new Error("Addon UUID is required");
        }

        if (!["behavior", "resource"].includes(type)) {
            throw new Error("Invalid addon type");
        }

        const root = type === "resource"
            ? this.resourcePath
            : this.behaviorPath;

        let target = null;

        for (const item of fs.readdirSync(root, { withFileTypes: true })) {
            if (!item.isDirectory()) continue;

            const manifestPath = path.join(root, item.name, "manifest.json");

            if (!fs.existsSync(manifestPath)) continue;

            try {
                const text = fs
                    .readFileSync(manifestPath, "utf8")
                    .replace(/^\uFEFF/, "");

                const manifest = JSON5.parse(text);

                if (manifest.header?.uuid === uuid) {
                    target = path.join(root, item.name);
                    break;
                }
            } catch {}
        }

        if (!target) {
            throw new Error("Addon not found");
        }

        const world = this.getActiveWorld();
        const worldPath = path.join(this.worldsPath, world);

        const filename = type === "resource"
            ? "world_resource_packs.json"
            : "world_behavior_packs.json";

        const jsonPath = path.join(worldPath, filename);

        if (fs.existsSync(jsonPath)) {
            let packs = [];

            try {
                packs = JSON.parse(
                    fs.readFileSync(jsonPath, "utf8")
                );
            } catch {}

            if (Array.isArray(packs)) {
                packs = packs.filter(
                    pack => pack.pack_id !== uuid
                );

                fs.writeFileSync(
                    jsonPath,
                    JSON.stringify(packs, null, 2)
                );
            }
        }

        fs.rmSync(target, {
            recursive: true,
            force: true
        });

        return {
            success: true,
            uuid,
            type,
            world
        };
    }

    importAddon(uploadPath, originalName) {

        const ext = path.extname(originalName).toLowerCase();

        if (![".mcpack", ".mcaddon", ".zip"].includes(ext)) {
            throw new Error("Only .mcpack, .mcaddon or .zip files are supported");
        }

        const tempDir = path.join(
            this.root,
            ".gamecp-addon",
            `addon-${Date.now()}`
        );

        fs.mkdirSync(tempDir, { recursive: true });

        try {

            execFileSync("/usr/bin/unzip", [
                "-q",
                uploadPath,
                "-d",
                tempDir
            ]);

            const manifests = this.findManifests(tempDir);

            if (!manifests.length) {
                throw new Error("No manifest.json found in addon");
            }

            const installed = [];

            for (const manifestPath of manifests) {

                const manifestText = fs
                    .readFileSync(manifestPath, "utf8")
                    .replace(/^\uFEFF/, "");

                const manifest = JSON5.parse(manifestText);

                if (!manifest.header?.uuid) {
                    continue;
                }

                const modules = manifest.modules || [];

                const isResource = modules.some(
                    m => m.type === "resources"
                );

                const isBehavior = modules.some(
                    m => m.type === "data" || m.type === "script"
                );

                if (!isResource && !isBehavior) {
                    continue;
                }

                const source = path.dirname(manifestPath);

                const baseName = (
                    manifest.header.name ||
                    path.basename(source)
                )
                    .replace(/[^a-zA-Z0-9_.-]/g, "_")
                    .slice(0, 80);

                const targetRoot = isResource
                    ? this.resourcePath
                    : this.behaviorPath;

                let target = path.join(
                    targetRoot,
                    baseName
                );

                if (fs.existsSync(target)) {
                    target += `-${Date.now()}`;
                }

                fs.cpSync(source, target, {
                    recursive: true
                });

                const pack = {
                    name: manifest.header.name || baseName,
                    uuid: manifest.header.uuid,
                    version: manifest.header.version,
                    type: isResource ? "resource" : "behavior",
                    folder: path.basename(target)
                };

                pack.world = this.attachToWorld(pack);

                installed.push(pack);
            }

            if (!installed.length) {
                throw new Error(
                    "No compatible behavior/resource packs found"
                );
            }

            return {
                success: true,
                installed
            };

        } finally {

            fs.rmSync(tempDir, {
                recursive: true,
                force: true
            });

            try {
                fs.unlinkSync(uploadPath);
            } catch {}
        }
    }
}

module.exports = AddonService;
