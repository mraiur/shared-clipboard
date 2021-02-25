const fs = require('fs');
const path = require('path');
const yargs = require('yargs');
const argv = yargs(process.argv).argv
const Koa = require('koa');
const WebSocket = require('ws');
const KoaRouter = require('koa-router');
const KoaStatic = require('koa-static');
const KoaBody = require('koa-body');
const KoaRender = require('koa-ejs');
const MimeTypes = require('mime-types');
const uploadMiddleware = KoaBody({multipart: true, uploadDir: './public/uploads'})
const uploadDir = path.join(__dirname, `../public/uploads/`)

const Config = {
	httpPort: argv.httpPort || 8080,
	wsPort: argv.wsPort || 9090
}

console.log(`Starting HTTP server on ${Config.httpPort} and socket on ${Config.wsPort}`)

const app = new Koa();
const router = new KoaRouter();

KoaRender(app, {
	root: path.join(__dirname, 'views'),
	layout: 'template',
	viewExt: 'html',
	cache: false,
	debug: true
});

let ClipboardList = [{
	type: 0,
	value: 'asdas asd as ',
	index: 0
}, {
	type: 0,
	value: 'asdas asd as 2',
	index: 1
}, {
	type: 0,
	value: 'asdas asd as 3',
	index: 2
}];

function notifyChange(){
	wss.clients.forEach( function each(client) {
		if(client.readyState === WebSocket.OPEN) {
			client.send('')
		}
	})
}

const excludeFiles = ['.gitignore'];
fs.readdirSync('./public/uploads').filter( (item) =>{
	return excludeFiles.indexOf(item);
}).forEach( (file) => {
	const fileIndex = file.match(/^([0-9]{1,9})/i);
	if(fileIndex){
		ClipboardList.push({
			type: 1,
			value: file,
			index: parseInt(fileIndex[0], 10)
		})
	}
})

router.get('/', async function (ctx) {
	await ctx.render('index', {Config});
});

router.get('/list', async (ctx, next) => {
	ctx.body = ClipboardList
	await next()
});

router.get('/list/:index', async (ctx, next) => {
	const searchIndex = parseInt(ctx.params.index, 10);
	const result = ClipboardList.filter( (item) => {
		return item.index === searchIndex;
	})[0];

	if(!result){
		ctx.body = "NOT FOUND!";
	} else if(result.type === 0) {
		ctx.body = result.value+'\n';
		console.log('Get text')
	} else if( result.type === 1 ){
		console.log('get file')
		ctx.body = `curl -o ${result.value} http://localhost:8080/download/${result.value}\n`;
	}
	await next();
});

router.get('/download/:fileName', async (ctx, next) => {
	console.log('===', ctx.params.fileName)
	ctx.body = fs.createReadStream(`./public/uploads/${ctx.params.fileName}`)
	ctx.attachment(ctx.params.fileName);
});

router.post('/upload', uploadMiddleware, async (ctx, next) => {
	try{
		const uploadFile = ctx.request.files.file;
		const fileExtension = MimeTypes.extension(uploadFile.type);
		const fileName = ClipboardList.length+'_'+uploadFile.name.replace(new RegExp(/ /gi), '_');
		ClipboardList.push({
			type: 1,
			value: fileName
		})
		fs.copyFileSync(uploadFile.path, `public/uploads/${fileName}`);
		ctx.body = {
			msg: 'success'
		};
		notifyChange();
	} catch(err) {
		console.log("err", err);
		ctx.body = {
			msg: 'error'
		}
	}
	await next();
})

router.post('/clearList', async (ctx, next) => {
	const files = fs.readdirSync(uploadDir).filter( (item) =>{
		return excludeFiles.indexOf(item);
	});

	files.forEach((file) => {
		fs.unlinkSync(path.join(uploadDir, file))
	});
	ClipboardList = [];

	ctx.body = {
		status: 'success'
	}
	await next();
});

app
	.use(router.routes())
	.use(router.allowedMethods())
	.use(KoaStatic(__dirname + '/../public'))
	.listen(Config.httpPort);

const wss = new WebSocket.Server({ port: Config.wsPort });

wss.on('connection', function connection(ws) {
	ws.on('message', function incoming(message) {
		console.log('received: %s', message);
		ClipboardList.push({ type : 0, value: message, index: ClipboardList.length});
		notifyChange();
	});

	ws.send('something');
});
