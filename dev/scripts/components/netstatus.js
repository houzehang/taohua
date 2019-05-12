import React from 'react'
import PropTypes from 'prop-types'
require("../../less/netstatus.less")

class NetStatus extends React.Component {
	render() {
		return (
			<div onClick={()=>{
				this.props.click()
			}} className={`netstatus s-${this.props.status} ${this.props.warning?"warning":""}`}>
				<div className="dot"></div>
				<div className="desc"></div>
			</div>
		)
	}
}


NetStatus.propTypes = {
	status: PropTypes.number.isRequired,
	warning: PropTypes.bool.isRequired,
	click: PropTypes.func.isRequired
}

export default NetStatus