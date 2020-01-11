
require('../../less/helper.less')
import React from 'react';
const electron 		= $require('electron')
const ipcRenderer 	= electron.ipcRenderer
const path 			= $require('path')
const fs   			= $require('fs-extra')
const request       = $require('request')

class Helper extends React.Component {
	constructor(props) {
		super(props)
		this.$dir = path.join(electron.remote.app.getPath("userData"),"shell-deploy");
		this.$json_file = path.join(this.$dir, 'shell.json')

		console.log('this.$dir',this.$dir,this.$json_file)

		this.$origin = [
			{name: '',path: '',status: ''}
		];

		this.state = {
            status: "空闲中",
			shells: [...this.$origin]
		}
    }
    
    askForResult(address, id) {
        var options = {
            url: `http:\/\/${address}/ask`,
            method: 'post',
            form: {
                id
            },
            headers: {
                "content-type": "application/json",
            },
            json: true
        };
        request(options, (error, response, body)=> {
            if (!error && response.statusCode == 200) {
                console.log("response",body)
                if (body.result == "error") {
                    console.log("deploy error",body.log)
                } else if (body.result == "done") {
                    console.log("deploy done!")
                    console.log(body.log)
                    if (body.log && ~body.log.indexOf('upload lesson zip file success')) {
                        // console.log('MINGXI_DEBUG_LOG>>>>>>>>>上传成功',url);

                        this.setState({
                            status:'部署成功'
                        })
                    } else{
                        // console.log('MINGXI_DEBUG_LOG>>>>>>>>>上传失败',url);

                        this.setState({
                            status:'部署失败'
                        })
                    }
                } else {
                    console.log("waiting for result...")
                    setTimeout(()=>{
                        this.askForResult(address, id)
                    },10000)
                }
            } else {
                console.log("response",response.statusCode)
            }
        });
    }

    deploy(url) {
        request.get(`http:\/\/47.93.191.180:65530/list`,(err, _, body)=> {
            if (err) {
                return console.error('upload failed:', err);
            }
            let list = JSON.parse(body)
            list = list.sort((prev,next)=>{
                return prev.weight - next.weight > 0 ? -1 : 1
            })
            if (list.length > 0) {
                console.log("choosed server",list[0])
                var options = {
                    url: `http:\/\/${list[0].address}/deploy`,
                    method: 'post',
                    form: {
                        url
                    },
                    headers: {
                        "content-type": "application/json",
                    },
                    json: true
                };
                request(options, (error, response, body)=> {
                    if (!error && response.statusCode == 200) {
                        console.log("response",body)
                        if (body.id) {
                            this.askForResult(list[0].address, body.id)
                        }
                    } else {
                        console.log("response",response.statusCode)
                    }
                });
            } else {
                console.log("no available server")
            }
        })
    }

	componentDidMount() {
		ipcRenderer.on('selectedItem',(event, filePath, index)=>{
			console.log('filePath:',filePath)
			let newState = {...this.state}
			console.log('newState',newState,index)
			newState.shells[index].path = filePath
			this.__setState(newState)
		});

		
		// if (fs.existsSync(this.$json_file)) {
		// 	let content = fs.readFileSync(this.$json_file, 'utf8')
		// 	this.setState(JSON.parse(content))
		// 	console.log(content)
		// 	console.log('this.state:',this.state)
		// }else{
		// 	console.log('empty')
		// 	this.__localStore(this.state)
		// }
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
        console.log('MINGXI_DEBUG_LOG>>>>>>>>>this.state.shells',this.state.shells);
        let waitingStatus = '部署中，请静候片刻。。。'
		return  <div className="helper-page">
           <div className="helper-panel">
                <div className='nav-bar'>
                    <div className='nav-item name'>课件名称</div>
                    <div className='nav-item path'>当前状态</div>
                    {/* <div className='nav-item state'>当前状态</div> */}
                    <div className='nav-item controll'>操作</div>
                    {/* <div className='nav-item hotkey'>快捷键</div> */}
                </div>
				{this.state.shells.map((shell, index)=>{
					return <div className='shell-line' key={`shell-${index}`}>
						<input className='shell-item name' placeholder="输入或粘贴课件英文名称" value={shell.name} onChange={(event)=>{
							let value = event.target.value;
							let newState = {...this.state}
							console.log('newState',newState,index)
							newState.shells[index].name = value
							this.__setState(newState)
						}}/>
						<div className='shell-item path' onDoubleClick={()=>{
							// ipcRenderer.send('open-directory-dialog','openFile',index)
						}}>{this.state.status}&nbsp;&nbsp;</div>
						{/* <div className='shell-item state'>{shell.status}</div> */}
						<div className='shell-item controll'>
							<div className={this.state.status != waitingStatus &&  shell.name && shell.name.length > 0 ? 'btn-run' : 'btn-run invalid'} onClick={()=>{
                                if (this.state.status == waitingStatus) {
                                    return
                                }
                                this.setState({
                                    status:waitingStatus
                                })
                                this.deploy(shell.name)
                                console.log('MINGXI_DEBUG_LOG>>>>>>>>>this.state.status',this.state.status);
                                // // $require('electron').shell.openItem(shell.state)
                                // setTimeout(() => {
                                //     this.setState({
                                //         status:'部署结束-成功'
                                //     })
                                // }, 3000);
							}}>部署</div>
						</div>
						{/* <div className='shell-item hotkey'>F1</div> */}
					</div>
				})}
           </div>
        </div>
	}
}

export default Helper