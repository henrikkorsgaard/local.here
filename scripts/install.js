var fs = require('fs');
try {
    // Query the entry
    stats = fs.statSync('/boot');

    // Is it a directory?
    if (stats.isDirectory()) {
        console.log("yes");
    } else {
        console.log("no");
    }
}
catch (e) {
    console.log(e);
}
