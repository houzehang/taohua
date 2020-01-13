const ENV = require("../env")
module.exports = {
	AGORA_APPID 	 		: ENV.TEST||ENV.DEBUG ? "c6a83fe7f78b490c96f69f3fdb71f682" : "d75fe75ab0404a90b2ed7e5bab216f80",
	AGORA_CHANNEL_KEY		: ENV.TEST||ENV.DEBUG ? "dfc09172cb114b06b002c2f9aa7f0d87" : "7c9b6ed9bba54dc59471cfa09e9f23ea",
	// TEST_URL 			: "https://admintest.youshiyuwen.cn",
	TEST_URL 			: "https://kecheng1.runsnailrun.com",
	ONLINE_URL 			: "https://www.muwenyuwen.com",
	TENCENT_APPID 		: 1400098973,
	TENCENT_ACCOUNTTYPE : 28218,
	VIDEO_T_QUALITY 	: "480P_3",
	VIDEO_S_QUALITY 	: "120P_3",
	ROOM_ID				: 111111,
	LARGE_MODE			: 480,
	DANCE_MODE			: 200,
	DANCE_TRAIN_MODE	: 720,
	SMALL_MODE			: 88,
	
	WEB_IM_GROUP_TIP    : {
		"JOIN" 			: 1, //加入群组
		"QUIT"   		: 2, //退出群组
		"KICK"  		: 3, //被踢出群组
		"SET_ADMIN"  	: 4, //被设置为管理员
		"CANCEL_ADMIN" 	: 5, //被取消管理员
		"MODIFY_GROUP_INFO" : 6, //修改群资料
		"MODIFY_MEMBER_INFO": 7//修改群成员信息
	},
	CELL_COUNT 			: 4,
	LOGIN_E_NET			: 201,
	LOGOUT_E_KICKED		: 103,
	LOGOUT_E_NET		: 102,
	LOGOUT_SUCCESS		: 101,
	GENERAL_E_NOT_LOGIN : 1003,
	JS_READY 	: "jsready",
	INIT_ROOM	: "initroom",
	MEMBER_ADD  : "member_add",
	MEMBER_LEAVE: "member_leave",
	CLEARLINES  : "clearlines",
	NEXT_PAGE   : "nextpage",
	SYNC   		: "sync",
	VIDEO_PLAY  : "videoplay",
	VIDEO_STOP  : "videostop",
	OPEN_RACE   : "#openrace",
	CLOSE_RACE  : "#closerace",
	OPEN_MIC 	: "#openmic",
	CLOSE_MIC   : "#closemic",
	COURSE_PAUSE  : "#coursepause",
	COURSE_RESUME : "#courseresume",
	PUT_DANCE     : "#putdance",
	BACK_DANCE    : "#backdance",
	SCENE_MOVE    : "scenemove",
	START_COURSE  : "*startcourse",
	STOP_COURSE   : "*stopcourse",
	WARN          : "warn",
	WARN_RELIEVE  : "warn_relieve",
	ENABLE_MAGIC  : "enablemagic",
	DISABLE_MAGIC : "disablemagic",
	MUTE_ALL 	  : "#muteall",
	UNMUTE_ALL 	  : "#unmuteall",
	SHOW_RANKS    : "*showranks",
	HIDE_RANKS    : "*hideranks",
	UPDATE : {
		AVAILABLE: "update available",
		LASTEST  : "the lastest version",
		CHECKING : "checking for update",
		ERROR: "update error",
		DOWNLOADING: "update downloading",
		DOWNLOADED: "update downloaded"
	}
};