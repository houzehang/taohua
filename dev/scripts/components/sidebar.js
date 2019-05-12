import React from 'react'
import PropTypes from 'prop-types'
require("../../less/sidebar.less")
import * as types from '../constants/ActionTypes'

class SideBar extends React.Component {
	constructor(props) {
		super(props)
	}

	componentDidMount() {
		
	}

	componentWillUnmount() {
	}

	render() {
		let isStudent
		if (this.props.user.dentity == types.DENTITY.STUDENT) {
			isStudent = true
		}
		return (
			<div className={isStudent?"sidebar":"sidebar teacher"}>
				<div className="avatar-area center" onClick={()=>{
					this.props.onViewUser()
				}}>
					<div className="avatar" style={{
						"backgroundImage":`url(${isStudent?this.props.user.child_avatar:this.props.user.avatarurl})`
					}}></div>
					<div className="nickname">{isStudent?this.props.user.child_name:this.props.user.nickname}</div>
				</div>
				{isStudent?<div className="mycourses-area center" onClick={()=>{
					this.props.onEnterMyCourses()
				}}>
					<div className="mycourses-btn"></div>
					<div className="txt">我的课程</div>
				</div>:""}
				<div className="device-area center" onClick={()=>{
					this.props.onDeviceTest()
				}}>
					<div className="device-btn"></div>
					<div className="txt">设备检测</div>
				</div>
				{isStudent?<div className="help-area center" onClick={()=>{
					this.props.onViewHelper()
				}}>
					<div className="help-btn"></div>
					<div className="txt">问题帮助</div>
				</div>:""}
			</div>
		)
	}
}

SideBar.propTypes = {
	user	    	: PropTypes.shape({
		avatarurl	: PropTypes.string.isRequired,
		child_name 	: PropTypes.string,
		nickname    : PropTypes.string,
		id  		: PropTypes.number.isRequired
	}),
	onDeviceTest	: PropTypes.func.isRequired,
	onViewUser		: PropTypes.func.isRequired,
	onViewHelper	: PropTypes.func.isRequired,
	onEnterMyCourses: PropTypes.func,
}

export default SideBar