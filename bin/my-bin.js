var join = require('path').join
var childProcess = require('child_process');
var args = process.argv.slice(2);

args.unshift(__dirname + '/../'); 

var child = childProcess.exec('node src')

child.stdout.on('data',
    function (data) {
        console.log(data);
    });