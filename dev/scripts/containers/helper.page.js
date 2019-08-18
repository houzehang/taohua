
require('../../less/helper.less')
import React from 'react';
const electron 		= $require('electron')
const ipcRenderer 	= electron.ipcRenderer
const path 			= $require('path')
const fs   			= $require('fs-extra')

class Helper extends React.Component {
	constructor(props) {
		super(props)
		this.$dir = path.join(electron.remote.app.getPath("userData"),"shell");
		this.$json_file = path.join(this.$dir, 'shell.json')

		console.log('this.$dir',this.$dir,this.$json_file)

		this.$origin = [
			{name: '',path: '',status: ''},
			{name: '',path: '',status: ''},
			{name: '',path: '',status: ''},
			{name: '',path: '',status: ''},
			{name: '',path: '',status: ''},
			{name: '',path: '',status: ''},
			{name: '',path: '',status: ''},
			{name: '',path: '',status: ''},
			{name: '',path: '',status: ''},
			{name: '',path: '',status: ''},
			{name: '',path: '',status: ''},
			{name: '',path: '',status: ''}
		];

		this.state = {
			shells: [...this.$origin]
		}
	}

	componentDidMount() {
		ipcRenderer.on('selectedItem',(event, filePath, index)=>{
			console.log('filePath:',filePath)
			let newState = {...this.state}
			console.log('newState',newState,index)
			newState.shells[index].path = filePath
			this.__setState(newState)
		});

		
		if (fs.existsSync(this.$json_file)) {
			let content = fs.readFileSync(this.$json_file, 'utf8')
			this.setState(JSON.parse(content))
			console.log(content)
			console.log('this.state:',this.state)
		}else{
			console.log('empty')
			this.__localStore(this.state)
		}
	}

	componentWillUnmount() {
	}

	__clearJsonFile(){
		if (fs.existsSync(this.$json_file)) {
			fs.unlinkSync(this.$json_file)
		}
	}

	__clearState(){
		this.setState({shells: [...this.$origin]})
	}

	__addShell(){

	}

	__localStore(info={}){
		fs.ensureDirSync(this.$dir); 
		fs.writeFileSync(this.$json_file,JSON.stringify(this.state), 'utf8')
	}

	__setState(state){
		this.setState(state)
		this.__localStore(state)
	}
	
	render() {
		let shellItems = [
			{name: 'shell-1',}
		]
		return  <div className="helper-page">
           <div className="helper-panel">
                <div className='nav-bar'>
                    <div className='nav-item name'>脚本名称</div>
                    <div className='nav-item path'>脚本路径<span>（双击编辑）</span></div>
                    {/* <div className='nav-item state'>当前状态</div> */}
                    <div className='nav-item controll'>操作<span></span></div>
                    {/* <div className='nav-item hotkey'>快捷键</div> */}
                </div>
				{this.state.shells.map((shell, index)=>{
					return <div className='shell-line' key={`shell-${index}`}>
						<input className='shell-item name' placeholder="" value={shell.name} onChange={(event)=>{
							let value = event.target.value;
							let newState = {...this.state}
							console.log('newState',newState,index)
							newState.shells[index].name = value
							this.__setState(newState)
						}}/>
						<div className='shell-item path' onDoubleClick={()=>{
							ipcRenderer.send('open-directory-dialog','openFile',index)
						}}>{shell.path}&nbsp;&nbsp;</div>
						{/* <div className='shell-item state'>{shell.status}</div> */}
						<div className='shell-item controll'>
							<div className={shell.path ? 'btn-run' : 'btn-run invalid'} onClick={()=>{
								$require('electron').shell.openItem(shell.path)
							}}>运行</div>
						</div>
						{/* <div className='shell-item hotkey'>F1</div> */}
					</div>
				})}
           </div>
        </div>
	}
}

export default Helper