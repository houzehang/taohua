const Const 	= require("../const")
const Q 		= require("q")
const Eventer   = require('./eventer')

class TencentStream extends Eventer {
	constructor(inst) {
		super()
		this.$prefix = "userid_web_"
		this.inst = inst
		this.$roomId = Const.ROOM_ID
		this.$streams_list 	= []
		this.$streams_hash 	= {}
	}

	__init() {
		return Q.Promise((resolve, reject)=>{
			if (this.$inited) {
				resolve()
			} else {
				$.ajax({
					method : 'POST',
					contentType:'application/json;charset=utf-8',
					url: "http://xzb.qcloud.com/webrtc/weapp/webrtc_room/get_login_info",
					data: JSON.stringify({
						"userID" : this.$prefix + this.inst.props.account.id
					}),
					success: (response)=>{
						this.$rtc = new WebRTCAPI({
							sdkAppId   	: response.sdkAppID,
							accountType	: response.accountType,
							userId	    : response.userID,
							userSig 	: response.userSig
						}, ()=>{
							let audio = null, video = null
							this.$rtc.getVideoDevices((devices)=>{
								console.log(devices)
								devices.forEach((item)=>{
									if (/facetime/i.test(item.label) && item.kind == "videoinput") {
										video = item.deviceId
									}
								})
								this.$rtc.getAudioDevices((devices)=>{
									console.log(devices)
									devices.forEach((item)=>{
										if (/(built-in)|(内建)/i.test(item.label) && item.kind == "audioinput") {
											audio = item.deviceId
										}
									})
									if (audio && video) {
										resolve()
									} else {
										reject()
									}
								})
							})
							this.$video_device_id = video
							this.$audio_device_id = audio
						}, (error)=>{
							console.log("init failed",error)
							reject()
						})
					},
					fail: ()=>{
						reject()
					}
				});
			}
		})
	}

	__add_stream(stream) {
		let id = stream.id
		let index = this.$streams_hash[id]
		if (index == undefined) {
			this.$streams_list.push(stream)
			this.$streams_hash[id] = this.$streams_list.length-1
		} else {
			this.$streams_list[index] = stream
		}
		this.stream_audio(id)
	}

	__remove_stream(stream) {
		let id = stream.id
		let index = this.$streams_hash[id]
		this.$streams_list.splice(index,1)
		this.$streams_hash = {}
		this.$streams_list.forEach((item,index)=>{
			this.$streams_hash[item.getId()] = index
		})
	}

	__get_stream(id) {
		let index = this.$streams_hash[id]
		return this.$streams_list[index]
	}

	__isMuted(id) {
		let muted = false
		if (!this.inst.props.students) {
			return true
		}
		for(let i=0,len=this.inst.props.students.length;i<len;i++) {
			let item = this.inst.props.students[i]
			if (item.id == id) {
				return !item.unmuted
			}
		}
	}

	stream_audio(id) {
		if (id != this.inst.props.account.id) return
		let isMaster = this.inst.props.room.teacher_id == id
		let muted  = this.__isMuted(id)
		if (muted && !isMaster) {
			console.log("disable audio",id)
			this.$rtc.closeAudio()
		} else {
			console.log("enable audio",id)
			this.$rtc.openAudio()
		}
	}

	__make_stream(data) {
		if (data.userId && typeof data.userId == "string") {
			data.userId = data.userId.replace(this.$prefix, "") - 0
		}
		if (!data.stream) {
			data.stream = {}
		}
		data.stream.getId = ()=>{
			return data.userId || this.inst.props.account.id
		}
		data.stream.play = (target)=>{
			let id 	  = data.stream.getId()
			let video = $(`#video${id}`)
			if (video.length > 0) {
				video.css({
					width  		: "100%",
					height 		: "100%",
					background	: "#000"
				})
				video[0].srcObject = data.stream
			}
		}
		data.stream.from = "tencent"
	}

	start() {
		this.__init().then(()=>{
			this.$rtc.on("onLocalStreamAdd", (data)=>{
				if( data && data.stream){
					this.__make_stream(data)
					this.__add_stream(data.stream)
					this.stream_audio(data.stream.id)
					this.trigger("NEW_STREAM", data.stream)
				}
			});
			//远端流 新增/更新
			this.$rtc.on("onRemoteStreamUpdate", (data)=>{
				if( data && data.stream){
					console.log("onRemoteStreamUpdate",data.stream)
					this.__make_stream(data)
					let video = $(`#video${data.stream.getId()}`)
					if (video.length > 0) {
						video[0].srcObject = null
					}
					this.trigger("NEW_STREAM", data.stream)
					this.__add_stream(data.stream)
				} else {
					console.log("onRemoteStreamUpdate no stream",data)
				}
			});
			this.$rtc.on("onRemoteStreamRemove", (data)=>{
				console.log("onRemoteStreamRemove",data)
				this.__make_stream(data)
				if(data.userId){
					let id 	  = data.userId
					let video = $(`#video${id}`)
					if (video.length > 0) {
						video[0].srcObject = null
					}
					$(`#player_${id}`).remove()
					console.log($(`#player_${id}`).length)
					this.trigger("REMOVE_STREAM", data.stream)
					this.__remove_stream(data.stream)
				}
			});
			this.$rtc.on("onWebSocketClose", ()=>{
				
			});
			this.$rtc.on("onRelayTimeout", ()=>{
				
			});
			this.$rtc.on("onKickout", ()=>{
				
			});
			this.$rtc.createRoom({
				roomid: this.$roomId,
				role  : "miniwhite"
			}, (result)=>{
				console.log("create room success",result)
			}, (error)=>{
				console.log("create room failed",error)
			})
		},()=>{}).done()
	}

	leave() {
		this.$rtc.quit(()=>{
			console.log("退出房间成功！")
		},(error)=>{
			console.log("退出房间失败！",error)
		})
	}

}

module.exports = TencentStream

