let ws, body, listEl, tooltipEl, uploadDropArea

function preventDefaults (e) {
	e.preventDefault()
	e.stopPropagation()
}

function highlight(e){
	uploadDropArea.classList.add('highlight');
}

function unhighlight(e){
	uploadDropArea.classList.remove('highlight');
}

function handleDrop(e) {
	let dt = e.dataTransfer;
	let files = dt.files;

	handleFiles(files);
}

function handleFiles(files){
	([...files]).forEach(uploadFile)
}

function uploadFile(file){
	let url = '/upload';
	let formData = new FormData();

	formData.append('file', file);

	fetch(url, {
		method: 'POST',
		body: formData
	}).then(() => {
		console.log("sucess")
	}).catch( (err) => {
		console.log("error", err)
	});
}

function rowClick (ev) {
	const data = this.data;
	const el = this.el;
	tooltipEl.classList.add('show_active')

	const rect = el.getBoundingClientRect();
	const left = ( window.pageXOffset || document.documentElement.scrollLeft) + rect.left;
	const top = ( window.pageYOffset || document.documentElement.scrollTop ) + rect.top;

	tooltipEl.style.top = (top-32)+'px'
	tooltipEl.style.left = ((left < 200 ) ? 200 : left)+'px'
	setTimeout(() => {
		tooltipEl.classList.remove('show_active')
	}, 1000)

	if (data.type === 0){
		var promise = navigator.clipboard.writeText(data.value)
	} else if( data.type === 1) {
		console.log("file", data.value)
		window.location.href = `/download/${data.value}`
	}
}

function confirmClear(){
	const result = confirm('Clean list');
	if( result === true ){
		fetch('/clearList', {
			method: 'POST'
		}).then(() => {
			console.log("sucess")
			window.location.reload();
		}).catch( (err) => {
			console.log("error", err)
		});
	}
}

function renderList(list) {
	list.reverse()
	list.forEach( (item, i) => {
		if( document.querySelectorAll('[data-item_id="'+item.index+'"]').length === 0) {
			let el = document.createElement('div')
			el.dataset.item_id = item.index
			el.classList = ['row']
			el.innerText = `${item.type===0?'text':'file'} | ${item.value}`
			el.onclick = rowClick.bind({ data: item, el: el})
			listEl.appendChild(el)
		}
	})
}

function loadList() {
	const request = new Request('/list')
	fetch(request)
		.then(response => {
			if(response.status === 200) {
				return response.json()
			} else {
				console.log('Failed fetching list')
			}
		})
		.then(renderList)
		.catch(err => {
			console.log("Failed", err)
		})
}

function attachEvents(){
	ws.onopen = function(event) {
		console.log("opened socket")
	}

	ws.onmessage = function(event){
		loadList()
	}

	body.addEventListener('paste', (event) => {
		let paste = (event.clipboardData || window.clipboardData).getData('text')
		ws.send(paste)
	});

	['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName=>{
		uploadDropArea.addEventListener(eventName, preventDefaults, false)
	});

	['dragenter', 'dragover'].forEach( (eventName) => {
		uploadDropArea.addEventListener(eventName, highlight, false);
	});
	['dragleave', 'drop'].forEach( (eventName) => {
		uploadDropArea.addEventListener(eventName, unhighlight, false);
	});

	uploadDropArea.addEventListener('drop', handleDrop, false)
}

function onLoad(){
	ws = new WebSocket(`ws://localhost:${Config.wsPort}`)
	body = document.body
	listEl = document.getElementById('list')
	tooltipEl = document.getElementById('tooltip')
	uploadDropArea = document.getElementById('upload-drop-area')

	loadList()
	attachEvents()
}