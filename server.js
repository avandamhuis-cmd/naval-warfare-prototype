// Node.js + WebSocket multiplayer backend for naval warfare
const WebSocket = require('ws');
const fs = require('fs');
const { loadData, saveData } = require('./database');
const wss = new WebSocket.Server({ port: 3000 });

let players = {};
let leaderboard = [];

wss.on('connection', ws => {
    let user = null;
    ws.on('message', msg => {
        let data = JSON.parse(msg);
        switch(data.type) {
            case "join":
                user = data.username;
                let pdata = loadData(user) || { gold: 0, kills: 0, ship: null, x: 0, z: 0 };
                players[user] = { ...pdata, username: user, ws };
                broadcastState();
                break;
            case "move":
                if (user && players[user]) {
                    players[user].x = data.x;
                    players[user].z = data.z;
                    saveData(user, players[user]);
                    broadcastState();
                }
                break;
            case "attack":
                // Simple attack logic: increase kills for demonstration
                if (user && players[user]) {
                    players[user].kills = (players[user].kills || 0) + 1;
                    saveData(user, players[user]);
                    broadcastState();
                }
                break;
            case "buyShip":
                if (user && players[user] && !players[user].ship && players[user].gold >= 100) {
                    players[user].gold -= 100;
                    players[user].ship = data.ship;
                    saveData(user, players[user]);
                    broadcastState();
                }
                break;
        }
    });
    ws.on('close', () => {
        if (user) delete players[user];
        broadcastState();
    });
});

function broadcastState() {
    leaderboard = Object.values(players)
        .map(p => ({ username: p.username, kills: p.kills || 0 }))
        .sort((a,b) => b.kills-a.kills)
        .slice(0,10);
    Object.values(players).forEach(p => {
        p.ws.send(JSON.stringify({
            type: "state",
            leaderboard,
            gold: p.gold || 0,
            kills: p.kills || 0,
            ship: p.ship || null,
            players: Object.values(players).map(op => ({
                username: op.username, x: op.x||0, z: op.z||0
            }))
        }));
    });
}
