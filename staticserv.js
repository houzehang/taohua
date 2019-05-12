const path = require('path')
const fs   = require('fs-extra')
const {ipcMain,app} = require('electron');
const logger = require('electron-log');
const got = require("got")
const {DEBUG}   = require('./env.js');

class StaticServer {
	constructor(entity) {
		this.$downloading 	= false
		this.$down_queue 	= []
		this.$entity 		= entity
		this.$dir = path.join(app.getPath("userData"),"class_sounds");
		this.__clearCache()
		logger.log("download dir",this.$dir);
		ipcMain.on("DOWNLOAD", (event, url)=>{
			if (!url) return
			this.__log("on download message",url);
			this.__download(url)
		})
	}

	__clearCache () {
		this.__log("clear cache..")
		let files = [], dir = this.$dir
		if (fs.existsSync(dir)) {
			files = fs.readdirSync(dir)
			files.forEach((file)=>{
				let curPath = path.join(dir, file)
				if (/\.mp3/.test(curPath)) {
					fs.unlinkSync(curPath)
				}
			})
		}
	};

	__log(...params) {
		logger.log(...params);
	}

	__do_download(url, file) {
		console.log("call do download", url, file)
		let task
		try {
			task = got(url, { encoding: null, timeout: {socket: 60000}})
		} catch(e) {
			error = e
		}
		if (
			!task ||
			typeof task.on !== 'function' ||
			typeof error !== 'undefined'
		) {
			if (!error) {
				error = new Error('unknown error');
			}
			this.$entity.webContents.send('DOWNLOADERROR', url);
			logger.error('[Download Error]', error.message);
			logger.error(error.stack);
			return;
		}
		task.then((response) => {
			return fs.outputFile(file, response.body);
		}).then(() => {
			logger.info(`downloaded ${url}, ${file}`);
			this.$entity.webContents.send('DOWNLOADED', url, file);
		}).catch(err => {
			logger.error(`download error ${url} ${err}`)
			this.$entity.webContents.send('DOWNLOADERROR', url);
		})
	}

	__download(url) {
		if (url) {
			// 判断本地硬盘是否存在文件
			let name = url.match(/([^\/]+)$/)
			if (name) {
				let file = path.join(this.$dir,name[1])
				if (fs.existsSync(file)) {
					this.__log('Download file already exist', url)
					this.$entity.webContents.send('DOWNLOADED', url, file);
					this.__download()
					return
				} else {
					this.__do_download(url, file)
				}
			} else {
				this.$entity.webContents.send('DOWNLOADERROR', url);
			}
		}
	}
}

module.exports = StaticServer