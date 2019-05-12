import React from 'react'
import PropTypes from 'prop-types'
const $ = require("jquery")

class StudentHead extends React.Component {
	constructor(props) {
		super(props)
		this.state = { hover: false }
	}
	render() {
		let hasUser = this.props.user
		let child_name;

		let features 		= this.props.features;
		let student_frature = this.props.user.frature;
		let featureColor,hightLight;

		features && features.map((feature)=>{
			if (feature && feature.en_name == student_frature) {
				featureColor = feature.color;
				hightLight = this.props.mainFeature == feature.en_name;
			}
		});

		//1.性格标签背景颜色
		let ft_bg_color = this.props.isTeacher && featureColor && !this.props.user.percent ? {
			background:featureColor
		}:{}
		//2.性格边框颜色
		let ft_frame_bg_color = this.props.isTeacher && featureColor && hightLight ? {
			border: `0.01rem solid #fff`,
			boxShadow:`0rem 0rem 0.2rem ${featureColor}`
		}:{}
		if (this.props.user) {
			child_name = this.props.user.child_name;
		}
		if (!child_name && this.props.user && this.props.user.stream) {
			if (this.props.user.stream.data) {
				child_name = this.props.user.stream.data.child_name;
			}
		}

		child_name = child_name || "-"

		setTimeout(() => {
			if (!(this.props.user && this.props.user.online)) {
				$(`#student_${this.props.user.id}`).empty();
			}
		}, 0);
		return hasUser ? (
					<div className={(this.state.hover?"student hover":"student ")+(this.props.user.online?"":" nothing")} key={this.props.user.id+""} onMouseOver={()=>{
						if (this.props.isTeacher) {
							this.setState({ hover:true })
						}
					}} onMouseOut={(event)=>{
						if (this.props.isTeacher) {
							this.setState({ hover:false })
						}
					}}>
						{this.props.isTeacher || !this.props.withFrame ? "" : <div className={`avatar-frame ${this.props.user.warn?"bink":""}`}></div>}
						{this.props.isTeacher?<div className = "high-light-frame" style={ft_frame_bg_color}></div>:""}
						<div className="avatar-head" id={"student_"+this.props.user.id} style={this.props.user.online ? {
							backgroundImage : `url(${this.props.user.avatarurl})`
						} : null}>
						</div>
						{this.props.isChairMaster && this.props.user.stream ? <div className="dance-times">
							<div className='stage-item'></div>
							<span>{this.props.danceTimes||0}</span>
						</div> : ''}
						<div className="avatar-info" style={ft_bg_color}>
							{this.props.user.progress_rank ? <div className="avatar-rank">{this.props.user.progress_rank}</div>:""}
							{this.props.user.percent ? <div className={this.props.user.percent==100?"avatar-bar full":"avatar-bar"} style={{"width":this.props.user.percent+"%"}}></div>:"" }
							<div className="avatar-name">{child_name}</div>
							<div className="avatar-stars">{this.props.user.gift_total || 0}</div>
						</div>
						
						{this.props.isTeacher && this.props.user && this.props.user.online ?
						<div className="summary">
							<div className="summary-inner">
								<div className={this.props.isTeacher?"btns":"btns student"}>
									{this.props.isTeacher?(
										<button className={this.props.user.dancing?"view-btn on":"view-btn"} onClick={()=>{
											if (this.props.user.stream) {
												this.props.onClickView(this.props.user)
											}
										}}>
											<div className="btn-icon"><div className="icon"></div></div>
											<span className="btn-name">讲台</span>
										</button>
									):""}
									{this.props.isTeacher ?(
										<button className="gift-btn" onClick={()=>{
											if (this.props.user.online) {
												this.props.onClickGift(this.props.user)
											}
										}}>
											<div className="btn-icon"><div className="icon"></div></div>
											<span className="btn-name">礼物</span>
										</button>
									):""}
									{this.props.isTeacher ?(
										<button className={this.props.user.unmuted?"speak-btn on":"speak-btn"} onClick={()=>{
											this.props.onClickSpeak(this.props.user)
										}}>
											<div className="btn-icon"><div className="icon"></div></div>
											<span className="btn-name">静音</span>
										</button>
									):""}

									{this.props.isTeacher ?(<button className="warn-btn" onClick={()=>{
											this.props.onClickWarn(this.props.user);
									}}>
										<div className="btn-icon"><div className="icon"></div></div>
										<span className="btn-name">调整坐姿</span>
									</button>):""}
							</div>
						</div>
						</div>:""}
					</div>
				) : 
				<div className="student nothing"></div>
	}
}

StudentHead.propTypes = {
	user  : PropTypes.shape({
		id 	     	: PropTypes.number,
		child_name 	: PropTypes.string,
		avatarurl	: PropTypes.string,
		handsup 	: PropTypes.number,
		speak  		: PropTypes.number,
		gifts  		: PropTypes.arrayOf(PropTypes.shape({
			id   	: PropTypes.number,
			total	: PropTypes.number
		}))
	}),
	tencent 	 : PropTypes.bool,
	isTeacher 	 : PropTypes.bool,
	speak 		 : PropTypes.bool,
	onClickSpeak : PropTypes.func,
	onClickGift  : PropTypes.func,
	onClickView  : PropTypes.func,
	onClickWarn  : PropTypes.func
}

export default StudentHead