const API_URL = "http://100.93.222.98:8080/status";

export async function getServerHealth() {

    const res = await fetch(API_URL);

    if(!res.ok){
        throw new Error("API error");
    }

    const data = await res.json();


    return {
        ...data,

        cpu: data.system?.cpu ?? 0,

        ramMB: data.system?.ramMB ?? 0,

        playit: data.tunnel?.running
            ? "ONLINE"
            : "OFFLINE",

        system:{
            ...data.system,
            usedRamMB: data.system?.ramMB ?? 0,
            totalRamMB: "-",
            diskUsedGB: "-",
            diskTotalGB: "-"
        }
    };

}
