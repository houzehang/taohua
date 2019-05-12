import React from 'react';
import { connect } from 'react-redux'
import Download from '../components/download'
import CourseForStudent from './course.student.page.js'
import CourseRecord from './course.record'
import Devices from './devices'
import SideBar from '../components/sidebar'
import ViewUser from '../components/viewuser'
import Helper from '../components/helper'
import * as types from '../constants/ActionTypes'
const net = require("../network")
import { 
	onRoomList, onCalendarData, onRoomInfo,
	onLogout, onStartCourse,
	confirm, alert, hide, onChangeUserInfo, onEnterTester,onEnterMyCourses,onExitMyCourses,onLessonComming,onLessonsComming,onLessonsDone,onLessonsTotalComming,onLessonsTotalDone,
	onCourseRecording,
	showLoading,
	hideLoading
} from '../actions'
import { setTimeout } from 'core-js';
const context = require("../context")
const storage = require("../Storage")
const Conf    = require("../../const")
const { ipcRenderer } = $require('electron');

class Main extends React.Component {
	constructor(props) {
		super(props)
		this.$detect_delay 		= 5000
		this.$cache_valid_time 	= 60*60*1000
		this.state 				= {
			comming_page_selected : true
		}
		this.$page_comming		= 1;
		this.$page_done 		= 1;
		this.$no_morelessons_comming = false;
		this.$no_morelessons_done = false;
		net.on("LOGOUT_NEEDED", ()=>{
			this.onLogout()
		})
		// this.__check_device();
	}

	__check_device(){

		this.props.showLoading("正在分析设备信息...")
		this.$timer_device_check = setInterval(() => {
			//轮询等待systeminfo
			if (window.ENV_CONF && window.ENV_CONF.systeminfo) {
				clearInterval(this.$timer_device_check);
				this.$timer_device_check = null;

				net.checkDevice().then((res)=>{
					this.props.hideLoading();
					
					res.old_device && context.setOldDevice();
					context.join_class_enabled = !!res.to_class;
				});

				let oldUser = localStorage.getItem('OLD_USER');
				if (oldUser) return;
				localStorage.setItem('OLD_USER','1');

				this.props.alert({
					content: "进入设备检测",
					sure: ()=>{
						this.props.onEnterTester("main")
					}
				});
			}
		}, 200);
	}

	strToDate(str) {
		let parsed = str.split(/[-: ]/)
		return new Date(parsed[0], parsed[1] - 1, parsed[2]||1, parsed[3]||0, parsed[4]||0, parsed[5]||0)
	}

	__get_lesson_comming(){
		net.getLessonComming().then((res)=>{
			// 计算剩余时间
			let room = res.room;
			if (room) {
				let date = this.strToDate(room.start_time)
				let left = date.getTime() - new Date().getTime()
				room.left = left
				if (left > 0) {
					let days  	= left / 1000 / 60 / 60 / 24 >> 0
					left       -= days * 1000 * 60 * 60 * 24
					let hours 	= left / 1000 / 60 / 60 >> 0
					let minutes = (left - hours * 60 * 60 * 1000)/1000/60 >> 0
					room.days   = days
					room.hours  = hours
					room.minutes= minutes
				}
			}
			this.props.onLessonComming(room)
		})
	}

	componentDidMount() {  
		this.__get_lesson_comming();
		context.user = this.props.account
		net.reportSystemBaseInfo()
	}

	componentWillUnmount() {
		if (this.$timer_device_check) {
			clearInterval(this.$timer_device_check)
			this.$timer_device_check = null;
		}
	}


	__student_page() {
		let room = this.props.commingRoom;
		if (room) {
			room.can_enter = true
			room.can_download = true
		}
		
		return (
			<div className="page student-page">
				<div className="inner">
					<div className="student-box">
                        <div className="main-page">
						    <div className="student-icon"></div>
                            { room ? ([
                                <div key="1" className="lesson-box">
                                    <div className="cover">
                                        <img src={room.avatar} alt=""/>
                                    </div>
                                    <div className="info">
                                        <div className="name"><span>{room.name}</span></div>
                                        <div className="desc">课时简介：{room.content||'暂无'}</div>
                                        {/* <div className="index"><span>老师：{room.teacher_name}</span></div> */}
                                        <div className="tag"><div className="tag-kind">{room.label}</div><span className="tag-effect">{"学习力提升："+(room.ability)}</span></div>
                                        <div className="date"><span>{room.class_date} {room.class_time}</span></div>
                                    </div>
									
                                    <div className="btns-panel">
										{room.can_enter && room.class_state != 'leave' ? <button className="start-btn" onClick={()=>{
											this.onStartRoom(room)
										}}></button>:""}
										{room.class_state != 'leave' ? <button className="download-btn" onClick={()=>{
											this.onDownload(room)
										}}></button> : "" } 
										{room.class_state != 'leave' ? "" :<div className="leave-flag"></div>}
									</div>
                                </div>,
                                
                                room.left > 0 ? (
                                    <div key="0" className="time">上课倒计时：
                                    {
                                        room.days > 0 ? <label><span>{room.days}</span>天</label> : ""
                                    }
                                    {
                                        room.hours > 0 ? <label><span>{room.hours}</span>小时</label> : ""
                                    }
                                    {
                                        room.minutes > 0 ? <label><span>{room.minutes}</span>分钟</label> : ""
                                    }
                                    </div>
                                ) : (
                                    <div key="0" className="time">老师开始讲课啦，赶快进入教室哦！</div>
                                )
                            ]) : ([
                                <div key="0" className="time">接下来没有课程啦～</div>,
                                <div key="1" className="no-lesson">
                                    去“明兮大语文”小程序<br/>
                                    和其他小朋友一起完成作业吧~
                                </div>
                            ]) }
                        </div>
					</div>
				</div>
			</div>
		)
    }
    
    __my_courses(){
		console.log('this.props.commingRooms = ',this.props.commingRooms);
		console.log('this.props.doneRooms = ',this.props.doneRooms);
		let _commingRooms = []
		let _doneRooms 	  = []

		setTimeout(()=>{
			document.getElementById('courses-comming-area') && document.getElementById('courses-comming-area').addEventListener('scroll', this.onScrollHandle.bind(this));
			document.getElementById('courses-done-area') && document.getElementById('courses-done-area').addEventListener('scroll', this.onScrollHandle.bind(this));
		},10);
        return (
			<div className="page student-page" >
				<div className="inner">
					<div className="student-box">
                        <div className="my-courses">
							<div className="nav-area">
								<div className="btn-exit" onClick={()=>{
									this.props.onExitMyCourses()
									this.$no_morelessons_comming = false;
									this.$no_morelessons_done 	 = false;
									this.__get_lesson_comming();
								}}></div>
								<div className={this.state.comming_page_selected ? "switch-bar" : "switch-bar first-selected"} >
									<div className="switch-bar-left" onClick={()=>{
										this.setState({
											comming_page_selected:true
										});
										setTimeout(()=>{
											this.__query_courses();
										},0);
									}}>
										<span>要上课程</span>
									</div>
									<div className="switch-bar-right" onClick={()=>{
										console.log('switch-bar-right clicked1');
										this.setState({
											comming_page_selected:false
										});
										console.log('switch-bar-right clicked2');
										setTimeout(()=>{
											this.__query_courses();
										},0);
									}}>
										<span>已上课程</span>
									</div>
								</div>
								{this.props.totalDone && this.props.totalDone.length > 0 ? <div className="course-according">
									<span className="label">课时消耗情况：</span>
									<span className="value">{this.state.comming_page_selected ? this.props.totalComming: this.props.totalDone}</span>
								</div>:""}
								
							</div>
							{(this.props.commingRooms||[]).forEach((room,index)=>{
								if (index == 0) {
									room.can_download = true;
									room.can_enter = true;
								}
								_commingRooms.push(<div className="lesson-box-panel" key={"comming_room_"+index}>
									<div className="date-tip"><div className="date-icon"></div><span>{room.class_date} {room.week_day}</span></div>
									<div className="lesson-box">
										<div className="cover">
											<img src={room.avatar} alt=""/>
										</div>
										<div className="info">
											<div className="name"><span>{room.name}</span></div>
											<div className="desc">课时简介：{room.content}</div>
											{/* <div className="index"><span>老师：{room.teacher_name}</span></div> */}
											<div className="tag"><div className="tag-kind">{room.label}</div><span className="tag-effect">{"学习力提升："+(room.ability||"")}</span></div>
											<div className="date"><span>{room.between_time}</span></div>
										</div>
										<div className="btns-panel">
											{room.can_enter && room.class_state != 'leave' ?<button className="start-btn" onClick={()=>{
												this.onStartRoom(room)
											}}></button>:""}
											{room.can_enter && room.can_download  && room.class_state != 'leave'  ?<button className="download-btn" onClick={()=>{
												this.onDownload(room)
											}}></button>:""}
											{!room.can_enter ?<button className="waiting-btn"  onClick={()=>{
											}}></button>: ""}
											{room.class_state != 'leave' ? "" :<div className="leave-flag"></div>}
											
										</div>
									</div>
								</div>);
								
							})}
							{this.state.comming_page_selected ? <div className={_commingRooms.length > 0 ? "courses-comming-area" : "courses-comming-area empty-area"} id="courses-comming-area">
								{_commingRooms.length > 0 ?_commingRooms : <div className="empty">
										<div className="icon"></div>
										<span>接下来没有课程了~</span>
									</div>}
							</div>: <div className="courses-done-area"  id="courses-done-area">
								{(this.props.doneRooms||[]).forEach((room,index)=>{
									_doneRooms.push(<div className="lesson-done-box-panel" key={"done_room_"+index}>
										<div className="box-panel-top">
											<span className="lesson-name">{room.name}</span>
											<span className="lesson-level">（{room.lesson_name}）</span>
										</div>
										<div className="box-panel-center">
											<span className="lesson-time">{room.class_date} {room.class_time}</span>
										</div>
										<div className="box-panel-bottom">
											<span className={room.class_state=='normal'?'lesson-state':"lesson-state abnormal"} >{room.class_state=='normal'?'正常结束':(room.class_state=='leave'?"请假":"未到课") }</span>
											<div className="star-icon"></div>
											<span className="star-count">{room.star}</span>
										</div>
									</div>)
								})}
								<div className={_doneRooms.length > 0 ? "container" : "container empty-container"}>
									{_doneRooms.length > 0 ?_doneRooms : <div className="empty">
										<div className="icon"></div>
										<span>已上的课程会在这里显示哦~</span>
									</div>}
								</div>
							</div> }
                        </div>
					</div>
				</div>
			</div>
		)
    }

	onStartRoom(data) {
		this.onDownload(data, true)
	}

	__onStartRoom(data,isRecord) {
		// if (!context.join_class_enabled) {
		// 	this.props.alert({
		// 		content: "您的设备配置较低，暂时无法上课",
		// 		sure: ()=>{}
		// 	});
		// 	return;
		// }
		this.props.onRoomInfo(data)
		if(isRecord){
			this.props.hide()
			setTimeout(()=>{
				this.onEnterRoom(true)	
			},500)
		}else{
			this.props.confirm({
				content: <div>上课时间：{data.start_time}<br/>准备好开始上课了吗？</div>,
				sure: ()=>{
					this.onEnterRoom()
				}
			})
		}
	}

	onRecordRoom(data) {
		// 判断最近1小时内是否下载过课程包，如果下载过则不提示下载
		let lastest_download = storage.get(`download_${data.en_name}`)
		if (lastest_download) {
			let delay = new Date().getTime() - lastest_download
			if (delay <= this.$cache_valid_time) {
				this.__onStartRoom(data,true)
				return
			}
		}
		if (context.detector.offline) {
			this.props.confirm({
				content: "您的网络已经断开，建议您检查网络后再开始上课。",
				sure_txt: "去检查网络",
				cancel_txt: "坚持上课",
				cancel: ()=>{
					this.__onStartRoom(data,true)
				}
			})
		} else {
			this.onDownload(data, true, true);			
		}
	}

	onDownload(data, canenter,isRecord) {
		this.props.alert({
			title: "下载课程包",
			content: <Download name={data.en_name} complete={()=>{
				// 存储最后一次下载时间
				storage.store(`download_${data.en_name}`,new Date().getTime())
				if (canenter) {
					this.__onStartRoom(data,isRecord)
				} else {
					this.props.alert({
						content: "下载完成。"
					})
				}
			}} user={this.props.account}/>,
			nobutton: true,
			noanim	: true
		})
	}

	onEnterRoom(isRecord) {
		if (isRecord) {
			this.props.onCourseRecording(true)
		} else {
			this.props.onStartCourse()
		}
	}

	onConfirmToLogout() {
		this.props.confirm({
			content: "确认退出当前登录的帐号吗？",
			sure: ()=>{
				this.onLogout()
			}
		})
	}

	onLogout() {
		this.props.onLogout()
		this.props.onLessonsComming([]);
		this.props.onLessonsDone([]);
	}
	
	__view_user() {
		this.props.confirm({
			title: "个人信息",
			nobutton: true,
			content: <ViewUser user={this.props.account} onLogout={()=>{
				this.onConfirmToLogout()
			}} onChangeUser={(user)=>{
				this.props.onChangeUserInfo(user)
			}}/>
		})
	}

	__on_helper() {
		this.props.confirm({
			title: "问题帮助",
			nobutton: true,
			content: <Helper />
		})
	}

	__query_courses(more){
		if (this.state.comming_page_selected) {
			if (this.$no_morelessons_comming || this.$querying_comming_lessons) return;
			if (more || this.$page_comming == 1) {
				this.$querying_comming_lessons = true;
				net.getLessonListComming({page:this.$page_comming}).then(res=>{
					this.$querying_comming_lessons = false;
					if (res && res.list && res.list.data && res.list.data.length > 0) {
						this.$page_comming = Number(res.list.current_page) + 1;
						let latest = (this.props.commingRooms||[]).concat(res.list.data||[]);
						this.props.onLessonsComming(latest);
						res.total && res.total.length > 0 && this.props.onLessonsTotalComming(res.total);
					}else{
						this.$no_morelessons_comming = true;
					}
				});
			}
		}else{
			if (this.$no_morelessons_done || this.$querying_done_lessons) return;
			if (more || this.$page_done == 1) {
				this.$querying_done_lessons = true;
				return net.getLessonListDone({page:this.$page_done}).then(res=>{
					this.$querying_done_lessons = false;
					if (res && res.list && res.list.data && res.list.data.length > 0) {
						this.$page_done = Number(res.list.current_page) + 1;
						let latest = (this.props.doneRooms||[]).concat(res.list.data||[]);
						this.props.onLessonsDone(latest);
						res.total && res.total.length > 0 && this.props.onLessonsTotalDone(res.total);
					}else{
						this.$no_morelessons_done = true;
					}
				});
			}
		}
	}

	render() {
		let { account } = this.props 
		let content, sidebar = ""
		if (this.props.started) {
			//如果是回放加载回放组件
			content = <CourseForStudent onLeaveRoom={()=>{
				this.__get_lesson_comming();
			}}/>
		} else if (this.props.recording) {
			content = <CourseRecord/>;
		} else if (this.props.testing) {
			content = <Devices />
        } else if (this.props.mycourses){
            content = this.__my_courses();
		} else {
			content = this.__student_page()
			sidebar = <SideBar user={this.props.account} onDeviceTest={()=>{
				this.props.onEnterTester("main")
			}} onViewUser={()=>{
				this.__view_user()
			}} onViewHelper={()=>{
				this.__on_helper()
			}} onEnterMyCourses={()=>{
				this.props.onEnterMyCourses();
				this.__query_courses();
			}}/>
		}
		return (
			<div className="full-h">{sidebar}{content}</div>
		)
	}
	onScrollHandle(event) {
		const clientHeight = event.target.clientHeight
		const scrollHeight = event.target.scrollHeight
		const scrollTop = event.target.scrollTop
		const isBottom = (clientHeight + scrollTop === scrollHeight)
		if (isBottom) {
			this.__query_courses(true);
		}
	}
}

const mapStateToProps = (state, ownProps) => {
	return {
		account 	: state.login.account,
		rooms 		: state.main.rooms,
		room 		: state.room.info,
		gifts 		: state.room.gifts,
		calendar	: state.main.calendar,
		started 	: state.main.courseStarted,
		recording	: state.main.recording,
        testing 	: state.main.enterTester,
		mycourses   : state.main.enterMyCourses,
		commingRoom : state.main.commingRoom,
		commingRooms: state.main.commingRooms,
		doneRooms   : state.main.doneRooms,
		totalComming: state.main.totalComming,
		totalDone	: state.main.totalDone,
	}
}

const mapDispatchToProps = dispatch => ({
	onRoomList     		: (rooms) => dispatch(onRoomList(rooms)),
	onRoomInfo	   		: (data) => dispatch(onRoomInfo(data)),
	onCalendarData 		: (data) => dispatch(onCalendarData(data)),
	onLogout       		: () => dispatch(onLogout()),
	onStartCourse  		: () => dispatch(onStartCourse()),
	confirm 	   		: (data) => dispatch(confirm(data)),
	alert 	   	   		: (data) => dispatch(alert(data)),
	hide 				: () => dispatch(hide()),
    onEnterTester 		: (fromPage) => dispatch(onEnterTester(fromPage)),
    onEnterMyCourses    : ()=>dispatch(onEnterMyCourses()),
    onExitMyCourses    : ()=>dispatch(onExitMyCourses()),
	onChangeUserInfo 	: (user) => dispatch(onChangeUserInfo(user)),
	onCourseRecording   : (status) => dispatch(onCourseRecording(status)),
	onLessonComming     : (room) => dispatch(onLessonComming(room)),
	onLessonsComming    : (rooms) => dispatch(onLessonsComming(rooms)),
	onLessonsDone       : (rooms) => dispatch(onLessonsDone(rooms)),
	onLessonsTotalComming: (rooms) => dispatch(onLessonsTotalComming(rooms)),
	onLessonsTotalDone   : (rooms) => dispatch(onLessonsTotalDone(rooms)),
	showLoading 		: (message) => dispatch(showLoading(message)),
	hideLoading 		: () => dispatch(hideLoading()),
})
  
export default connect(
	mapStateToProps,
	mapDispatchToProps
)(Main)