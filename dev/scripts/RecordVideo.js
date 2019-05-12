const Eventer 	= require("./eventer")
const $ 		= require("jquery")
class RecordVideo extends Eventer {
	constructor(id, data, speed = 1) {
		super()
		this.$id		= id
		this.$waiting 	= false
		this.$playing 	= false
		this.$seek_to   = null
		this.$speed 	= speed
		this.$seeking   = false
		this.$canplay   = false
		if (data) {
			this.$data  = data
		}
	}

	seekTo(time) {
		this.$seek_to = time
		if (this.$video && !this.$seeking) {
			// 当前进度超前
			this.$video[0].currentTime = time
			this.$seeking = true
		}
	}

	jumpTo(time) {
		if (this.$video) {
			this.$video[0].currentTime = time
		}
	}

	set speed(speed) {
		this.$speed = speed
		if (this.$video) {
			this.$video[0].playbackRate = this.$speed
		}
	}

	set data(data) {
		this.$data = data[this.$id]
		// 设置data之后，判断队列中是否有等待播放列表
		if (this.$waiting) {
			this.__render()
		}
	}

	get data() {
		return this.$data
	}

	get currentTime() {
		if (this.$video) {
			return this.$video[0].currentTime
		} else {
			return 0
		}
	}

	get playing() {
		return this.$playing
	}

	getId() {
		return this.$id
	}

	play(dom) {
		if (this.$playing) return
		if (dom) {
			this.$holder = "#"+dom
		}
		if (!this.$data) {
			this.$waiting = true
			this.trigger("nores")
		} else {
			this.__render()
		}
	}

	pause() {
		console.log("call video pause..",this.$playing)
		this.$playing = false
		this.$video && this.$video[0].pause()
	}

	__timeupdate() {
		let time = this.currentTime
		if (this.$seek_to) {
			if (time >= this.$seek_to) {
				this.$seek_to = null
				this.$seeking = false
			}
		}
		this.trigger("timeupdate")
	}

	__durationupdate(duration) {
		this.trigger("durationupdate", {duration})
	}

	__render() {
		if (!this.$dom) {

			this.$dom = $(`<div id="record_${this.$id}"></div>`)
			// 预加载视频资源
			let video = $("<video/>")
			video.attr("src", this.$data.hf_url).attr("id",`video_${this.$id}`)
			video.on("canplay", ()=>{
				
				this.trigger("canplay")
				video.off()
				video.on("timeupdate", ()=>{
					this.__timeupdate()
				})
				video.on("play", ()=>{
					this.$playing = true
				})
				video.on("pause", ()=>{
					this.$playing = false
				})
				this.$dom.append(video)
				$(this.$holder).append(this.$dom)
				this.$video = video
				this.$canplay = true;
			})
			video.on("durationchange", ()=>{
				this.__durationupdate(video[0].duration)
			})
			video.on("error", ()=>{
				console.log("on load video error",video)
				this.trigger("error")
			})
			video[0].playbackRate = this.$speed
			video[0].play()
		} else {
			if (this.$canplay) {
				this.$video[0].play()
			}
		}
		this.$waiting = false
	}

	destroy() {
		if (this.$video) {
			this.$video[0].pause()
			this.$video.remove()
			this.$video = null
		}
		if (this.$dom) {
			this.$dom.remove()
			this.$dom = null
		}
	}
}

class RecordVideoManager extends Eventer {
	constructor() {
		super()
		this.$busy 		= false
		this.$queue 	= []
		this.$list 		= {}
		this.$data 		= {}
		this.$speed     = 1
		this.$jump_queue_hash = {}
	}

	__timeupdate(id, time) {
		// 如果是主列表，则判断列表中的视频是否需要同步
		this.trigger("timeupdate",{id,time,data:this.$data[id]})
	}

	__durationupdate(id, time) {
		// 如果是主列表，则判断列表中的视频是否需要同步
		this.trigger("durationupdate",{id,time,data:this.$data[id]})
	}

	__is_master(id) {
		return this.$master == id
	}

	playVideo(id) {
		let video = this.$list[id]
		if (video) {
			video.play()
		}
	}

	pauseVideo(id) {
		let video = this.$list[id]
		if (video) {
			video.pause()
		}
	}

	seekTo(id, time) {
		let video = this.$list[id]
		if (video) {
			video.seekTo(time)
		}
	}

	jumpTo(id, time) {
		let video = this.$list[id];
		if (!video) return;

		let __jumpTo = ()=>{
			if (time < 0) {
				console.log("call pause...",id,time)
				video.pause()
			} else {
				console.log("call play...",id,time)
				video.jumpTo(time)
				video.play()
			}
		}
		if (video.$canplay) {
			__jumpTo();
		} else {
			this.$jump_queue_hash[id] = this.$jump_queue_hash[id] || [];
			this.$jump_queue_hash[id].push(__jumpTo);
		}
	}

	set speed(speed) {
		if (this.$speed == speed) {
			return
		}
		this.$speed = speed
		for(let key in this.$list) {
			let video = this.$list[key]
			video.speed = this.$speed
		}
	}

	set data(data) {
		this.$master = data.room.master_teacher
		data.users.forEach((user, index)=>{
			let base = 'https://muwen.mw009.com'
			let urls = [
				base,
				'http://muwen1.mw009.com',
				'http://muwen2.mw009.com',
				'http://muwen3.mw009.com',
				'http://muwen4.mw009.com',
				'http://muwen5.mw009.com',
				'http://muwen6.mw009.com'
			]
			if (user.hf_url) {
				user.hf_url = user.hf_url.replace(base, urls[index%urls.length])
				this.$data[user.id] = user
			}
		})
		for(let key in this.$list) {
			let video = this.$list[key]
			if (!video.data && data[key]) {
				video.data = data[key]
			}
		}
	}

	play(stream, dom) {
		if (stream) {
			this.$queue.push([stream,dom])
		}
		if (this.$busy) {
			return
		}
		let param = this.$queue.shift()
		if (param) {
			this.$busy = true
			let stream = param[0]
			let goon = ()=>{
				stream.off('canplay')
				stream.off('error')
				stream.off('nores')
				this.$busy = false
				this.play()
			} 
			stream.on('canplay', ()=>{
				let _jump_to_func = (this.$jump_queue_hash[stream.$id] || []).shift();
				_jump_to_func && typeof _jump_to_func === 'function' && 
				_jump_to_func();
				
				goon()
			})
			stream.on('error', ()=>{
				goon()
				this.$queue.push(param)
			})
			stream.on('nores', ()=>{
				goon()
			})
			stream.play(param[1])
		}
	}

	create(id) {
		if (this.$list[id]) {
			return this.$list[id]
		} else {
			if (this.$data[id]) {
				let video = new RecordVideo(id, this.$data[id], this.$speed)
				this.$list[id] = video
				video.on("timeupdate", ()=>{
					this.__timeupdate(id, video.currentTime)
				})
				video.on("durationupdate", (data)=>{
					this.__durationupdate(id, data.duration)
				})
				return video
			}
		}
	}

	destroy() {
		for(let key in this.$list) {
			this.$list[key].destroy()
		}
	}
}

module.exports = RecordVideoManager