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
const paperBuildUrl = 'https://api.papermc.io/v2/projects/paper/version_group/1.19/builds';

const buildDLUrl = (fullVersion, buildId, name) => 'https://api.papermc.io/v2/projects/paper/versions/'+ fullVersion + '/builds/'+ buildId + '/downloads/' + name;
// Attempt to symlink the version we're downloading to the current version.
axios.get(mcBuildsUrl, {
    headers: { "Accept-Encoding": "gzip,deflate,compress" }
}).then(async (res) => {
    const latestRelease = res.data.versions.filter(f => f.type === "release")[0];
    const [major, minor] = latestRelease.id.split('.');
    const paperMcUrl = 'https://api.papermc.io/v2/projects/paper/version_group/'+major+'.'+minor+'/builds';

    const paperResponse = await axios.get(paperMcUrl, {
        headers: { "Accept-Encoding": "gzip,deflate,compress" }
    });
    const paperMcVersions = paperResponse.data.builds.filter(build => build.version === latestRelease.id && build.channel === 'default')
        .sort((a, b) => b.build - a.build )
        .map((build) => {
        return {
            ...build,
            url: buildDLUrl(latestRelease.id, build.build, build.downloads.application.name),
        };
    });

    const paperMc = path.join(__dirname, 'versions', 'minecraft-'+paperMcVersions[0].downloads.application.name);
    await downloadFile(paperMc, paperMcVersions[0].url);
    fs.symlinkSync(paperMc, path.join(__dirname, "minecraft/server.jar"));
});