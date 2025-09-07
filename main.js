// Basic 3D naval shooter prototype using Babylon.js
const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true);

let gold = 0, ship = null, kills = 0, username = "Player" + Math.floor(Math.random()*10000);
let ws, leaderboard = [];

function buyShip() {
    if (gold >= 100 && !ship) {
        gold -= 100;
        ship = "Starter Ship";
        document.getElementById("ship").innerText = ship;
        document.getElementById("gold").innerText = gold;
        ws.send(JSON.stringify({ type: "buyShip", ship, gold }));
    }
}

function updateLeaderboard() {
    let lb = document.getElementById("lb");
    lb.innerHTML = "";
    leaderboard.forEach(p => {
        let li = document.createElement("li");
        li.textContent = `${p.username}: ${p.kills}`;
        lb.appendChild(li);
    });
}

const createScene = function () {
    const scene = new BABYLON.Scene(engine);

    // Camera
    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI/2, Math.PI/3, 50, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

    // Light
    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    // Island
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width:100, height:100}, scene);
    ground.position.y = 0;

    // Docks
    const dock = BABYLON.MeshBuilder.CreateBox("dock", {width:20, height:1, depth:5}, scene);
    dock.position = new BABYLON.Vector3(0,0.5,-40);

    // Player model
    const player = BABYLON.MeshBuilder.CreateBox("player", {size:2}, scene);
    player.position.y = 1;
    player.position.x = Math.random()*20-10;
    player.position.z = Math.random()*20-10;
    player.material = new BABYLON.StandardMaterial("pmat", scene);
    player.material.diffuseColor = new BABYLON.Color3(0.2,0.5,0.7);

    // Other players
    let others = {};

    // Simple controls
    window.addEventListener("keydown", e => {
        switch(e.key) {
            case "w": player.position.z += 1; break;
            case "s": player.position.z -= 1; break;
            case "a": player.position.x -= 1; break;
            case "d": player.position.x += 1; break;
        }
        ws.send(JSON.stringify({ type: "move", x: player.position.x, z: player.position.z }));
    });

    // Weapons: musket (shoot), sword (melee)
    window.addEventListener("mousedown", e => {
        // Fire musket
        ws.send(JSON.stringify({ type: "attack", weapon: "musket", x: player.position.x, z: player.position.z }));
    });
    window.addEventListener("contextmenu", e => {
        e.preventDefault();
        // Swing sword
        ws.send(JSON.stringify({ type: "attack", weapon: "sword", x: player.position.x, z: player.position.z }));
    });

    // WebSocket multiplayer
    ws = new WebSocket("wss://replit-websocket-url-here"); // Change this to your actual Replit server URL!
    ws.onopen = () => {
        ws.send(JSON.stringify({ type: "join", username }));
    };
    ws.onmessage = (msg) => {
        let data = JSON.parse(msg.data);
        if (data.type === "state") {
            leaderboard = data.leaderboard;
            updateLeaderboard();
            gold = data.gold;
            kills = data.kills;
            document.getElementById("gold").innerText = gold;
            document.getElementById("kills").innerText = kills;
            // Sync other players
            data.players.forEach(p => {
                if (p.username !== username) {
                    if (!others[p.username]) {
                        let m = BABYLON.MeshBuilder.CreateBox("other", {size:2}, scene);
                        m.position.x = p.x;
                        m.position.z = p.z;
                        m.position.y = 1;
                        m.material = new BABYLON.StandardMaterial("omat", scene);
                        m.material.diffuseColor = new BABYLON.Color3(0.7,0.3,0.3);
                        others[p.username] = m;
                    } else {
                        others[p.username].position.x = p.x;
                        others[p.username].position.z = p.z;
                    }
                }
            });
        }
    };

    return scene;
};

const scene = createScene();
engine.runRenderLoop(() => { scene.render(); });
window.addEventListener("resize", () => { engine.resize(); });
