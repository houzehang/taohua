import React from 'react';
import { connect } from 'react-redux'
import StudentHead from '../components/student-head'
import { 
	onEndCourse, onRoomMoreInfo,
	onNewStream, onStreamLeave,
	onHandsupSwitch, onNewGift,
	onHandsupRank, onUserMuted, onMuteAllSwitch, onSilentSwitch,
	onDancing,
	onBeginCourse,
	onPauseCourse,
	onResumeCourse,
	onCourseTick,
	confirm, alert,
	onEnterTester,
	onMagicSwitch,
	showLoading,hideLoading,onRankSwitch,
	onProgressUpdate,
	onUpdateGift, onProgressReset, onUserAddRoom,
	onCourseRecording
} from '../actions'
const net 			= require("../network")
const Session   	= require('../session')
const Const   		= require('../../const')
const {ipcRenderer} = $require('electron');
const context 		= require('../context')
const RecordVideo   = require('../RecordVideo')
const $ 			= require("jquery")
const fs 			= $require('fs')
class Course extends React.Component {
	constructor(props) {
		super(props)
		this.$uuid      = 0
		this.$stat_arr 	= []
		this.$session 	= new Session(this)
		this.$audio 	= React.createRef()
		this.state 		= { 
			time: new Date().getTime()/1000, 
			control: !this.props.status.started,
			process: {current:0,total:0}
		}
		this.$record_video 	= new RecordVideo
		this.$audios_files 	= {}
		ipcRenderer.on("DOWNLOADED", (event, url, file)=>{
			net.log({name:"DOWNLOADED",url,file})
			this.$audios_files[url] = file
		})
	}

	get uuid() {
		return ++this.$uuid
	}

	isMaster(id) {
		if (!id) {
			id = this.props.account.id
		}
		for(let i=0,len=this.props.room.teachers.length;i<len;i++) {
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
		for(let i=0,len=this.props.students.length;i<len;i++) {
			let item = this.props.students[i]
			if (item.id == id) {
				return item
			}
		}
	}

	__load_sound(url) {
		console.log("call load file...",url)
		ipcRenderer.send("DOWNLOAD",url)
	}

	playMusic(url, needevent) {
		this.stopMusic()
		let soundUrl = url
		if (this.$audios_files[url]) {
			soundUrl = this.$audios_files[url]
			const blob 		= fs.readFileSync(soundUrl)
			const base64 	= Buffer.from(blob).toString('base64')
			const uri 		= 'data:audio/mp3;base64,' + base64
			soundUrl 		= uri
		}
		this.$audio.src = soundUrl
		this.$audio.play()
		if (needevent) {
			this.$playing = url
			this.$session.send_message("soundupdate",{url:this.$playing,time:0})
		} else {
			this.$playing = false
		}
	}

	stopMusic(noevent) {
		let result = this.$audio.pause()
		console.log("stop audio mix",result)
		if (this.$playing) {
			if (!noevent) {
				this.$session.send_message("soundended", {url:this.$playing})
			}
			this.$playing = null
		}
	}

	componentWillUnmount() {
		this.$session.destroy()
		clearInterval(this.$tick_timer)
		clearInterval(this.$music_timer)
		$(`#dancing-head`).empty()
		$('.avatar-head').empty()
		clearTimeout(this.$reload_timer)
		$(window).off("resize")
		this.props.hideLoading()
		context.detector.check()
	}

	componentDidMount() {
		context.detector.uncheck()
		this.$reload_timer = null
		$(window).on("resize", ()=>{
			clearTimeout(this.$reload_timer)
			this.$reload_timer = setTimeout(()=>{
				this.$session.reload()
				// 发送init room message
				this.__send_init_room()
			},1000)
		})
		this.$session.on("NEW_MESSAGE", (message)=>{
			this.__on_session_message(message)
		})
		net.getRoomInfoForRecord(this.props.room.channel_id).then((result)=>{
			this.props.onRoomMoreInfo(result)
			this.__send_init_room()
		})
		this.$session.init("#course-content")
		net.getServerTime().then((res)=>{
			this.setState({ time: res.time*1000 })
		})
		this.$audio.addEventListener("ended", ()=>{
			console.log("on audiomixingfinished",this.$playing)
			if (this.$playing) {
				this.$session.send_message("soundended", {url:this.$playing})
				this.$playing = null
			}
		})
		this.__tick()
	}

	__send_init_room() {
		// 发送init-room
		let masters = []
		this.props.room.teachers.forEach((teacher)=>{
			masters.push(teacher.id)
		})
		let userinfos = [ this.props.teacher ]
		userinfos = userinfos.concat(this.props.students)
		this.$session.send_message(Const.INIT_ROOM, {
			channel_id: this.props.room.channel_id,
			token: net.token
		}, {
			recording  : true,
			master_ids : masters,
			userinfos  : userinfos
		})
	}

	__build_stream(id) {
		return this.$record_video.create(id)
	}

	__tick() {
		this.$tick_timer = setInterval(()=>{
			this.props.onCourseTick()
		},1000)
		this.$music_timer = setInterval(()=>{
			if (this.$playing) {
				// 检测播放音乐
				let time = Math.floor(this.$audio.currentTime * 1000)
				this.$session.send_message("soundupdate",{url:this.$playing,time})
			}
		},100)
	}

	__set_record_data(data) {
		this.$record_video.data = data
		data.users.forEach((user)=>{
			if (this.isMaster(user.id)) {
				let stream = this.$record_video.create(user.id)
				if (stream) {
					this.props.onNewStream(stream)
				}
			}
		})
		this.$record_video.on("timeupdate", (event)=>{
			let master = false, time = event.time * 1000 >> 0
			if (event.id == data.room.master_teacher) {
				master = true
			}
			this.$session.send_message("recordtimeupdate", {id:event.id,time,master})
		})
		this.$record_video.on("durationupdate", (event)=>{
			console.log("duration update",event)
			if (event.id == data.room.master_teacher) {
				this.$session.send_message("recorddurationupdate", {id:event.id,time:event.time})
			}
		})
	}

	__on_session_message(message) {
		if (message.to == "app") {
			let data = message.message, result
			switch(message.type) {
				case Const.JS_READY :
				break
				case "starttest":
				break
				case Const.OPEN_MIC:
				break
				case Const.CLOSE_MIC:
				break
				case Const.ENABLE_MAGIC:
				this.props.onMagicSwitch(true)
				break
				case Const.DISABLE_MAGIC:
				this.props.onMagicSwitch(false)
				break
				case Const.MUTE_ALL:
				break
				case Const.UNMUTE_ALL:
				break
				case Const.SHOW_RANKS:
				this.props.onRankSwitch(true)
				break
				case Const.HIDE_RANKS:
				this.props.onRankSwitch(false)
				break
				case Const.PUT_DANCE:
				this.props.onDancing(data.id, true)
				break
				case Const.BACK_DANCE:
				this.props.onDancing(data.id, false)
				break
				case "record_ready":
				console.log("record_ready",data)
				this.__set_record_data(data)
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
				break
				case "loadsound":
				this.__load_sound(data.url)
				break
				case "course-process":
				break
				case "record-play":
				this.$record_video.playVideo(data.id)
				break
				case "record-pause":
				this.$record_video.pauseVideo(data.id)
				break
				case "record-seek":
				data.forEach((video)=>{
					this.$record_video.seekTo(video.id, video.time)
				})
				break
				case "record-jump":
				data.forEach((video)=>{
					this.$record_video.jumpTo(video.id, video.time)
				})
				break
				case "record-speed":
				this.$record_video.speed = data.speed
				break
				case "record-backdance":
				this.__back_from_dancing(this.$last_dancing)
				break
				default:
				if (message.type.indexOf("*") == -1) {
					this.__on_signal_message(message)
				}
				break
			}
		} else {
			this.__on_signal_message(message)
		}
	}

	// 是否处于弱网络状态
	__in_weak_net() {
		return this.props.netStatus == 0 && !this.isMaster()
	}

	__on_signal_message(message) {
		let data = message.message
		switch(message.type) {
			case "closeroom":
			this.leaveCourse()
			break
			case Const.MEMBER_ADD:
			data.forEach((item)=>{
				let stream = this.__build_stream(item.id)
				if (stream) {
					this.props.onNewStream(stream)
				}
			})
			break
			case Const.MEMBER_LEAVE:
			break
			case Const.OPEN_MIC:
			case Const.CLOSE_MIC:
			case Const.PUT_DANCE:
			case Const.BACK_DANCE:
			break
			case Const.OPEN_RACE:
			break
			case Const.CLOSE_RACE:
			break
			case "racerank":
			break
			case Const.NEXT_PAGE:
			this.$playing = false
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
			default:
			this.$session.send_message(null, null, message)
		}
	}

	leaveCourse() {
		this.$record_video.destroy()
		this.$session.destroy()
		this.props.onCourseRecording(false)
	}

	preLeaveCourse() {
		this.leaveCourse()
	}

	__put_to_dancing(id) {
		if (this.$last_dancing) {
			if (this.$last_dancing == id) {
				return
			}
			this.__back_from_dancing(this.$last_dancing)
		}
		console.log("do put message",id)
		$(`#record_${id}`).css({
			position: "fixed",
			left	: $("#dancing-head").offset().left,
			top 	: $("#dancing-head").offset().top,
			width	: $("#dancing-head").width(),
			height	: $("#dancing-head").height(),
			"background-color" : "#000",
			overflow: "hidden"
		})
		this.$last_dancing = id
	}

	__back_from_dancing(id) {
		if (!this.$last_dancing || this.$last_dancing != id) {
			return
		}
		this.props.onDancing(id, false);
		$(`#dancing-head`).empty()
		$(`#record_${id}`).css({
			position: "static",
			left	: 0,
			top 	: 0,
			width	: "100%",
			height	: "100%",
			"background-color" : "transparent"
		})
		this.$last_dancing = null
	}

	__counter_time_to_str() {
		let duration = Math.max(0,this.props.status.duration)
		let hour 	 = duration / 60 / 60 >> 0
		duration 	-= hour * 60 * 60
		let minutes  = duration / 60 >> 0
		duration 	-= minutes * 60
		let seconds  = duration
		let format   = (num)=>num>9?num:("0"+num)
		return [
			<div key="0" className="couter-g">{format(hour)}:</div>,
			<div key="1" className="couter-g">{format(minutes)}:</div>,
			<div key="2" className="couter-g last">{format(seconds)}</div>
		]
	}

	render() {
		let dancing
		setTimeout(()=>{
			let teacher = this.props.teacher
			if (teacher.stream && !teacher.stream_inited) {
				teacher.stream_inited = true
				this.$record_video.play(teacher.stream, 'master-head')
			}
			if (this.props.students) {
				this.props.students.forEach((student)=>{
					if(student.stream && !student.stream_inited) {
						console.log("play stream",student.id)
						// 开启了弱网络优化时
						if (this.__in_weak_net()) {
							if (student.id == this.props.account.id) {
								this.$record_video.play(student.stream, 'student_'+student.id)
								student.stream_inited = true
							}
						} else {
							if (student.id != this.$last_dancing) {
								this.$record_video.play(student.stream, 'student_'+student.id)
							}
							student.stream_inited = true
						}
					}
					if (student.stream_inited) {
						// 开启了弱网络优化时，只保留自己的流和正在上台人的流
						if (this.__in_weak_net()) {
							if (student.id != this.props.account.id && 
								this.$last_dancing != student.id) {
								student.stream.stop()
								student.stream_inited = false
							}
						}
					}
					if (!student.stream && student.id == this.$last_dancing) {
						this.$last_dancing = null
					}
				})
			}
			if (dancing) {
				this.__put_to_dancing(dancing.id)
			} else {
				if (this.$last_dancing) {
					this.__back_from_dancing(this.$last_dancing)
				}
				this.$last_dancing = null
			}
		},0)
		let students = (this.props.students||[]).concat()
		// 排序按照进入场景的时间来排序
		students.sort((prev,next)=>{
			next = next.online_time || new Date().getTime()+1000000
			prev = prev.online_time || new Date().getTime()+1000000
			return next < prev ? 1 : -1
		})

		// students.sort((prev,next)=>{
		// 	return (next.gift_total||0) > (prev.gift_total||0) ? 1 : -1
		// })
		for(let i=0,len=students.length;i<len;i++) {
			let item = students[i]
			if (item.dancing && item.stream) {
				dancing = item
				break
			}
		}
		let studentHeads = students.map((student)=>(
			
			<StudentHead key={student.id} isTeacher={false} user={
				student.online?student:{}
			} onClickSpeak={(user)=>{
				if (!user.unmuted) {
					this.$session.send_message(Const.OPEN_MIC, {
						uid: user.id - 0
					})
				} else {
					this.$session.send_message(Const.CLOSE_MIC, {
						uid: user.id - 0
					})
				}
			}} onClickGift={(user)=>{
				// 只有老师可以送礼物
				if (this.isMaster()) {
					this.__send_gift(user)
				}
			}} onClickView={(user)=>{
				if (user.dancing) {
					this.$session.send_message(Const.BACK_DANCE, { id: user.id })
				} else {
					this.$session.send_message(Const.PUT_DANCE, { id: user.id })
				}
			}}/>
		))
		let handsupStudents = []
		students.forEach((student)=>{
			if (student.online) {
				handsupStudents.push(student)
			}
		})

		let TeacherView = <div className="teacher-area role-student">
			<div className="avatars">
				<div className="avatar">
					<div className="avatar-head" id="master-head" style={{
						"backgroundImage" : this.props.teacher.stream?"":`url(${this.props.teacher.avatarurl})`
					}}>
					</div>
					<div className="avatar-info">老师：{this.props.teacher.child_name}</div>
				</div>
				<div className={dancing?"avatar":(this.state.draft?"avatar draft":"avatar nothing")}>
					<div className="ph-text">未指定小朋友发言</div>
					<div className="avatar-head" id="dancing-head"></div>
					<div className="avatar-info">学生：{dancing?dancing.child_name:""}</div>
					<div className={this.state.draft?"draft-text":"draft-text none"} dangerouslySetInnerHTML={{__html: this.state.draft}}></div>
				</div>
			</div>
		</div>
		let StudentView = <div className="student-area">
			{studentHeads}
		</div>
		return (
			<div className="page course-page student">
				<button className="record-back" onClick={()=>{
					this.leaveCourse()
				}}></button>
				<div className="inner">
					<div className="content">
						<audio src="" ref={(ref)=>{
							this.$audio = ref
						}}/>
						<div className="course-content kc-canvas-area" id="course-content"></div>
					</div>
					<div className="entities-area">
						{TeacherView}
						{StudentView}
					</div>
				</div>
			</div>
		)
	}
}

const mapStateToProps = (state, ownProps) => {
	return {
		account 	: state.login.account,
		room 		: state.room.info,
		students	: state.room.students,
		teacher 	: state.room.teacher,
		started 	: state.main.courseStarted,
		switches	: state.room.switches,
		status  	: state.room.status,
		netStatus 	: state.main.netStatus
	}
}

const mapDispatchToProps = dispatch => ({
	onRoomMoreInfo		: (data) => dispatch(onRoomMoreInfo(data)),
	onNewStream			: (data) => dispatch(onNewStream(data)),
	onStreamLeave		: (data) => dispatch(onStreamLeave(data)),
	onHandsupSwitch 	: (status) => dispatch(onHandsupSwitch(status)),
	onMagicSwitch   	: (status) => dispatch(onMagicSwitch(status)),
	onRankSwitch    	: (status) => dispatch(onRankSwitch(status)),
	onMuteAllSwitch 	: (status) => dispatch(onMuteAllSwitch(status)),
	onSilentSwitch  	: (status) => dispatch(onSilentSwitch(status)),
	onNewGift    		: (data) => dispatch(onNewGift(data)),
	onHandsupRank   	: (id, rank) => dispatch(onHandsupRank(id, rank)),
	onUserMuted 		: (id, status, recovering) => dispatch(onUserMuted(id, status, recovering)),
	onDancing 			: (id, status) => dispatch(onDancing(id, status)),
	onEndCourse 		: () => dispatch(onEndCourse()),
	onBeginCourse 		: () => dispatch(onBeginCourse()),
	onPauseCourse 		: () => dispatch(onPauseCourse()),
	onResumeCourse 		: () => dispatch(onResumeCourse()),
	onCourseTick 		: () => dispatch(onCourseTick()),
	confirm 			: (data) => dispatch(confirm(data)),
	alert 	    		: (data) => dispatch(alert(data)),
	onEnterTester 		: (page) => dispatch(onEnterTester(page)),
	showLoading 		: (message) => dispatch(showLoading(message)),
	hideLoading 		: () => dispatch(hideLoading()),
	onUpdateGift 		: (data) => dispatch(onUpdateGift(data)),
	onProgressUpdate	: (id, percent) => dispatch(onProgressUpdate(id, percent)),
	onProgressReset 	: () => dispatch(onProgressReset()),
	onUserAddRoom 		: (id) => dispatch(onUserAddRoom(id)),
	onCourseRecording   : (status) => dispatch(onCourseRecording(status))
})
  
export default connect(
	mapStateToProps,
	mapDispatchToProps
)(Course)
