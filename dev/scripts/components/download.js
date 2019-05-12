import React from 'react'
import PropTypes from 'prop-types'
require("../../less/download.less")
const ENV = require("../../../env")
const {ipcRenderer} 	= $require('electron');
const context = require("../context")
const Conf = require("../../const")

class Download extends React.Component {
	constructor(props) {
		super(props)
		this.$loading_files 	= []
		this.$all_file_loaded 	= true
		this.$session_complete  = false
		this.$webview = React.createRef()
	}

	__add_loaded_file(url) {
		let index = this.$loading_files.indexOf(url)
		if (index != -1) {
			this.$loading_files.splice(index,1)
		}
		if (this.$loading_files.length == 0) {
			this.$all_file_loaded = true
			this.__on_complete()
		}
	}

	__on_complete() {
		if (this.$all_file_loaded && this.$session_complete) {
			this.props.complete()
		}
	}

	componentDidMount() {
		context.detector.uncheck()
		this.$downloaded_handler = (event, url, file) => {
			context.addDownloaded(url, file)
			this.__add_loaded_file(url)
			if (this.$webview_ready) {
				this.$webview.current.send("DOWNLOADED", url)
			}
		}
		ipcRenderer.on("DOWNLOADED", this.$downloaded_handler);
		this.$download_error_handler = (event, url) => {
			alert(`文件下载失败，${url}，请联系技术查看。`)
			this.__add_loaded_file(url)
			if (this.$webview_ready) {
				this.$webview.current.send("DOWNLOADERROR", url)
			}
		}
		ipcRenderer.on("DOWNLOADERROR", this.$download_error_handler);
		this.$webview.current.addEventListener("dom-ready", ()=>{
			if (ENV.TC_DEBUG) {
				this.$webview.current.openDevTools(); 
			}
			this.$webview_ready = true
			this.$webview.current.send("userinfo", this.props.user)
		});
		this.$webview.current.addEventListener('ipc-message', (event) => {
			if (event.channel == "completed") {
				this.$session_complete = true
				this.__on_complete()
			} else if (event.channel == "loadsound") {
				this.$all_file_loaded = false
				this.$loading_files.push(event.args[0])
				ipcRenderer.send("DOWNLOAD",event.args[0])
			}
		})
		console.log("download mount");
	}

	componentWillUnmount() {
		context.detector.check()
		this.$webview.current.loadURL("_blank")
		ipcRenderer.removeListener("DOWNLOADED", this.$downloaded_handler);
		ipcRenderer.removeListener("DOWNLOADERROR", this.$download_error_handler);
		console.log("download unmount");
	}

	render() {
		let prefix
		if (ENV.DEBUG) {
			prefix = "http://localhost:3000"
		} else if (ENV.TEST) {
			prefix = Conf.TEST_URL
		} else {
			prefix = Conf.ONLINE_URL
		}
		return (
			<div>
				<webview ref={this.$webview} className="download-webview" nodeintegration='true' src={`${prefix}/app/downloader.html?lesson=${this.props.name}&mode=check&t=${new Date().getTime()}`} partition="persist:kecheng"></webview>
			</div>
		)
	}
}

Download.propTypes = {
	name: PropTypes.string.isRequired,
	complete: PropTypes.func.isRequired,
	user: PropTypes.object.isRequired
}

export default Download