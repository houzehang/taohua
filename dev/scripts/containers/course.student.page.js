import React from 'react';
import { connect } from 'react-redux'
import StudentHead from '../components/student-head'
import { 
	onEndCourse, onRoomMoreInfo,
	onNewStream, onStreamLeave,
	onHandsupSwitch, onNewGift,
	onWarn,
	onHandsupRank, onUserMuted, onMuteAllSwitch, onSilentSwitch,
	onDancing,
	onBeginCourse,
	onPauseCourse,
	onResumeCourse,
	onCourseTick,
	confirm, alert,
	onEnterTester,
	onMagicSwitch,
	showLoading,hideLoading,onRankSwitch,
	onProgressUpdate,
	onUpdateGift, onProgressReset, onUserAddRoom
} from '../actions' 
const Const   		= require('../../const')
import * as types from '../constants/ActionTypes'

import CourseBase from './course.base.page'
const net = require("../network")
const $ = require("jquery")

class Course extends CourseBase {
	constructor(props) {
		super(props)
		this.state 		= { 
			control: !this.props.status.started,
			process: {current:0,total:0}
		}
		this.$view_mode = 1
		this.$in_warning = false;
		this.$warning_id = null;
	}
	
	componentDidMount() {
		super.componentDidMount();
		this.$room.on("LEAVE_ROOM", ()=>{
			this.$session.destroy()
			if (this.$waiting_to_tester) {
				this.props.onEnterTester("course")
			} else {
				this.props.onEndCourse()
			}
			if (this.props.onLeaveRoom) {
				this.props.onLeaveRoom();
			}
		})
		if (this.$timer_warning) {
			clearTimeout(this.$timer_warning);
		}
	}

	leaveCourse() {
		if (this.$waiting_to_tester) {
			this.props.onEnterTester("course")
		} else {
			this.props.onEndCourse()
		}
	}

	preLeaveCourse() {
		this.props.confirm({
			content : "确定要退出房间吗？",
			sure: ()=>{
				this.props.showLoading("正在退出房间...")
				this.leaveCourse()
			}
		})
	}

	render() {
		let dancing, warning
		setTimeout(()=>{
			let teacher = this.props.teacher
			if (teacher.stream && !teacher.stream_inited) {
				teacher.stream_inited = true
				teacher.stream.play('master-head');
			}
			if (this.props.students) {
				this.props.students.forEach((student)=>{
					if(student.stream && !student.stream_inited) {
						console.log("play stream",student.id)
						// 开启了弱网络优化时
						if (this.__in_weak_net()) {
							if (student.id == this.props.account.id) {
								student.stream.play('student_'+student.id)
								student.stream_inited = true
							}
						} else {
							if (student.id != this.$last_dancing) {
								student.stream.play('student_'+student.id)
							}
							student.stream_inited = true
						}
					}
					if (student.stream_inited) {
						// 开启了弱网络优化时，只保留自己的流和正在上台人的流
						if (this.__in_weak_net()) {
							if (student.id != this.props.account.id && 
								this.$last_dancing != student.id) {
								student.stream.stop()
								student.stream_inited = false
							}
						}
					}
					if (!student.stream && student.id == this.$last_dancing) {
						this.$room.rtc.rtcengine.unsubscribe(this.$last_dancing)
						this.$last_dancing = null
					}
				})
			}
			if (dancing) {
				this.__put_to_dancing(dancing.id)
			} else {
				if (this.$last_dancing) {
					this.__back_from_dancing(this.$last_dancing)
				}
				this.$last_dancing = null
			}
		},0)
		let students = (this.props.students||[]).concat()
		// 排序按照进入场景的时间来排序
		students.sort((prev,next)=>{
			next = next.online_time || new Date().getTime()+1000000
			prev = prev.online_time || new Date().getTime()+1000000
			return next < prev ? 1 : -1
		})

		for(let i=0,len=students.length;i<len;i++) {
			let item = students[i]
			if (item.dancing && item.stream) {
				dancing = item
			}
		}
		let studentHeads = students.map((student)=>(
			<StudentHead 
				key={student.id} 
				isTeacher={false} 
				user={student} 
				features={this.props.room.features}
				withFrame={this.props.account.id == student.id}
				onClickSpeak={(user)=>{}} 
				onClickGift={(user)=>{}} 
				onClickView={(user)=>{}}/>
		))
		let handsupStudents = []
		students.forEach((student)=>{
			if (student.online) {
				handsupStudents.push(student)
			}
		})
		let dancingClass = this.props.account.train ? 'avatar train' : 'avatar'
		let TeacherView = <div className="teacher-area">
			<div className="avatars">
				<div className="avatar">
					<div className="avatar-head" id="master-head" style={{
						"backgroundImage" : this.props.teacher.stream?"":`url(${this.props.teacher.avatarurl})`
					}}>
					</div>
					<div className="avatar-info">老师：{this.props.teacher.child_name}</div>
				</div>
				<div className={dancing? dancingClass :(this.state.draft?"avatar draft":"avatar nothing")}>
					<div className="ph-text">未指定小朋友发言</div>
					<div className="avatar-head" id="dancing-head"></div>
					<div className="avatar-info">学生：{dancing?dancing.child_name:""}</div>
					<div className={this.state.draft?"draft-text":"draft-text none"} dangerouslySetInnerHTML={{__html: this.state.draft}}></div>
				</div>
			</div>
		</div>
		let StudentView = <div className="student-area">
			{studentHeads}
		</div>
		return (
			<div className="page course-page student">
				<div className="inner">
					<div className="course-page-back" onClick={()=>{
						this.preLeaveCourse()
					}}>
					</div>
					<div className="content">
						<div className="course-content kc-canvas-area" id="course-content"></div>
					</div>
					<div className="entities-area">
						{TeacherView}
						{StudentView}
						<div className="counter icon">
							<button className="help-btn" onClick={()=>{
								this.onHelpClick()
							}}></button>
						</div>
					</div>
				</div>
			</div>
		)
	}
}

const mapStateToProps = (state, ownProps) => {
	return {
		account 	: state.login.account,
		room 		: state.room.info,
		students	: state.room.students,
		teacher 	: state.room.teacher,
		started 	: state.main.courseStarted,
		switches	: state.room.switches,
		status  	: state.room.status,
		netStatus 	: state.main.netStatus
	}
}

const mapDispatchToProps = dispatch => ({
	onRoomMoreInfo	: (data) => dispatch(onRoomMoreInfo(data)),
	onNewStream		: (data) => dispatch(onNewStream(data)),
	onStreamLeave	: (data) => dispatch(onStreamLeave(data)),
	onHandsupSwitch : (status) => dispatch(onHandsupSwitch(status)),
	onMagicSwitch   : (status) => dispatch(onMagicSwitch(status)),
	onRankSwitch    : (status) => dispatch(onRankSwitch(status)),
	onMuteAllSwitch : (status) => dispatch(onMuteAllSwitch(status)),
	onSilentSwitch  : (status) => dispatch(onSilentSwitch(status)),
	onNewGift    	: (data) => dispatch(onNewGift(data)),
	onWarn       	: (data,status) => dispatch(onWarn(data,status)),
	onHandsupRank   : (id, rank) => dispatch(onHandsupRank(id, rank)),
	onUserMuted 	: (id, status, recovering) => dispatch(onUserMuted(id, status, recovering)),
	onDancing 		: (id, status) => dispatch(onDancing(id, status)),
	onEndCourse 	: () => dispatch(onEndCourse()),
	onBeginCourse 	: () => dispatch(onBeginCourse()),
	onPauseCourse 	: () => dispatch(onPauseCourse()),
	onResumeCourse 	: () => dispatch(onResumeCourse()),
	onCourseTick 	: () => dispatch(onCourseTick()),
	confirm 		: (data) => dispatch(confirm(data)),
	alert 	    	: (data) => dispatch(alert(data)),
	onEnterTester 	: (page) => dispatch(onEnterTester(page)),
	showLoading 	: (message) => dispatch(showLoading(message)),
	hideLoading 	: () => dispatch(hideLoading()),
	onUpdateGift 	: (data) => dispatch(onUpdateGift(data)),
	onProgressUpdate: (id, percent) => dispatch(onProgressUpdate(id, percent)),
	onProgressReset : () => dispatch(onProgressReset()),
	onUserAddRoom 	: (id) => dispatch(onUserAddRoom(id))
})
  
export default connect(
	mapStateToProps,
	mapDispatchToProps
)(Course)
