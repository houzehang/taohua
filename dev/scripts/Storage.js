/**
 * 本地存储类
 * 用于将信息固化到本地存储
 * namespace 为命名空间，每个Session都会取account的userid为命名空间，避免多个Session数据冲突
 */
class Storage {
	constructor(namespace = "MINGXI.INC") {
		this.$namespace = namespace;
		this.$data      = localStorage.getItem(this.$namespace);
		console.log("namespace...",namespace,this.$data)
		if (this.$data) {
			try {
				this.$data  = JSON.parse(this.$data);
			} catch(e) {
				this.$data  = {};
				localStorage.removeItem(this.$namespace);
			}
		} else {
			this.$data  = {};
		}
	}

	get(key) {
		return this.$data[key];
	}

	store(key, data) {
		this.$data[key] = data;
		localStorage.setItem(this.$namespace, JSON.stringify(this.$data));
	}

	clear() {
		localStorage.removeItem(this.$namespace)
	}
}

module.exports = new Storage;