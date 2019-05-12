const Eventer 	= require("./eventer")
const ENV   	= require("../../env")
const $ 		= require("jquery")
const Conf 		= require("../const")

class Session extends Eventer {
	constructor(inst) {
		super()
		this.$inst 		= inst
		this.$uuid 	 	= 0
		this.$_parts 	= []
		this.$jsready 	= false
		this.$queue		= []
	}

	uuid() {
		return ++this.$uuid
	}

	get view() {
		return this.$webview
	}

	init(dom) {
		// this.__bind()
		// this.__createWebview()

		this.$dom = $(dom)
		this.__createWebview()
		this.__bind()
		this.$dom.empty()
		this.$dom.append(this.$webview)
	}
	/**
	 * 创建webview
	 */
	__createWebview() {
		// $.get(`${prefix}/app?from=app&t=`+new Date().getTime(),(response)=>{
		// 	window.CANVAS_HOLDER   = "#course-content"
		// 	window.CANVAS_LOCATION = `${prefix}/app?from=app`
		// 	window.CANVAS_SIZE     = [ 
		// 		$("#course-content").width(), 
		// 		$("#course-content").height()
		// 	]
		// 	response.replace(/<link\s+href="([^"]+)"/g, (m,result)=>{
		// 		if (!/^\//.test(result)) {
		// 			result = "/app" + result
		// 		}
		// 		$(`<link href="${prefix+result}" rel="stylesheet"/>`).appendTo("head")
		// 		return
		// 	})
		// 	$(`<script cocos="true" src="${prefix}/cocos.js"></script>`).appendTo("head")
		// 	let scripts = []
		// 	response.replace(/<script.+?src="([^"]+)"/g, (m,result)=>{
		// 		if (/(flexible)|(zepto)/.test(result)) return
		// 		if (!/^\//.test(result)) {
		// 			result = "/app/" + result
		// 		}
		// 		scripts.push(prefix+result)
		// 		return
		// 	})
		// 	let _next = ()=>{
		// 		let script = scripts.shift()
		// 		if (script) {
		// 			$.getScript(script, ()=>{
		// 				_next()
		// 			})
		// 		}
		// 	}
		// 	_next()
		// })
		let prefix
		if (ENV.DEBUG) {
			prefix = "http://localhost:3000"
		} else if(ENV.TEST) {
			prefix = Conf.TEST_URL
		} else {
			prefix = Conf.ONLINE_URL
		}

		let webview   = $(`<webview class="webview" nodeintegration='true' src="${prefix}/app?from=app&t=${new Date().getTime()}" partition="persist:kecheng"></webview>`);
		this.$webview = webview[0];
	}

	reload() {
		if (this.$webview) {
			this.$webview.reload()
			this.$jsready = false
		}
	}

	__bind() {
		if (this.$webview) {
			this.$webview.addEventListener("dom-ready", ()=>{
				if (ENV.TC_DEBUG || ENV.TEST) {
					this.$webview.openDevTools(); 
				}
			});
			this.$webview.addEventListener('ipc-message', (event) => {
				if (event.channel == "message") {
					this.receive_message(event.args[0]);
				}
			})
		}
	}

	/**
	 * 向注入线程发送消息
	 * @param {*} data 
	 */
	send_message(type, data = {}, extra = {}) {
		if (this.$jsready) {
			let message = {
				message: data,
				from: this.$inst.props.account.id,
				to: "app",
				type
			}
			for(let key in extra) {
				message[key] = extra[key]
			}
			this.$webview.send('message', message);
		} else {
			this.$queue.push([type, data, extra])
		}
	}

	receive_message(message) {
		if (message.type == "jsready") {
			this.$jsready = true
			console.log("jsready..",this.$queue)
			this.$queue.forEach((message)=>{
				this.send_message(...message)
			})
			this.$queue = []
		}
		this.trigger("NEW_MESSAGE", message) 
	}

	destroy() {
		this.$_parts 	= []
		this.$jsready 	= false
		this.$queue		= []
		$(this.$webview).remove()
	}
}

module.exports = Session