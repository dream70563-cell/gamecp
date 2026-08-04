module.exports = function (
    app,
    server,
    SystemMonitor,
    TunnelMonitor,
    PlayerParser
) {

    app.get("/status", async (req, res) => {

        const system = await SystemMonitor.get(server.status().pid);
        const tunnel = TunnelMonitor.get();

        res.json({
            ...server.status(),
            ...server.info(),
            tunnel,
            players: PlayerParser.get(),
            system
        });

    });

};
