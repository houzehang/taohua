const Const   = require('../const')
const net 	  = require('./network')
const Q 	  = require('q')
const Eventer = require('./eventer')

class TencentSignal extends Eventer {
	constructor(inst) {
		super()
		this.$prefix 	= "userid_web_"
		this.inst 		= inst
		this.$groupId   = Const.ROOM_ID
		this.$inited    = false
		this.$queue 	= []
	}

	__new_user_joined (account) {
		// 获取用户信息
		let userinfo 
		if (account == this.inst.props.teacher.id) {
			userinfo = this.inst.props.teacher
		} else {
			for(let i=0,len=this.inst.props.students.length;i<len;i++) {
				let item = this.inst.props.students[i]
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
			this.trigger("CHANNEL_NEW_USER", userinfo)
		}
	}

	getGroupMemberInfo() {
		var options = {
			'GroupId': this.$groupId + "",
			'Offset' : 0,
			'Limit'  : 10,
			'MemberInfoFilter': [ 'Account' ]
		};
		webim.getGroupMemberInfo(
			options,
			(resp)=>{
				if (resp.MemberNum <= 0) {
					return;
				}
				for (var i in resp.MemberList) {
					var account = resp.MemberList[i].Member_Account;
					account = account.replace(this.$prefix, "")
					this.__new_user_joined(account)
				}
			},
			(err)=>{
				console.error(err.ErrorInfo);
			}
		);
	}

	parseMsgs (newMsgList) {
		var textMsgs = [];
		var messages = [];
		for (var i in newMsgList) { //遍历新消息
			let newMsg  = newMsgList[i]
			var msgItem = newMsg.getElems()[0];
			var type = msgItem.getType();
			if (type === 'TIMCustomElem') {
				var content = msgItem.getContent(); //获取元素对象
				var data 	= content.getData();
				messages.push(data);
			} else if (type == 'TIMGroupTipElem') {
				var content = msgItem.getContent(), account;
				switch (content.opType) {
					case Const.WEB_IM_GROUP_TIP.JOIN://加入群
					console.log("加入群...",content.userIdList)
					content.userIdList.forEach((user)=>{
						user = user.replace(this.$prefix, "") - 0
						this.__new_user_joined(user)
					})
					break;
					case Const.WEB_IM_GROUP_TIP.QUIT://退出群
					console.log("退出群...",content.opUserId)
					account = content.opUserId.replace(this.$prefix, "") - 0
					this.trigger("CHANNEL_USER_LEAVE", account)
					break;
					case Const.WEB_IM_GROUP_TIP.KICK://踢出群
					console.log("踢出群...",content.opUserId)
					account = content.opUserId.replace(this.$prefix, "") - 0
					this.trigger("CHANNEL_USER_LEAVE", account)
					break;
				}
			}
		}
		return messages;
	}

	init() {
		return Q.Promise((resolve, reject)=>{
			if (this.$inited) {
				resolve();
			} else {
				$.ajax({
					method : 'POST',
					contentType:'application/json;charset=utf-8',
					url: "http://xzb.qcloud.com/webrtc/weapp/webrtc_room/get_login_info",
					data: JSON.stringify({
						"userID" : this.$prefix + this.inst.props.account.id
					}),
					success: (response)=>{
						webim.login({
							sdkAppID   	: response.sdkAppID,
							accountType	: response.accountType,
							identifier	: response.userID,
							userSig 	: response.userSig
						}, {
							onBigGroupMsgNotify: (message)=>{
								if (message && message.length > 0) {
									var msgsObj = this.parseMsgs(message)
									msgsObj.forEach((item)=>{
										item = JSON.parse(item)
										this.trigger("NEW_MESSAGE", item)
									})
								}
							},
							onMsgNotify: (message)=>{
								console.log("onMsgNotify",message)
							},
							onFriendSystemNotifys: ()=>{
								
							}
						}, {
							isLogOn: false
						}, ()=>{
							resolve()
						}, ()=>{
							reject()
						})
					}
				})
			}
		})
	}

 	createGroup (groupId, userID, succ, fail) {
		var options = {
			'GroupId': String(groupId),
			'Owner_Account': String(userID),
			'Type': "AVChatRoom",
			'ApplyJoinOption': 'FreeAccess',
			'Name': String(groupId),
			'Notification': "",
			'Introduction': "",
			'MemberList': [],
		};
		webim.createGroup(
			options,
			(resp) => {
				if (succ) succ();
			},
			(err) => {
				if (err.ErrorCode == 10025 || err.ErrorCode == 10021) {
					if (succ) succ();
				} else {
					console.log(err.ErrorInfo);
					if (fail) fail(err.ErrorCode);
				}
			}
		);
	}
	
	joinGroup (groupId, identifier) {
		return Q.Promise((resolve, reject)=>{
			this.createGroup(groupId, identifier, () => {
				var options = {
					'GroupId': groupId //群id
				};
				webim.applyJoinBigGroup(
					options,
					(resp) => {
						if (resp.JoinedStatus && resp.JoinedStatus == 'JoinedSuccess') {
							resolve()
						} else {
							reject()
						}
					},
					(err) => {
						if (err.ErrorCode == 10013) {
							resolve()
							return;
						}
						reject()
					}
				);
			}, function () {
				reject()
			})
		})
	}

	sendBoardMsg(options, success, fail) {
		this.sendCustomMsg({
			groupId		: options.groupId,
			data 		: options.msg,
			identifier	: options.identifier
		}, function () {
			success && success();
		});
	}
	
	sendCustomMsg (msgInfo, callback) {
		if (!msgInfo.groupId) {
			console.error("您还没有进入房间，暂不能聊天");
			return;
		}
		// custom消息
		var data = msgInfo.data || '';
		var desc = msgInfo.desc || '';
		var ext = msgInfo.ext 	|| '';

		var msgLen = webim.Tool.getStrBytes(data);
		if (data.length < 1) {
			alert("发送的消息不能为空!");
			return;
		}
		var maxLen  = webim.MSG_MAX_LENGTH.GROUP,
			errInfo = "消息长度超出限制";

		if (msgLen > maxLen) {
			console.error(errInfo);
			return;
		}

		var selSess = new webim.Session(webim.SESSION_TYPE.GROUP, msgInfo.groupId, msgInfo.groupId, null, Math.round(new Date().getTime() / 1000));
		var isSend 	= true; //是否为自己发送
		var seq 	= -1; //消息序列，-1表示sdk自动生成，用于去重
		var random 	= Math.round(Math.random() * 4294967296); //消息随机数，用于去重
		var msgTime = Math.round(new Date().getTime() / 1000); //消息时间戳
		var subType = webim.GROUP_MSG_SUB_TYPE.COMMON;
		var msg 	= new webim.Msg(selSess, isSend, seq, random, msgTime, msgInfo.identifier, subType);
		var custom_obj = new webim.Msg.Elem.Custom(data, desc, ext);
		msg.addCustom(custom_obj);

		//调用发送消息接口
		webim.sendMsg(msg, (resp) => {
			console.log('发消息成功');
			callback && callback();
		}, (err) => {
			console.log('发消息失败:重新发送', err);
			setTimeout(()=>{
				this.sendCustomMsg(msgInfo, callback)
			},1000)
		});
	}

	join() {
		this.init().then(()=>{
			this.joinGroup(this.$groupId,this.$prefix + this.inst.props.account.id).then(()=>{
				console.log("join group success.")
				this.$joined = true
				// 发送消息队列中的消息
				this.$queue.forEach((message)=>{
					this.send(message)
				})
				this.$queue = []
				this.getGroupMemberInfo()
			}).done()
		})
	}

	leave() {
		webim.quitGroup(
			{ "GroupId": this.$groupId },
			(resp) => {
				console.log("退群成功!")
				webim.logout();
			},
			function (err) {
				console.error(err.ErrorInfo);
				webim.logout();
			}
		);
	}

	send(message) {
		if (this.$joined) {
			message = JSON.stringify(message)
			this.sendBoardMsg({
				groupId   : this.$groupId,
				identifier: this.inst.props.account.id,
				msg: message
			}, ()=>{},()=>{})
		} else {
			this.$queue.push(message)
		}
	}
}

module.exports = TencentSignal