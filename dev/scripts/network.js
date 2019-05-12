const Q 			= require('q')
const Eventer 		= require('./eventer')
const context 		= require('./context')
const ENV   		= require("../../env")
const remote 		= $require("electron").remote
const $ 			= require("jquery")
const Conf 			= require("../const")
class Network extends Eventer {
	constructor() {
		super()
		if (ENV.DEBUG || ENV.TEST) {
			this.$base_url = Conf.TEST_URL
		} else {
			this.$base_url = Conf.ONLINE_URL
		}
		this.$log_queue = []
		this.__restore_token()
	}

	__restore_token() {
		this.$token = ""
		let result = context.storage.get("DYW_TOKEN")
		if (result) {
			this.$token = result
		}
		result = context.storage.get("DYW_SIG_TOKEN")
		if (result) {
			this.$sigtoken = result
		}
	}

	upload_file(data) {
		return Q.Promise((resolve, reject)=>{
			const formData = new FormData();
    		formData.append('upload_file',data)
			$.ajax(this.$base_url + "/uploadfile/index", {
				headers: { 
					"Authorization": `Bearer ${this.$token}`
				},
				method: "POST",
				data: formData,
				processData: false,
        		contentType: false,
				success: (response)=>{
					if (response.data && response.data.url) {
						resolve(response.data.url)
					} else {
						reject()
					}
				},
				error: ()=>{
					alert("啊哦，文件上传失败~")
					reject()
				}
			})
		})
	}

	__request(url, data = {}, method="get") {
		data.client = "pc"
		return Q.Promise((resolve, reject)=>{
			let start = new Date().getTime()
			$.ajax(this.$base_url + url, {
				headers: { 
					"Authorization": `Bearer ${this.$token}`,
					"Accept" : "application/json"
				},
				method : method.toUpperCase(),
				data,
				dataType: "json",
				statusCode: {
					403: ()=>{
						this.trigger("LOGIN_NEEDED")
					}
				},
				success: (res)=>{
					resolve(res.data)
				},
				error: (res)=>{
					if (res.responseJSON) {
						alert(res.responseJSON.message)
					}
					if (res.status == 401) {
						//登录
						this.trigger("LOGOUT_NEEDED")
						reject()
						return
					}
					if (!res.responseJSON) {
						alert("啊哦，网络出问题啦~")
					}
					reject()
				}
			})
		})
	}

	set token(token) {
		context.storage.store("DYW_TOKEN",token)
		this.$token = token
	}

	get token() {
		return this.$token
	}

	set sigtoken(sigtoken) {
		context.storage.store("DYW_SIG_TOKEN",sigtoken)
		this.$sigtoken = sigtoken
	}

	get sigtoken() {
		return this.$sigtoken
	}

	/**
	 * 获取服务器时间
	 */
	servcerTime() {
		return this.__request("/api/time")
	}

	/**
	 * 用户登录
	 * @param {*} data 
	 */
	login(data) {
		return this.__request("/user/login", data, "post")
	}


	/**
	 * 获取登录身份配置
	 * @param {*} data 
	 */
	getLoginDentities (data) {
		return this.__request("/api/dentities", data, "post")
	}

	/**
	 * 首页-下次课程信息
	 */
	getLessonComming() {
		return this.__request('/room/class_lesson_first',{
			client:'pc'
		},'post')
	}

	/**
	 * 首页-我的课程列表-将要上的课
	 */
	getLessonListComming(data={}) {
		data.client = 'pc';
		data.type = 'prepare';
		return this.__request('/room/class_lesson_list',data,'post')
	}

	/**
	 * 首页-我的课程列表-已经完成的课
	 */
	getLessonListDone(data={}) {
		data.client = 'pc';
		data.type = 'haved';
		return this.__request('/room/class_lesson_list',data,'post')
	}

	/**
	 * 获取课程安排
	 * @param {*} date 
	 */
	lessons(date) {
		return this.__request("/room/lesson_date", {
			date
		})
	}

	/**
	 * 获取当日课程
	 */
	lessonsByDate(date) {
		return this.__request("/room/lesson_list", {
			date
		})
	}
	/**
	 * 获取历史课程
	 */
	lessonsByHistory(){
		return this.__request("/room/my_lesson_list", {
			client:'pc',
			type:'haved'
		})
	}

	/**
	 * 获取房间数据
	 * @param {*} channel_id 
	 */
	getRoomInfo(channel_id) {
		return this.__request("/room/channel_key", {
			channel_id
		}, "post")
	}

	/**
	 * 录播时获取房间数据
	 * @param {*} channel_id 
	 */
	getRoomInfoForRecord(channel_id) {
		return this.__request("/room/record_room_info", {
			channel_id
		}, "post")
	}

	/**
	 * 获取礼物列表
	 */
	getGiftsList() {
		return this.__request("/api/gifts", {})
	}

	/**
	 * 发礼物
	 */
	sendGift(data) {
		return this.__request("/api/give_gift", data, "post")
	}

	/**
	 * 坐姿警告
	 */
	warn(data){
		return this.__request("/room/user_leave_class", data, "post")
	}

	/**
	 * 图像识别
	 */
	baseUpload(data){
		return this.__request("/room/user_base_upload", data, "post")
	}

	/**
	 * 关闭房间
	 */
	closeRoom(channel_id) {
		return this.__request("/room/close_the_room", {channel_id}, "post")
	}

	/**
	 * 获取当前时间
	 */
	getServerTime() {
		return this.__request('/api/time')
	}

	/**
	 * 开始上课
	 */
	beginClass(channel_id, user_ids) {
		return this.__request('/room/class_begin',{channel_id, user_ids},"post")
	}

	/**
	 * 修改用户信息
	 */
	changeUserInfo(data) {
		return this.__request('/user/edit_user_info', data, "post")
	}

	/**
	 * 上课预警
	 */
	earlyWarning(channel_id) {
		return this.__request('/room/room_early_warning', {channel_id}, "post")
	}

	/**
	 * 获取班级联系人信息
	 */
	getContactInfo() {
		return this.__request('/user/banji_contact')
	}

	/**
	 * 设备检测
	 */
	checkDevice(){
		return this.__request("/api/device_testing",{
			logs	: [window.ENV_CONF.systeminfo]
		}, "post")
	}
	
	__get_system_info() {
		let usedMemory 	= remote.process.getProcessMemoryInfo(),
			memory 		= remote.process.getSystemMemoryInfo(),
			cpu 		= remote.process.getCPUUsage()

		let _memory = n=>(Math.round(n/1024*10)/10)+"M"
		let system  = {
			um: `${_memory(usedMemory.workingSetSize)}/${_memory(usedMemory.peakWorkingSetSize)}`,
			tm: `${_memory(memory.free)}/${(Math.round(memory.total/1024/1024*10)/10)+"G"}/${memory.swapFree||0}/${memory.swapTotal||0}`,
			cpu: `${Math.round(cpu.percentCPUUsage*100)/100}/${cpu.idleWakeupsPerSecond}`
		}
		return system
	}

	reportSystemBaseInfo() {
		let _timer = setInterval(()=>{
			if (window.ENV_CONF && window.ENV_CONF.systeminfo) {
				clearInterval(_timer)
				this.log(window.ENV_CONF.systeminfo)
			}
		},1000)
	}

	/**
	 * 发送log数据
	 * @param {*} data 
	 */
	log(data={}) {
		console.log('net log:',data)
		this.$log_queue.push(data)
		if (!this.$log_delay) {
			this.$log_delay = setInterval(()=>{
				if (this.$log_queue.length > 0) {
					$.post(`${this.$base_url}/api/h5_log`,{
						logs	: this.$log_queue, 
						user	: context.user.id, 
						system  : this.__get_system_info()
					})
				}
				this.$log_queue = []
			},8000)
		}
	}
}

module.exports = new Network