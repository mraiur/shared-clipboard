function portOnlyInput(e){
	let val = parseInt(e.srcElement.value, 10);
	if(val<1){
		e.srcElement.value = 1;
	} else if( val > 65353) {
		e.srcElement.value = 65353;
	}
}

window.addEventListener('DOMContentLoaded', () => {
	const runServerBtn = document.getElementById('runServer');
	const wsPortEl = document.getElementById('socket_port');
	const httpPortEl = document.getElementById('http_port');

	runServerBtn.addEventListener('click', runServer);
	wsPortEl.addEventListener('keyup', portOnlyInput)
	httpPortEl.addEventListener('keyup', portOnlyInput)

})

function runServer(){
	const wsPortEl = document.getElementById('socket_port');
	const httpPortEl = document.getElementById('http_port');

	let Data = {
		socketPort: wsPortEl.value,
		httpPort: httpPortEl.value
	};
	ipcRenderer.send('connect-app', Data);
	//window.location = `http://localhost:${httpPortEl.value}`
}

