const storage 		= require("./Storage")
const {ipcRenderer} = $require("electron");
class Context {
	get dmg() {
		return this.$dmg
	}

	set dmg(dmg) {
		this.$dmg = dmg
	}

	get user() {
		return this.$user || {}
	}

	set user(user) {
		this.$user = user
	}

	get loading() {
		return this.$loading
	}

	set loading(loading) {
		this.$loading = loading
	}

	get detector() {
		return this.$detector
	}

	set detector(detector) {
		this.$detector = detector
	}

	get course() {
		return this.$course
	}

	set course(course) {
		this.$course = course
	}

	get room() {
		return this.$room
	}

	set room(room) {
		this.$room = room
	}

	get session() {
		return this.$session
	}

	set session(session) {
		this.$session = session
	}

	get storage() {
		if (!this.$storage) {
			this.$storage = storage
		}
		return this.$storage
	}

	set storage(storage) {
		this.$storage = storage
	}

	get video_device_id() {
		return this.$video_device_id
	}

	set video_device_id(video_device_id) {
		this.$video_device_id = video_device_id
	}

	get audio_device_id() {
		return this.$audio_device_id
	}

	set audio_device_id(audio_device_id) {
		this.$audio_device_id = audio_device_id
	}

	addDownloaded(url, file) {
		if (!this.$local_files) {
			this.$local_files = {}
		}
		this.$local_files[url] = file
	}

	getDownloaded(url) {
		if (!this.$local_files) {
			return 
		}
		return this.$local_files[url]
	}

	send_to_main(params) {
		console.log("send_to_main",ipcRenderer,params)
		ipcRenderer.send(...params);
	}

	/**
	 * 是否为低端设备
	 */
	isOldDevice() {
		if (this.$is_old_device !== undefined) {
			return this.$is_old_device
		}
		let oldDevice = localStorage.getItem("IS_OLD_DEVICE")
		this.$is_old_device = oldDevice
		return oldDevice
	}

	/**
	 * 设置为低端设备
	 */
	setOldDevice() {
		localStorage.setItem("IS_OLD_DEVICE", 1)
		this.$is_old_device = true
	}

	set join_class_enabled(enabled){
		this.$join_class_enabled = !!enabled;
	}

	get join_class_enabled(){
		return this.$join_class_enabled;
	}
	
	addDownloaded(url, file) {
		if (!this.$local_files) {
			this.$local_files = {}
		}
		this.$local_files[url] = file
	}

	getDownloaded(url) {
		if (!this.$local_files) {
			return 
		}
		return this.$local_files[url]
	}
}

module.exports = new Context