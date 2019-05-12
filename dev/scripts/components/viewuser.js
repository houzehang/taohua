import React from 'react'
import PropTypes from 'prop-types'
require("../../less/viewuser.less")
const ENV = require("../../../env")
const net = require("../network")
import * as types from '../constants/ActionTypes'

class ViewUser extends React.Component {
	constructor(props) {
		super(props)
		let isStudent
		if (this.props.user.dentity == types.DENTITY.STUDENT) {
			isStudent = true
		}
		this.$origin_username = isStudent?this.props.user.child_name:this.props.user.nickname
		this.state = { 
			editmode	: false, 
			username	: this.$origin_username,
			avatarurl	: isStudent?this.props.user.child_avatar:this.props.user.avatarurl,
			version 	: "-"
		}
	}

	componentDidMount() {
		this.setState({ version: window.ENV_CONF.version })
	}

	componentWillUnmount() {
	}

	__on_change_confirm() {
		if (!this.state.username) {
			this.setState({username: this.$origin_username, editmode: false})
			return
		}
		if (this.state.username != this.$origin_username) {
			if (confirm("是否确定修改昵称？")) {
				net.changeUserInfo({
					child_name: this.state.username
				}).then((response)=>{
					if (response.status) {
						this.__change_user()
					}
				})
			} else {
				this.setState({username: this.$origin_username})
			}
		}
		this.setState({editmode: false})
	}

	__change_user() {
		let user = {
			...this.props.user,
			child_avatar : this.state.avatarurl,
			child_name	 : this.state.username
		}
		this.props.user.child_name 		= this.state.username
		this.props.user.child_avatar  	= this.state.avatarurl
		this.$origin_username		    = this.state.username
		this.props.onChangeUser(user)
	}

	__on_change_avatar(file) {
		if (!file) return
		net.upload_file(file).then((url)=>{
			net.changeUserInfo({
				child_avatar : url
			}).then((response)=>{
				if (response.status) {
					this.setState({avatarurl: url})
					this.__change_user()
				}
			})
		}).done()
	}

	render() {
		let isStudent
		if (this.props.user.dentity == types.DENTITY.STUDENT) {
			isStudent = true
		}
		return (
			<div className={isStudent?"view-user":"view-user teacher"}>
				<div className="avatar" style={{
					"backgroundImage":`url(${this.state.avatarurl})`
				}}>
					{isStudent?<input type="file" accept="image/x-png,image/jpeg" onChange={(event)=>{
						this.__on_change_avatar(event.target.files[0])
					}}/>:""}
				</div>
				<div className="nickname">
					{this.state.editmode?<input type="text" onChange={(event)=>{
						this.setState({ username: event.target.value })
					}} value={this.state.username} autoFocus onBlur={()=>{
						this.__on_change_confirm()
					}}/>:[
						<div className="text" key="0">{this.state.username}</div>,
						isStudent?<div className="edit-btn" key="1" onClick={()=>{
							this.setState({ editmode : true })
						}}></div>:""
					]}
				</div>
				<div className="logout-btn" onClick={()=>{
					this.props.onLogout()
				}}>退出登录</div>
				<div className="version">当前版本：{this.state.version}</div>
			</div>
		)
	}
}

ViewUser.propTypes = {
	user	    	: PropTypes.shape({
		avatarurl	: PropTypes.string.isRequired,
		child_name 	: PropTypes.string,
		id  		: PropTypes.number.isRequired
	}),
	onLogout    	: PropTypes.func.isRequired,
	onChangeUser	: PropTypes.func.isRequired,
}

export default ViewUser