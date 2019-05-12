const Const   = require('../const')
const Q 	  = require('q')
const Eventer = require('./eventer')
const Signal  = require('../agora/AgoraSig-1.4.0')

class Signalize extends Eventer {
	constructor(inst) {
		super()
		this.$inst 			= inst
		this.$inited    	= false
		this.$is_reconn 	= false
		this.$queue 		= []
		this.$heart_t   	= null
		this.$recon_timer	= null
		this.$connect_timer = null
		this.$user_in_room  = {}
	}

	__destroy_all() {
		if (this.$session) {
			this.$session.onLoginFailed = 
			this.$session.onLogout = 
			this.$session.onError  = null
			this.$session.logout && this.$session.logout()
		}
		if (this.$channel) {
			this.$channel.onChannelJoined = 
			this.$channel.onChannelJoinFailed = 
			this.$channel.onChannelUserJoined = 
			this.$channel.onChannelUserLeaved = 
			this.$channel.onChannelUserList   =
			this.$channel.onMessageChannelReceive = 
			this.$channel.onMessageInstantReceive = null
		}
		this.__clear_recon_timer()
		clearTimeout(this.$connect_timer)
		clearTimeout(this.$heart_t)
		this.$channel = null
	}

	__reconnect() {
		this.__destroy_all()
		// 重连
		this.trigger("RECONNECT_SIGNAL")
		this.$connect_timer = setTimeout(()=>{
			this.$sending_lock 	= false
			this.$inited 		= false
			this.$is_reconn 	= true
			this.join()
		},1000)
	}

	__on_connect() {
		clearTimeout(this.$connect_timer)
		this.trigger("CONNECT_SIGNAL")
		this.$connect_timer = setTimeout(()=>{
			this.__reconnect()
		},10000)
	}

	__connect_error(isKick) {
		clearTimeout(this.$connect_timer)
		if (isKick) {
			this.trigger("CONNECT_KICKED")
		} else {
			this.trigger("CONNECT_SIGNAL_ERROR")
		}
		console.log("retry to join")
		this.$connect_timer = setTimeout(()=>{
			this.__reconnect()
		},2000)
	}

	__connect_success() {
		clearTimeout(this.$connect_timer)
		this.trigger("CONNECTED_SIGNAL")
		this.__heart_beat()
	}

	__heart_beat() {
		clearTimeout(this.$heart_t)
		this.$heart_t = setTimeout(()=>{
			this.send({to: this.$inst.props.account.id,sig: new Date().getTime()}, true)
		},10000)
	}

	init() {
		return Q.Promise((resolve, reject)=>{
			if (this.$inited) {
				resolve();
			} else {
				this.__on_connect()
				console.log("Const.AGORA_APPID",Const.AGORA_APPID)
				this.$signal = Signal(Const.AGORA_APPID)
				// accout参数必须为字符串
				// this.$session = this.$signal.login(this.$inst.props.account.id+"", net.sigtoken)
				this.$session = this.$signal.login(this.$inst.props.account.id+"", "_no_need_token")
				this.$session.onLoginSuccess = ()=>{
					this.$inited = true
					resolve()
					console.log("session logined...")
				}
				this.$session.onLoginFailed = (ecode)=>{
					console.log("session login failed...",ecode)
					this.__connect_error()
				}
				this.$session.onLogout = (ecode)=>{
					if (ecode != Const.LOGOUT_SUCCESS && ecode != 0) {
						if (ecode == Const.LOGOUT_E_KICKED) {
							this.__connect_error("kick")
						} else {
							this.__connect_error()
						}
						console.log("session logout",ecode)
					}
				}
				this.$session.onError = (ecode)=>{
					console.log("session error",ecode)
					this.__connect_error()
				}
			}
		})
	}

	join() {
		this.init().then(()=>{
			let channel = this.$session.channelJoin(this.$inst.props.room.channel_id)
			channel.onChannelJoined = ()=>{
				// 上报自己的用户信息
				this.$channel = channel
				this.trigger("CHANNEL_JOINED", channel)
				// 发送消息队列中的消息
				this.$queue.forEach((message)=>{
					this.send(message)
				})
				this.$queue = []
				this.__connect_success()
				if (this.$is_reconn) {
					this.trigger("RECONNECTED_SIGNAL")
				}
			}
			channel.onChannelJoinFailed = ()=>{
				console.log("channel join failed, retry after 2s")
				this.__connect_error()
			}
			let new_user_joined = (users,ignore_missing)=>{
				// 获取用户信息
				let userinfos = [], missed_users = [];
				users.forEach((account)=>{
					let userinfo
					if (account == this.$inst.props.teacher.id) {
						userinfo = this.$inst.props.teacher
					} else {
						for(let i=0,len=this.$inst.props.students.length;i<len;i++) {
							let item = this.$inst.props.students[i]
							if (item.id == account) {
								userinfo = {
									child_name: item.child_name,
									id: item.id,
									avatarurl: item.child_avatar
								}
								break
							}
						}
					}
					if (userinfo) {
						userinfos.push(userinfo)
					} else {
						missed_users.push(account);
					}
				})
				if (!ignore_missing && missed_users.length > 0) {
					console.log("new user joind, missed users...",missed_users);
					this.trigger("CHANNEL_NEW_USER_LATE", {
						users: missed_users,
						retry: (over)=>{
							if (over) return;
							console.log('retry new user join...',missed_users)
							new_user_joined(missed_users, true)
						}
					})
				}
				if (userinfos.length > 0) {
					console.log("call new user joined",userinfos)
					this.trigger("CHANNEL_NEW_USER", { userinfos })
				}
			}
			channel.onChannelUserJoined = (account, uid)=>{
				console.log("onChannelUserJoined",account)
				this.$user_in_room[account] = true
				new_user_joined([account])
			}
			channel.onChannelUserList = (accounts)=>{
				console.log("On channel user list",accounts)
				let users = []
				accounts.forEach((account)=>{
					this.$user_in_room[account[0]] = true
					users.push(account[0])
				})
				if (users.length > 0) {
					new_user_joined(users, true)
				}
			};
			channel.onChannelLeaved = ()=>{
				console.log("channel leaved...")
			}
			channel.onChannelUserLeaved = (account) => {
				console.log("channel user leaved...")
				this.$user_in_room[account] = false
				this.trigger("CHANNEL_USER_LEAVE", account)
			}
			channel.onMessageChannelReceive = (account, uid, msg)=>{
				let message = JSON.parse(msg)
				console.log("receive new message", message)
				this.trigger("NEW_MESSAGE", message)
				this.__clear_recon_timer()
				this.__heart_beat()
			};
			this.$session.onMessageInstantReceive = (account, uid, msg)=>{
				this.__clear_recon_timer()
				this.__heart_beat()
				let message = JSON.parse(msg)
				if (message.sig) {
					console.log("receive heart beat message", msg)
					return
				}
				console.log("receive new peer message", msg)
				this.trigger("NEW_MESSAGE", message)
			}
		},()=>{}).done()
	}

	leave() {
		clearTimeout(this.$heart_t)
		clearTimeout(this.$connect_timer)
		this.__clear_recon_timer()
		if (this.$channel) {
			this.$channel.channelLeave()
		}
		this.__destroy_all()
	}

	__clear_recon_timer() {
		clearTimeout(this.$recon_timer)
		this.trigger("HIDE_LOADING")
	}

	send(message, heatbeat) {
		if (this.$channel) {
			if (this.$sending_lock && heatbeat) {
				// 有消息没发送成功，停止发送心跳连接
				return
			}
			this.__clear_recon_timer()
			this.$recon_timer = setTimeout(()=>{
				this.trigger("NETWORK_BAD")
				this.$recon_timer = setTimeout(()=>{
					this.$queue.push(message)
					this.__reconnect()
				}, 8000)
			},2000)
			this.$sending_lock = true
			if (message.to == "all") {
				let content = JSON.stringify(message)
				this.$channel.messageChannelSend(content, ()=>{
					console.log("全局消息发送成功")
					this.__clear_recon_timer()
					this.$sending_lock = false
				})
			} else {
				let to = message.to + ""
				let content = JSON.stringify(message)
				console.log("发送局部消息",to,content)
				if (this.$user_in_room[to]) {
					this.$session.messageInstantSend(to, content, ()=>{
						console.log("独立消息发送成功，发送给",message.to)
						this.__clear_recon_timer()
						this.$sending_lock = false
					})
				} else {
					console.log("发送对象不在房间，拒绝发送！",to)
					this.__clear_recon_timer()
					this.$sending_lock = false
				}
			}
		} else {
			this.$queue.push(message)
		}
	}
}

module.exports = Signalize