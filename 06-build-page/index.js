const path = require('path');
const fs = require('fs');
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

async function findFilesByExtension(searchPath, extension) {
    let files = await fsPromises.readdir(path.join(__dirname, ...searchPath), { withFileTypes: true });
    let nFiles = [];
    for (let file of files) {
        if (file.isFile() && path.extname(path.join(__dirname, ...searchPath, file.name)) === extension) {
            file.path = searchPath;
            nFiles.push(file);
        }
    }
    return nFiles;
}
async function bundleStyles(searchPath, pathToBundle) {
    let files = await findFilesByExtension(searchPath, '.css');
    await fsPromises.writeFile(path.join(__dirname, ...pathToBundle, 'style.css'), '');
    files.forEach(async file => {
        const readableStream = fs.createReadStream(path.join(__dirname, ...file.path, file.name), 'utf-8');
        readableStream.on('data', async chunk => {

            await fsPromises.appendFile(path.join(__dirname, ...pathToBundle, 'style.css'), chunk);
        });
    });
}

async function buildHtml(componentsFolder, pathToBundle) {
    let files = await findFilesByExtension(componentsFolder, '.html');
    await fsPromises.writeFile(path.join(__dirname, ...pathToBundle, 'index.html'), '');
    const readableStream = fs.createReadStream(path.join(__dirname, 'template.html'), 'utf-8');
    let htmlTemplateContent = '';
    readableStream.on('data', chunk => htmlTemplateContent += chunk);
    readableStream.on('end', () => {
        files.forEach(file => {
            const readableStream = fs.createReadStream(path.join(__dirname, ...componentsFolder, file.name), 'utf-8');
            let htmlPartContent = '';
            const name = file.name.split('.')[0] === '' ? file.name : file.name.split('.').slice(0, -1).join('.');
            readableStream.on('data', chunk => htmlPartContent += chunk);
            readableStream.on('end', async () => {
                htmlTemplateContent = htmlTemplateContent.split(`{{${name}}}`).join(htmlPartContent);
                await fsPromises.writeFile(path.join(__dirname, ...pathToBundle, 'index.html'), htmlTemplateContent);
            });
        });
    });
}

async function bundle(pathToBundle) {
    await fsPromises.mkdir(path.join(__dirname, ...pathToBundle), { recursive: true });
    buildHtml(['components'], pathToBundle);
    bundleStyles(['styles'], pathToBundle);
    copyFiles(['assets'], [...pathToBundle, 'assets']);
}

bundle(['project-dist']);