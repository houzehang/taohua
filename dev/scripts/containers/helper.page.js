
require('../../less/helper.less')
import React from 'react';

class Helper extends React.Component {
	constructor(props) {
		super(props)
	}
	componentDidMount() {
	}

	componentWillUnmount() {
	}
	
	render() {
		return  <div className="helper-page">
           <div className="helper-panel">
                <div className='nav-bar'>
                    <div className='nav-item name'>脚本名称</div>
                    <div className='nav-item path'>脚本路径</div>
                    <div className='nav-item state'>当前状态</div>
                    <div className='nav-item controll'>选项</div>
                    <div className='nav-item hotkey'>快捷键</div>
                </div>
				<div className='shell-line'>
					<input className='shell-item name' placeholder="kcpc-watch"/>
					<div className='shell-item path'>../youshi/kecheng-pc</div>
					<div className='shell-item state'>已开启</div>
					<div className='shell-item controll'>

					</div>
					<div className='shell-item hotkey'>F1</div>
				</div>
				<div className='shell-line'>
					<input className='shell-item name' placeholder="kcpc-watch"/>
					<div className='shell-item path'>../youshi/kecheng-pc</div>
					<div className='shell-item state'>已开启</div>
					<div className='shell-item controll'>

					</div>
					<div className='shell-item hotkey'>F1</div>
				</div>
				<div className='shell-line'>
					<input className='shell-item name' placeholder="kcpc-watch"/>
					<div className='shell-item path'>../youshi/kecheng-pc</div>
					<div className='shell-item state'>已开启</div>
					<div className='shell-item controll'>

					</div>
					<div className='shell-item hotkey'>F1</div>
				</div>
				<div className='shell-line'>
					<input className='shell-item name' placeholder="kcpc-watch"/>
					<div className='shell-item path'>../youshi/kecheng-pc</div>
					<div className='shell-item state'>已开启</div>
					<div className='shell-item controll'>

					</div>
					<div className='shell-item hotkey'>F1</div>
				</div>
				<div className='shell-line'>
					<input className='shell-item name' placeholder="kcpc-watch"/>
					<div className='shell-item path'>../youshi/kecheng-pc</div>
					<div className='shell-item state'>已开启</div>
					<div className='shell-item controll'>

					</div>
					<div className='shell-item hotkey'>F1</div>
				</div>
				<div className='shell-line'>
					<input className='shell-item name' placeholder="kcpc-watch"/>
					<div className='shell-item path'>../youshi/kecheng-pc</div>
					<div className='shell-item state'>已开启</div>
					<div className='shell-item controll'>

					</div>
					<div className='shell-item hotkey'>F1</div>
				</div>
				<div className='shell-line'>
					<input className='shell-item name' placeholder="kcpc-watch"/>
					<div className='shell-item path'>../youshi/kecheng-pc</div>
					<div className='shell-item state'>已开启</div>
					<div className='shell-item controll'>

					</div>
					<div className='shell-item hotkey'>F1</div>
				</div>
           </div>
        </div>
	}
}

export default Helper