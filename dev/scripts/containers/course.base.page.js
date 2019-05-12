import React from 'react';
import StudentHead from '../components/student-head'
import HandsUp from '../components/handsup'

const net = require("../network")
const Room = require("../AgoraStream")
const Signalize = require('../AgoraSignal')
const Session = require('../session')
const Const = require('../../const')
const { ipcRenderer } = $require('electron');
const context = require('../context')
const $ = require("jquery")

class Course extends React.Component {
	constructor(props) {
		super(props)
		this.$uuid = 0
		this.$stat_arr = []
		this.$session = new Session(this)

		this.$room = new Room(this)
		this.$signal = new Signalize(this)
		this.$audios_files = {}
		this.$downloaded_handler = (event, url, file) => {
			context.addDownloaded(url, file)			
		}
		ipcRenderer.on("DOWNLOADED", this.$downloaded_handler);
		
		if (context && context.detector) {
			context.detector.waring_threshold = 2;
		}
	}

	get uuid() {
		return ++this.$uuid
	}

	isMaster(id) {
		console.log('course.base.page isMaster called',this.props.room);
		if (!id) {
			id = this.props.account.id
		}
		for (let i = 0, len = this.props.room.teachers.length; i < len; i++) {
			let item = this.props.room.teachers[i]
			if (item.id == id) {
				return true
			}
		}
	}


	isChairMaster(id) {
		if (!id) {
			id = this.props.account.id
		}
		return this.props.room.teacher_id == id
	}

	isSubMaster(id) {
		if (!id) {
			id = this.props.account.id
		}
		return this.isMaster(id) && !this.isChairMaster(id)
	}

	getUser(id) {
		if (id == this.props.teacher.id) {
			return this.props.teacher
		}
		for (let i = 0, len = this.props.students.length; i < len; i++) {
			let item = this.props.students[i]
			if (item.id == id) {
				return item
			}
		}
	}

	__load_sound(url) {
		if (!context.getDownloaded(url)) {
			console.log("call load file...", url)
			ipcRenderer.send("DOWNLOAD", url)
		}
	}

	playMusic(url, needevent) {
		this.stopMusic()
		let soundUrl = url, localFile = context.getDownloaded(url)
		if (localFile) {
			soundUrl = localFile
		}
		let result = this.$room.rtc.startAudioMixing(soundUrl, true, false, 1)
		net.log({ name: "play music", soundUrl, needevent, result })
		if (needevent) {
			this.$playing = url
			this.$session.send_message("soundupdate", { url: this.$playing, time: 0 })
		} else {
			this.$playing = false
		}
	}

	stopMusic(noevent) {
		let result = this.$room.rtc.stopAudioMixing()
		console.log("stop audio mix", result)
		if (this.$playing) {
			if (!noevent) {
				this.$session.send_message("soundended", { url: this.$playing })
			}
			this.$playing = null
		}
	}

	componentWillUnmount() {
		this.$signal.leave()
		this.$room.leave()
		this.$session.destroy()
		clearInterval(this.$tick_timer)
		clearInterval(this.$music_timer)
		clearTimeout(this.$back_timer)
		clearTimeout(this.$put_timer)
		$(`#dancing-head`).empty()
		$('.avatar-head').empty()
		clearTimeout(this.$reload_timer)
		$(window).off("resize")
		this.props.hideLoading()
		context.detector.check()
		this.onHotKey = null;
		ipcRenderer.removeListener("DOWNLOADED", this.$downloaded_handler);
	}

	componentDidMount() {
		context.detector.uncheck()
		this.$reload_timer = null
		$(window).on("resize", () => {
			clearTimeout(this.$reload_timer)
			this.$reload_timer = setTimeout(() => {
				this.$session.reload()
				// 发送init room message
				this.__send_init_room()
			}, 1000)
		})
		this.$room.init()
		this.$room.on("NEW_STREAM", (stream) => {
			// 判断是不是主班老师
			let id = stream.getId()
			let isSubMaster = this.isSubMaster(id)
			if (isSubMaster) {
				return
			}
			this.props.onNewStream(stream);

			// let found = false;
			// let all_users = [this.props.teacher].concat(this.props.students);
			// all_users.forEach((user)=>{
			// 	if (user.id == id) {
			// 		found = true;
			// 	}
			// });

			// if (!found) {
			// 	this.__query_roominfo_more();
			// }
		})
		this.$room.on("REMOVE_STREAM", (stream) => {
			this.props.onStreamLeave(stream)
			// 老师监听到有人退出如果还在上台，则发送他下台指令
			if (this.isChairMaster()) {
				let id = stream.getId()
				if (id) {
					if (this.$last_dancing == id) {
						this.$session.send_message(Const.BACK_DANCE, { id })
					}
				}
			}
		})
		this.$room.on("ADD_ROOM", (id) => {
			// 新用户加入
			this.props.onUserAddRoom(id)
			this.$room.refreshMute()
		})
		this.$room.rtc.on("networkquality", (uid, tx, rx) => {
			console.log("网络状态：", uid, tx, rx)
			if (uid == 0) {
				let status = Math.max(tx, rx)
				if (status == 1 || status == 2) {
					status = 1
				} else if (status == 3) {
					status = 2
				} else if (status == 4) {
					status = 3
				} else if (status == 5) {
					status = 4
				} else {
					status = 0
				}
				this.$stat_arr.push(status)
				if (this.$stat_arr.length >= 3) {
					let sum = 0
					this.$stat_arr.forEach((status) => {
						sum += status
					})
					status = sum / this.$stat_arr.length >> 0
					context.detector.setStatus(status)
					this.$stat_arr = []
				} else {
					context.detector.setStatusOnce(status)
				}
			}
		})
		let $waiting_timer = null
		this.$signal.on("RECONNECT_SIGNAL", () => {
			this.props.showLoading("网络不稳定哦，正在重连中~")
		})
		this.$signal.on("CONNECT_SIGNAL", () => {
			this.props.showLoading("正在连线其他人，稍等一下~")
			$waiting_timer = setTimeout(() => {
				this.props.showLoading("当前网络环境不太好哦，耐心等一等吧~")
			}, 6000)
		})
		this.$signal.on("HIDE_LOADING", () => {
			this.props.hideLoading()
			clearTimeout($waiting_timer)
		})
		this.$signal.on("NETWORK_BAD", () => {
			this.props.showLoading("网络状态不佳，稍等一下~")
		})
		this.$signal.on("CONNECTED_SIGNAL", () => {
			this.props.hideLoading()
			clearTimeout($waiting_timer)
			this.$session.send_message("signal_connected")
		})
		this.$signal.on("RECONNECTED_SIGNAL", () => {
			// 重新连接上，拉取最新消息
			this.$session.send_message("signal_reconnected")
		})
		this.$signal.on("CONNECT_SIGNAL_ERROR", () => {
			this.props.showLoading("当前网络环境不太好哦，耐心等一等吧~")
			clearTimeout($waiting_timer)
		})
		this.$signal.on("CONNECT_KICKED", () => {
			this.props.showLoading("有人登录了你的帐号哦~")
			clearTimeout($waiting_timer)
		})
		this.$signal.on("CHANNEL_NEW_USER", (response) => {
			this.$session.send_message(Const.MEMBER_ADD, {}, {
				userinfos: response.userinfos
			})
			console.log("channel new user...", response.userinfos)
		})
		// this.$signal.on("CHANNEL_NEW_USER_LATE", (response) => {
		// 	let users = response.users;
		// 	users = users.filter((userId)=>{
		// 		return !this.isMaster(userId);
		// 	});
		// 	if (users.length > 0) {
		// 		this.__query_roominfo_more(response.retry);
		// 	}
		// })
		this.$signal.on("CHANNEL_USER_LEAVE", (id) => {
			this.$session.send_message(Const.MEMBER_LEAVE, {
			}, {
				userinfos: [id]
			})
		})
		this.$signal.on("NEW_MESSAGE", (message) => {
			console.log("receive new from app", message)
			this.__on_signal_message(message)
		})
		this.$session.on("NEW_MESSAGE", (message) => {
			this.__on_session_message(message)
		})
		this.__query_roominfo_more();
		this.$session.init("#course-content")
		net.getServerTime().then((res) => {
			this.setState({ time: res.time * 1000 });
			this.setState({ time_diff: res.time * 1000 - Date.now() });
		})
		this.$room.rtc.on("audiomixingfinished", () => {
			console.log("on audiomixingfinished", this.$playing)
			if (this.$playing) {
				this.$session.send_message("soundended", { url: this.$playing })
				this.$playing = null
			}
		})
		this.__tick()
	}

	__get_server_time(){
		return Date.now() + (this.state.time_diff || 0);
	}

	__query_roominfo_more(callback){
		console.log('start querying more roominfo...');
		this.$roominfo_callbacks = this.$roominfo_callbacks || [];
		if (callback) {
			this.$roominfo_callbacks.push(callback);
		}

		if(this.$roominfo_networking){
			return;
		}

		this.$roominfo_networking = true;
		net.getRoomInfo(this.props.room.channel_id).then((result) => {
			this.$roominfo_networking = false;
			
			this.props.onRoomMoreInfo(result)
			this.$room.start()
			this.$signal.join()
			this.__send_init_room()

			this.$roominfo_callbacks.forEach((_callback)=>{
				_callback(true);
			})
			this.$roominfo_callbacks = null;
		}).done()
	}

	__get_feature(uid){
		console.log('__get_feature,uid:',uid);
		if(!uid){
			uid = this.props.account.id;
		}
		let result;
		this.props.students.map((student)=>{
			if (student && student.id == uid) {
				result = student.frature;
			}
		});
		return result;
	}

	__get_feature_hash(){
		let result = {};
		this.props.students.map((student)=>{
			if (student && student.id) {
				result[student.id] = student.frature;
			}
		});
		return result;
	}

	__send_init_room() {
		// 发送init-room
		let masters = []
		this.props.room.teachers.forEach((teacher) => {
			masters.push(teacher.id)
		})
		let userinfos = [this.props.teacher]
		userinfos = userinfos.concat(this.props.students)
		this.$session.send_message(Const.INIT_ROOM, {
			channel_id: this.props.room.channel_id,
			token: net.token
		}, {
			master_ids: masters,
			userinfos: userinfos,
			feature_data: this.__get_feature_hash()
		})
	}

	__tick(extra) {
		this.$tick_timer = setInterval(() => {
			this.props.onCourseTick()
			extra && typeof extra === 'function' && extra();
		}, 1000)
		this.$music_timer = setInterval(() => {
			if (this.$playing) {
				// 检测播放音乐
				let time = this.$room.rtc.getAudioMixingCurrentPosition()
				this.$session.send_message("soundupdate", { url: this.$playing, time })
			}
		}, 100)
	}

	__on_session_message(message, force) {
		if (message.to == "app" || force) {
			let data = message.message, result
			switch (message.type) {
				case Const.JS_READY:
					break
				case Const.OPEN_MIC:
					this.props.onUserMuted(data.uid, false, message.to == "app")
					this.$room.refreshMute()
					break
				case Const.CLOSE_MIC:
					this.props.onUserMuted(data.uid, true)
					this.$room.refreshMute()
					break
				case Const.ENABLE_MAGIC:
					this.props.onMagicSwitch(true)
					break
				case Const.DISABLE_MAGIC:
					this.props.onMagicSwitch(false)
					break
				case Const.MUTE_ALL:
					this.props.onMuteAllSwitch(true)
					this.$room.refreshMute()
					break
				case Const.UNMUTE_ALL:
					this.props.onMuteAllSwitch(false)
					this.$room.refreshMute()
					break
				case Const.SHOW_RANKS:
					this.props.onRankSwitch(true)
					break
				case Const.HIDE_RANKS:
					this.props.onRankSwitch(false)
					break
				case Const.PUT_DANCE:
					this.props.onDancing(data.id, true, message.to == "app")
					this.$room.refreshMute()
					break
				case Const.BACK_DANCE:
					this.props.onDancing(data.id, false)
					this.$room.refreshMute()
					break
				case Const.START_COURSE:
					this.setState({ control: false })
					this.props.onBeginCourse()
					break
				case "playsound":
					let url = data.url, needevent = data.needevent
					this.playMusic(url, needevent)
					break
				case "stopsound":
					let noevent = data.noevent
					this.stopMusic(noevent)
					break
				case "showdraft":
					this.showDraft(data.content)
					break
				case "showfeature":
					this.showFeature(data.feature);
				case "loadsound":
					this.__load_sound(data.url)
					break
				case "course-process":
					this.setState({ process: data })
					break
				default:
					if (message.type.indexOf("*") == -1) {
						this.__on_signal_message(message)
					}
					break
			}
		} else {
			this.$signal.send(message)
		}
	}
	
	// 是否处于弱网络状态
	__in_weak_net() {
		return this.props.netStatus == 0 && !this.isMaster()
	}

	showDraft(draft) {
		if (this.isMaster()) {
			this.setState({ draft })
		}
	}

	showFeature(feature){
		if (this.isMaster()) {
			this.setState({ feature })
		}
	}

	hideDraft() {
		this.setState({ draft: null })
	}
	
	__on_signal_message(message) {
		let data = message.message
		switch (message.type) {
			case "closeroom":
				this.leaveCourse()
				break
			case Const.OPEN_MIC:
			case Const.CLOSE_MIC:
			case Const.PUT_DANCE:
			case Const.BACK_DANCE:
				this.$session.send_message(null, null, message)
				break
			case Const.OPEN_RACE:
				this.props.onHandsupSwitch(true)
				this.$session.send_message(null, null, message)
				break
			case Const.CLOSE_RACE:
				this.props.onHandsupSwitch(false)
				this.$session.send_message(null, null, message)
				break
			case "racerank":
				this.props.onHandsupRank(data.uid, data.rank)
				break
			case Const.NEXT_PAGE:
				this.$playing = false
				this.hideDraft()
				this.props.onProgressReset()
				this.$session.send_message(null, null, message)
				break
			case Const.DISABLE_MAGIC:
				this.props.onProgressReset()
				this.$session.send_message(null, null, message)
				break
			case "gift":
				this.props.onNewGift(data)
				this.$session.send_message(null, null, message)
				break
			case "progress":
				//接收到来自学生的进度提示通知界面调整
				if (this.props.switches.magic) {
					this.props.onProgressUpdate(message.from, data.percent)
				}
				break
			case Const.WARN:
				this.props.onWarn(data,true);
				this.$session.send_message(null, null, message)
				break;
			case Const.WARN_RELIEVE:
				this.props.onWarn(data,false);
				this.$session.send_message(null, null, message)
				break;
			default:
				this.$session.send_message(null, null, message)
		}
	}

	leaveCourse() {}

	preLeaveCourse(leaveOnly) {}

	__put_to_dancing(id) {
		if (this.$last_dancing) {
			if (this.$last_dancing == id) {
				return
			}
			this.__back_from_dancing(this.$last_dancing)
		}
		console.log("do put message", id)
		$(`#student_${id}`).empty()
		$("#dancing-head").empty()
		this.$room.cameraTo(id, $("#dancing-head")[0], true)
		this.$last_dancing = id
	}

	__back_from_dancing(id) {
		if (!this.$last_dancing || this.$last_dancing != id) {
			return
		}
		$(`#dancing-head`).empty()
		$(`#student_${id}`).empty()
		// 当处于弱网络且不是自己时，直接取消流
		let student = this.getUser(id)
		if (this.__in_weak_net() && id != this.props.account.id) {
			if (student) {
				student.stream_inited = false
			}
			this.$room.unsubscribe(id)
		} else {
			if (student && student.stream) {
				this.$room.cameraTo(id, $(`#student_${id}`)[0])
			}
		}
		this.$last_dancing = null
	}

	onHelpClick() {
		this.props.confirm({
			title: "设备检测",
			content: "即将进行设备检测，是否暂时退出教室？",
			sure: () => {
				this.props.showLoading("正在退出房间...")
				this.$waiting_to_tester = true
				this.leaveCourse()
			}
		})
	}
}

export default Course
