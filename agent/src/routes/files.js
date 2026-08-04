module.exports = function (app, files) {

    app.get("/files", (req, res) => {
        const result = files.list(req.query.path || "");
        res.status(result.success ? 200 : 400).json(result);
    });

    app.get("/files/read", (req, res) => {
        const result = files.read(req.query.path);
        res.status(result.success ? 200 : 400).json(result);
    });

    app.post("/files/save", (req, res) => {
        const result = files.save(
            req.body.path,
            req.body.content
        );

        res.status(result.success ? 200 : 400).json(result);
    });

    app.post("/files/folder", (req, res) => {
        const result = files.createFolder(
            req.body.path
        );

        res.status(result.success ? 200 : 400).json(result);
    });

    app.post("/files/delete", (req, res) => {
        const result = files.delete(
            req.body.path
        );

        res.status(result.success ? 200 : 400).json(result);
    });

};
