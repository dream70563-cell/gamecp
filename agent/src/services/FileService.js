const fs = require("fs");
const path = require("path");

class FileService {

    constructor(config) {
        this.root = path.resolve(config.server.path);
    }


    resolvePath(relativePath = "") {
        const clean = String(relativePath || "")
            .replace(/\\/g, "/")
            .replace(/^\/+/, "");

        const resolved = path.resolve(
            this.root,
            clean
        );

        if (
            resolved !== this.root &&
            !resolved.startsWith(this.root + path.sep)
        ) {
            throw new Error("Access outside server directory is not allowed");
        }

        return resolved;
    }


    list(relativePath = "") {
        try {
            const target = this.resolvePath(relativePath);

            if (!fs.existsSync(target)) {
                return {
                    success: false,
                    error: "Directory not found"
                };
            }

            if (!fs.statSync(target).isDirectory()) {
                return {
                    success: false,
                    error: "Path is not a directory"
                };
            }

            const files = fs.readdirSync(
                target,
                { withFileTypes: true }
            ).map(item => {

                const fullPath = path.join(
                    target,
                    item.name
                );

                const relative = path.relative(
                    this.root,
                    fullPath
                ).replace(/\\/g, "/");

                let size = 0;

                if (!item.isDirectory()) {
                    try {
                        size = fs.statSync(fullPath).size;
                    } catch {}
                }

                return {
                    name: item.name,
                    path: relative,
                    isDirectory: item.isDirectory(),
                    size
                };
            });

            files.sort((a, b) => {

                if (
                    a.isDirectory !==
                    b.isDirectory
                ) {
                    return a.isDirectory ? -1 : 1;
                }

                return a.name.localeCompare(
                    b.name
                );
            });

            return {
                success: true,
                path: relativePath,
                files
            };

        } catch (err) {

            return {
                success: false,
                error: err.message
            };

        }
    }


    read(relativePath) {
        try {
            const target =
                this.resolvePath(relativePath);

            if (!fs.existsSync(target)) {
                return {
                    success: false,
                    error: "File not found"
                };
            }

            if (!fs.statSync(target).isFile()) {
                return {
                    success: false,
                    error: "Path is not a file"
                };
            }

            const stat = fs.statSync(target);

            if (stat.size > 5 * 1024 * 1024) {
                return {
                    success: false,
                    error: "File is too large to edit"
                };
            }

            return {
                success: true,
                path: relativePath,
                content: fs.readFileSync(
                    target,
                    "utf8"
                )
            };

        } catch (err) {

            return {
                success: false,
                error: err.message
            };

        }
    }


    save(relativePath, content) {
        try {
            const target =
                this.resolvePath(relativePath);

            if (!fs.existsSync(target)) {
                return {
                    success: false,
                    error: "File not found"
                };
            }

            if (!fs.statSync(target).isFile()) {
                return {
                    success: false,
                    error: "Path is not a file"
                };
            }

            fs.writeFileSync(
                target,
                String(content ?? ""),
                "utf8"
            );

            return {
                success: true,
                path: relativePath
            };

        } catch (err) {

            return {
                success: false,
                error: err.message
            };

        }
    }


    createFolder(relativePath) {
        try {
            const target =
                this.resolvePath(relativePath);

            if (target === this.root) {
                return {
                    success: false,
                    error: "Invalid folder path"
                };
            }

            if (fs.existsSync(target)) {
                return {
                    success: false,
                    error: "Folder already exists"
                };
            }

            fs.mkdirSync(
                target,
                { recursive: false }
            );

            return {
                success: true,
                path: relativePath
            };

        } catch (err) {

            return {
                success: false,
                error: err.message
            };

        }
    }


    delete(relativePath) {
        try {
            const target =
                this.resolvePath(relativePath);

            if (target === this.root) {
                return {
                    success: false,
                    error: "Server root cannot be deleted"
                };
            }

            if (!fs.existsSync(target)) {
                return {
                    success: false,
                    error: "File or directory not found"
                };
            }

            fs.rmSync(
                target,
                {
                    recursive: true,
                    force: false
                }
            );

            return {
                success: true,
                path: relativePath
            };

        } catch (err) {

            return {
                success: false,
                error: err.message
            };

        }
    }
}

module.exports = FileService;
