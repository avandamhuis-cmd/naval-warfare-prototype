// Simple local file-based data persistence (for prototype)
const fs = require('fs');
const DB_FILE = 'playerdata.json';

function loadData(username) {
    let db = {};
    if (fs.existsSync(DB_FILE)) db = JSON.parse(fs.readFileSync(DB_FILE));
    return db[username] || null;
}

function saveData(username, data) {
    let db = {};
    if (fs.existsSync(DB_FILE)) db = JSON.parse(fs.readFileSync(DB_FILE));
    db[username] = data;
    fs.writeFileSync(DB_FILE, JSON.stringify(db));
}

module.exports = { loadData, saveData };
