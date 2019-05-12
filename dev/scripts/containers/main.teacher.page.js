import React from 'react';
import { connect } from 'react-redux'
import Calendar from '../components/calendar'
import Download from '../components/download'
import CourseForTeacher from './course.teacher.page.js'
import CourseRecord from './course.record'
import Devices from './devices'
import SideBar from '../components/sidebar'
import ViewUser from '../components/viewuser'
import Helper from '../components/helper'
import * as types from '../constants/ActionTypes'
const net = require("../network")
import { 
	onRoomList, onCalendarData, onRoomInfo,
	onLogout, onStartCourse, onEndCourse,
	confirm, alert, hide, onChangeUserInfo, onEnterTester,
	onCourseRecording
} from '../actions'
const context = require("../context")
const storage = require("../Storage")

class Main extends React.Component {
	constructor(props) {
		super(props)
		this.$detect_delay 		= 5000
		this.$cache_valid_time 	= 60*60*1000
		this.$calendarRef  		= React.createRef()
		this.state 				= {}
		this.recordsRoom = {};
		net.on("LOGOUT_NEEDED", ()=>{
			this.onLogout()
		})
	}

	strToDate(str) {
		let parsed = str.split(/[-: ]/)
		return new Date(parsed[0], parsed[1] - 1, parsed[2]||1, parsed[3]||0, parsed[4]||0, parsed[5]||0)
	}

	componentDidMount() {
		context.user = this.props.account
		net.reportSystemBaseInfo()
	}

	__on_pick_date(data) {
		this.props.onCalendarData(data)
		let choosed = data.choosed_txt
		net.lessonsByDate(`${choosed.year}-${choosed.month}-${choosed.day}`).then((res)=>{
			this.props.onRoomList(res.rooms)
		})
	}

	__on_change_month(data) {
		let month = data.month > 9 ? data.month : ("0"+data.month)
		net.lessons(`${data.year}-${month}`).then((res)=>{
			let dates = res.dates
			this.$calendarRef.current.setHighlighted(dates)
		}).done()
	}

	__master_page() {
		let calendar = <Calendar onPickDate={(data)=>{
			this.__on_pick_date(data)
		}} onChangeMonth={(data)=>{
			this.__on_change_month(data)
		}} higlighted={this.state.higlighted} ref={this.$calendarRef}/>
		return (
			<div className="page calendar-page">
				<div className="calendar-inner">
					{calendar}
					{
						this.props.rooms ? 
						<div className="courses">
							<div className="title">
								<div className="label">今日课程</div>
							</div>
							{
								this.props.rooms.length == 0 ? <div className="nothing">今日没有课哦~</div> :
								(this.props.rooms.map((room,index)=>(
									<div className="row" key={index}>
										<div className="cover">
											<img src={room.avatar} alt=""/>
										</div>
										<div className="info">
											<div className="name">{room.name}</div>
											<div className="index">{room.lesson_name}</div>
											<div className="date">上课时间：{room.start_time}</div>
										</div>
										<button className="start-btn" disabled={room.state==2} onClick={()=>{
											this.onStartRoom(room)
										}}></button>
										{room.button_hf?<button className="record-btn" onClick={()=>{
											this.onRecordRoom(room)
										}}></button>:<button className="download-btn" onClick={()=>{
											this.onDownload(room)
										}}></button>}									
									</div>
								)))
							}
						</div>:""
					}
				</div>
			</div>
		)
	}

	onStartRoom(data) {
		this.onDownload(data, true)
	}

	__onStartRoom(data,isRecord) {
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
		console.log("download",data)
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

	render() {
		let { account } = this.props 
		let content, sidebar = ""
		if (this.props.started) {
			//如果是回放加载回放组件
			content = <CourseForTeacher/>
		} else if (this.props.recording) {
			content = <CourseRecord/>;
		} else if (this.props.testing) {
			content = <Devices />
		} else {
			content = this.__master_page()
			sidebar = <SideBar user={this.props.account} onDeviceTest={()=>{
				this.props.onEnterTester("main")
			}} onViewUser={()=>{
				this.__view_user()
			}} onViewHelper={()=>{
				this.__on_helper()
			}}/>
		}
		return (
			<div className="full-h">{sidebar}{content}</div>
		)
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
		testing 	: state.main.enterTester
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
	onChangeUserInfo 	: (user) => dispatch(onChangeUserInfo(user)),
	onCourseRecording   : (status) => dispatch(onCourseRecording(status))
})
  
export default connect(
	mapStateToProps,
	mapDispatchToProps
)(Main)