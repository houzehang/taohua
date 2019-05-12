const Eventer 	= require("./eventer")
const net  		= require("./network")
class NetDetector extends Eventer {
	constructor() {
		super()
		// 0-4 个状态
		// 0 为网络断开，1-4 数字越高网络越差
		this.$status 			= 1
		this.$warn_times 		= 0
		this.$max_warn_times 	= 3
		this.$check_delay 		= 30000
		this.$in_bad_status     = false
		this.$check_timer		= null
		this.$check_closed 		= true
		this.$waring_threshold  = 2
	}

	get waring_threshold(){
		return this.$waring_threshold;
	}

	set waring_threshold(threshold){
		this.$waring_threshold = threshold;
	}

	get good() {
		return this.$status == 1
	}

	get offline() {
		return this.$status == 0
	}

	get warning() {
		return this.$status == 0 || this.$status > this.$waring_threshold
	}

	check() {
		// console.log("call check")
		// this.$check_closed = false
		// let base = "https://muwen.mw009.com/netdetector.jpg"
		// clearTimeout(this.$check_timer)
		// this.$check_timer = setTimeout(()=>{
		// 	this.onAjaxTime(this.$check_delay)
		// 	this.check()
		// },this.$check_delay)
		// let start = new Date().getTime()
		// $.get(`${base}?t=${new Date().getTime()}`,()=>{
		// 	let delay = new Date().getTime() - start
		// 	this.onAjaxTime(delay)
		// 	clearTimeout(this.$check_timer)
		// 	this.$check_timer = setTimeout(()=>{
		// 		this.check()
		// 	},this.$check_delay)
		// }).fail(()=>{
		// 	this.onAjaxTime(-1)
		// 	clearTimeout(this.$check_timer)
		// 	this.$check_timer = setTimeout(()=>{
		// 		this.check()
		// 	},this.$check_delay)
		// })
	}

	uncheck() {
		console.log("call uncheck")
		clearTimeout(this.$check_timer)
		this.$check_closed = true
	}

	setStatus(status) {
		this.__setStatus(status)
	}

	setStatusOnce(status) {
		this.$status = status
		this.trigger("NET:STATUS", this.$status)
	}

	onAjaxTime(delay) {
		if (this.$check_closed) return
		delay -= 0
		if (!delay) return
		let status
		if (delay == -1) {
			status = 0
		} else if (delay <= 300) {
			status = 1
		} else if (delay <= 500) {
			status = 2
		} else if (delay <= 1200) {
			status = 3
		} else {
			status = 4
		}
		console.log("set status",status)
		this.__setStatus(status)
	}

	get inBadStatus() {
		return this.$in_bad_status
	}

	__setStatus(value) {
		this.$status = value
		this.trigger("NET:STATUS", this.$status)
		net.log({name:"NET:STATUS", status: this.$status})
		if (this.warning) {
			this.$warn_times++
		} else {
			this.$warn_times--
		}
		if (this.$warn_times >= this.$max_warn_times) {
			this.$warn_times = this.$max_warn_times
			if (!this.$in_bad_status) {
				this.trigger("NET_STATUS_BAD")
				this.$in_bad_status = true
			}
		} else if (this.$warn_times <= 0) {
			this.$warn_times = 0
			if (this.$in_bad_status) {
				this.trigger("NET_STATUS_GOOD")
				this.$in_bad_status = false
			}
		}
	}

	unload() {
	}
}

module.exports = NetDetector