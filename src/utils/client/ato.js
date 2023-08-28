import { encode, decodeAsync } from "@msgpack/msgpack";

async function ato_run(code, input) {
    let socket = new WebSocket(
        "wss://ato.pxeger.com/api/v1/ws/execute"
    );
    socket.onopen = () =>
        socket.send(
            encode({
                language: "python", // get this from https://github.com/attempt-this-online/attempt-this-online/tree/main/runners
                code,
                input,
                options: [],
                arguments: [],
                timeout: 60,
            })
        );
    var stdout = "";
    
    return new Promise((resolve) => {
        socket.onmessage = async (event) => {
            let response = await decodeAsync(
                event.data.stream()
            )
            // console.log(response);
            if ("Done" in response) {
                
                resolve(stdout);
            }
            if ("Stdout" in response) {
                stdout += new TextDecoder().decode(response.Stdout);
            }
        };
    });
}

export { ato_run };