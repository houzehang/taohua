const $ = require("jquery")
class Loading {
	constructor() {
		this.$inited = false
	}

	__init() {
		this.$dom = $(`<div class="loading-mask"><div class="loading-close"></div><div class="loading-text"></div></div>`)
		this.$dom.hide().appendTo("body")
		this.$inited = true
		$(this.$dom).on("click",".loading-close",()=>{
			this.hide()
		})
	}

	show(message = "") {
		if (!this.$inited) {
			this.__init()
		}
		$(".loading-text",this.$dom).html(message)
		this.$dom.fadeIn()
	}

	hide() {
		if (this.$dom) {
			this.$dom.fadeOut()
		}
	}
}

module.exports = new Loading