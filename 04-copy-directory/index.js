const path = require('path');
const fsPromises = require('fs/promises');

async function findFiles(searchPath) {
    let files = await fsPromises.readdir(path.join(__dirname, ...searchPath), { withFileTypes: true });
    let nFiles = [];
    let nDirectories = [];
    for (let file of files) {
        file.path = searchPath;
        if (file.isFile()) {
            nFiles.push(file);
        }
        else if (file.isDirectory()) {
            let newSearchPath = [...searchPath];
            newSearchPath.push(file.name);
            let newFiles = await findFiles(newSearchPath);
            nFiles = [...nFiles, ...newFiles[0]];
            nDirectories.push(file);
        }
    }
    return [nFiles, nDirectories];
}

async function copyFiles(copyFrom, copyTo) {
    await fsPromises.mkdir(path.join(__dirname, ...copyTo), { recursive: true });
    await removeFiles(copyTo);
    let files_directories = await findFiles(copyFrom);
    let files = files_directories[0];
    let directories = files_directories[1];
    directories.forEach(async (directory) => {
        let newPath = [...directory.path];
        newPath[0] = path.join(...copyTo);
        await fsPromises.mkdir(path.join(__dirname, ...newPath, directory.name), { recursive: true });

    });

    files.forEach(async file => {
        let newPath = [...file.path];
        newPath[0] = path.join(...copyTo);
        await fsPromises.copyFile(path.join(__dirname, ...file.path, file.name), path.join(__dirname, ...newPath, file.name));
    });
}

async function removeFiles(copyTo) {
    let files_directories = await findFiles(copyTo);
    let files = files_directories[0];
    let directories = files_directories[1];
    for (const file of files) {
        await fsPromises.rm(path.join(__dirname, ...file.path, file.name));
    }
    for (const file of directories) {
        await fsPromises.rmdir(path.join(__dirname, ...file.path, file.name));
    }
}

copyFiles(['files'], ['files-copy']);