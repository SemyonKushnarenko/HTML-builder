const fs = require('fs');
const path = require('path');
const fsPromises = require('fs/promises');
async function findFiles(searchPath) {
    let files = await fsPromises.readdir(path.join(__dirname, ...searchPath), { withFileTypes: true });
    let nFiles = [];
    for (let file of files) {
        if (file.isFile()) {
            file.path = searchPath;
            nFiles.push(file);
        }
    }
    return nFiles;
}
async function getStats() {
    let files = await findFiles(['secret-folder']);
    for (let file of files) {
        fs.stat(path.join(__dirname, ...file.path, file.name), (err, stats) => {
            if (err) {
                throw err;
            }
            const name = file.name.split('.')[0] === '' ? file.name : file.name.split('.').slice(0, -1).join('.');
            const extension = path.extname(path.join(__dirname, ...file.path, file.name));
            console.log(name + ' - ', extension.split('').slice(1).join('') + ' - ', stats.size / 1024 + 'KB');
        });
    }
}
getStats();