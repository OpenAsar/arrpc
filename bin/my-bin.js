var child = childProcess.exec('node src')

child.stdout.on('data',
    function (data) {
        console.log(data);
	}
);