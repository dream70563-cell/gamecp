module.exports = function (app, server) {

    app.get("/health", (req, res) => {

        res.json({
            status: "online",
            ...server.status()
        });

    });

};
