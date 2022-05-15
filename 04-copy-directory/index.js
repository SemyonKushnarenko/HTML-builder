// const fs = require('fs');
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

async function createFiles(folderCopyFrom, folderCopyTo) {
    let filesAndDirectories = await findFiles([folderCopyFrom]);
    let files = filesAndDirectories[0];
    let directories = filesAndDirectories[1];
    directories.sort((a, b) => a.path.length - b.path.length);

    directories.forEach(async file => {
        const newPath = [...file.path];
        newPath[0] = folderCopyTo;
        await fsPromises.mkdir(
            path.join(__dirname, ...newPath, file.name),
            {recursive: true}
        );
    });

    files.forEach(async file => {
        const newPath = [...file.path];
        newPath[0] = folderCopyTo;
        await fsPromises.copyFile(
            path.join(__dirname, ...file.path, file.name),
            path.join(__dirname, ...newPath, file.name)
        );
    });
} 

async function createCopy(copyFrom, copyName) {
    await fsPromises.mkdir(path.join(__dirname, copyName), {recursive: true});
    await createFiles(copyFrom, copyName);
}

createCopy('files', 'files-copy');