const { snapshot } = require("process-list");

async function returned(){
	const tasks = await snapshot('pid', 'path', 'name');
	return tasks.filter(x => x.path).map(x => { return x }); //remove processes with empty paths
}

//Yes, I deleted win32.js, this script covers both win32 and linux (sorry mac users)

module.exports = returned();