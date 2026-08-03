import { useEffect, useState } from "react";

export default function Console(){
    const [logs,setLogs] = useState([]);
    const [command,setCommand] = useState("");

    async function load(){
        try {
            const res = await fetch("/api/console");
            const data = await res.json();
            setLogs(data);
        } catch (e) {
            console.error(e);
        }
    }

    async function send(){
        if(!command) return;

        await fetch("/api/command",{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                command
            })
        });

        setCommand("");
    }

    useEffect(()=>{
        let isSubscribed = true;
        fetch("/api/console")
            .then(res => res.json())
            .then(data => {
                if (isSubscribed) setLogs(data);
            })
            .catch(console.error);

        const timer=setInterval(load,3000);

        return () => {
            isSubscribed = false;
            clearInterval(timer);
        };
    },[]);

    return (
        <div className="bg-gray-900 rounded-xl p-5 mt-5">
            <h2 className="text-xl font-bold mb-3">
                Console
            </h2>

            <div className="bg-black p-4 rounded h-96 overflow-auto text-sm">
            {
                logs.map((l,i)=>(
                    <pre key={i}>
                        {l}
                    </pre>
                ))
            }
            </div>

            <div className="flex mt-3">
                <input
                className="flex-1 bg-gray-800 p-2 rounded"
                value={command}
                onChange={e=>setCommand(e.target.value)}
                placeholder="say hello"
                />

                <button
                onClick={send}
                className="ml-2 bg-blue-600 px-4 rounded"
                >
                    SEND
                </button>
            </div>
        </div>
    )
}
