var fs = require('fs');
try {
    // Query the entry
    stats = fs.statSync('/boot');

    if (stats.isDirectory()) {
        fs.createReadStream('webstrate-pi-example-config-file.txt').pipe(fs.createWriteStream('/boot/webstrate-pi.config'));
    } else {
        fs.createReadStream('webstrate-pi-example-config-file.txt').pipe(fs.createWriteStream('webstrate-pi.config'));
    }
}
catch (e) {
    fs.createReadStream('webstrate-pi-example-config-file.txt').pipe(fs.createWriteStream('webstrate-pi.config'));
}
