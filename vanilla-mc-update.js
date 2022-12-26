require('dotenv').config();
const axios = require('axios');
const mcBuildsUrl = 'https://launchermeta.mojang.com/mc/game/version_manifest.json';
const fs = require('fs');
const crypto = require('crypto')
const path = require('path');
const os = require("os");

const expectedStructures = [
    "versions",
    "minecraft",
    "minecraft/logs",
    "minecraft/config",
    "minecraft/plugins",
];

for (let directoryIndex in expectedStructures) {
    if (!fs.existsSync(path.join(__dirname, expectedStructures[directoryIndex]))) {
        fs.mkdirSync(path.join(__dirname, expectedStructures[directoryIndex]));
    }
}

const eula = path.join(__dirname, 'minecraft', 'eula.txt');

if (!fs.existsSync(eula)) {
    fs.writeFileSync(path.join(__dirname, 'minecraft', 'eula.txt'), 'eula=true');
}
const supervisor = '/etc/supervisor/conf.d/minecraft.conf';
if (!fs.existsSync(supervisor) && os.platform() !== 'win32') {
    const text = fs.readFileSync(path.join(__dirname, 'minecraft.conf'), { encoding: 'utf-8' })
    // copy and replace our supervisor file
    fs.writeFileSync(supervisor, text.replace('JAVA_INSTALL_DIRECTORY', process.env.JAVA_INSTALL_DIRECTORY)
        .replace('MINECRAFT_USER', process.env.MINECRAFT_USER)
        .replace('MINECRAFT_GROUP', process.env.MINECRAFT_GROUP)
        .replace('HOME_PATH', process.env.HOME_PATH)
    );
}

function generateChecksum(str, algorithm, encoding) {
    return crypto
        .createHash(algorithm || 'sha1')
        .update(str, 'binary')
        .digest(encoding || 'hex');
}
async function downloadFile(outputLocationPath, fileUrl) {
    const writer = fs.createWriteStream(outputLocationPath);

    return axios({
        method: 'get',
        url: fileUrl,
        responseType: 'stream',
    }).then(response => {
        return new Promise((resolve, reject) => {
            response.data.pipe(writer);
            let error = null;
            writer.on('error', err => {
                error = err;
                writer.close();
                reject(err);
            });
            writer.on('close', () => {
                if (!error) {
                    resolve(true);
                }
            });
        });
    });
}
// Attempt to symlink the version we're downloading to the current version.
axios.get(mcBuildsUrl, {
    headers: { "Accept-Encoding": "gzip,deflate,compress" }
}).then(async (res) => {
    const latestRelease = res.data.versions.filter(f => f.type === "release")[0];

    const vanillaServerResponse = await axios.get(latestRelease.url, {
        headers: { "Accept-Encoding": "gzip,deflate,compress" }
    });
    const pathToSave = path.join(__dirname, 'versions', 'minecraft-vanilla-server-'+latestRelease.id+'.jar');

    await downloadFile(pathToSave, vanillaServerResponse.data.downloads.server.url);
});