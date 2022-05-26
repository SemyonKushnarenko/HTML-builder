const fs = require('fs');
const path = require('path');
const readline = require('node:readline');
const { stdout, stdin } = process;

stdout.write('Enter text:\n');

const rl = readline.createInterface({input: stdin, output: stdout});

fs.writeFile(path.join(__dirname, 'destination.txt'), '', (err) => {
    if (err) throw err;
});

rl.on('line', (line) => {
    const readableData = line.toString();
    if (line.trim() === 'exit') {
        rl.close();
    }
    fs.appendFile(path.join(__dirname, 'destination.txt'), readableData, (err) => {
        if (err) throw err;
    });
});

process.on('exit', () => stdout.write('\nGood luck!'));
