
require('../../less/helper.less')
import React from 'react';
import {
	HashRouter as Router,
	Route
} from 'react-router-dom'
import { connect } from 'react-redux'
import Login from './login.page'
import MainTeacherPage from './main.teacher.page'
import MainStudentPage from './main.student.page'
import Dialog from './dialog'
import { alert, confirm, onNetStatusBad, onNetStatusGood } from '../actions'
const NetDetector = require("../netdetector")
const context = require("../context")
import * as types from '../constants/ActionTypes'

class Entry extends React.Component {
	constructor(props) {
		super(props)
	}
	componentDidMount() {
		this.__start_detector()
	}

	componentWillUnmount() {
		this.$detector.unload()
	}

	__start_detector() {
		let detector = new NetDetector
		context.detector = detector
		context.detector.waring_threshold = 3;
	}
	
	render() {
		const { dialog, account } = this.props
		return  <div className="helper-page">
           <div className="helper-panel">
                <div className='nav-bar'>
                    <div className='shell-item name'>脚本名称</div>
                    <div className='shell-item path'>脚本路径</div>
                    <div className='shell-item state'>当前状态</div>
                    <div className='shell-item controll'>控制</div>
                </div>
           </div>
        </div>
	}
}

const mapStateToProps = (state, ownProps) => {
	return {
		account 	: state.login.account,
		dialog  	: state.dialog
	}
}

const mapDispatchToProps = (dispatch, ownProps) => {
	return {
		confirm : (data) 	=> dispatch(confirm(data)),
		onNetStatusBad: () 	=> dispatch(onNetStatusBad()),
		onNetStatusGood: () => dispatch(onNetStatusGood())
	}
}

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(Entry)