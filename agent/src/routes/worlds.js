module.exports = function (
    app,
    worlds,
    server,
    upload
) {

    app.get("/worlds", (req, res) => {
        res.json(worlds.list());
    });

    app.post("/worlds/activate", (req, res) => {

        const result = worlds.activate(req.body.world);

        if (result.success) {
            server.restart();
        }

        res.json(result);

    });

    app.delete("/worlds/:world", (req, res) => {

        const result = worlds.deleteWorld(req.params.world);

        res.status(result.success ? 200 : 400).json(result);

    });

    app.post("/worlds/import", upload.single("world"), (req, res) => {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "No world file uploaded"
            });
        }

        const result = worlds.importWorld(
            req.file.path,
            req.file.originalname
        );

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);

    });

    app.post("/worlds/create", (req, res) => {

        const result = worlds.create(req.body.world);

        res.json(result);

    });

};
