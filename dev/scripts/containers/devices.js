import React from 'react';
import { connect } from 'react-redux'
require("../../less/devices.less")
import Slider from 'react-rangeslider'
import 'react-rangeslider/lib/index.css'
import { findDOMNode } from 'react-dom';
const path				= $require("path")
const Const 			= require("../../const")
const DEBUG 			= require("../../../env").DEBUG
const Storage 			= require("../Storage")
const AgoraRtcEngine 	= require('../../agora/AgoraSdk')
const $ 				= require("jquery")
const net 				= require("../network")
const context		    = require("../context")
const remote 			= $require("electron").remote
const DeviceAutoSelector= require("../DeviceAutoSelector")
import { 
	onExitTester,alert
} from '../actions'
class Devices extends React.Component {
	constructor(props) {
		super(props)
		this.$client = new AgoraRtcEngine()
		this.$client.initialize(Const.AGORA_APPID);
		this.$client.setChannelProfile(1);
		this.$client.setClientRole(1);
		this.$client.setAudioProfile(0, 1);
		this.$client.setParameters('{"che.audio.live_for_comm":true}');
		this.$client.setParameters('{"che.audio.enable.agc":false}');
		this.$client.setParameters('{"che.video.moreFecSchemeEnable":true}');
		this.$client.setParameters('{"che.video.lowBitRateStreamParameter":{"width":192,"height":108,"frameRate":15,"bitRate":100}}');
		this.$client.enableDualStreamMode(true);
		this.$client.enableVideo();
		this.$client.enableLocalVideo(true);
		this.$client.setVideoProfile(45);
		this.$client.enableLastmileTest()
		this.$client.setAudioPlaybackVolume(30)
		let deviceInfo = DeviceAutoSelector.checkPreferDevice(this.$client)
		this.$quality_msg = ["未知","极好","好","一般","差","极差","不可用"]
		this.state = {
			currentVideoDevice	: deviceInfo.currentVideoDevice, 
			currentVideoName	: deviceInfo.currentVideoName,
			currentSpeakerDevice: deviceInfo.currentSpeakerDevice,
			currentSpeakerName	: deviceInfo.currentSpeakerName,
			currentAudioDevice	: deviceInfo.currentAudioDevice,
			currentAudioName	: deviceInfo.currentAudioName,
			video_devices		: deviceInfo.video_devices, 
			audio_devices		: deviceInfo.audio_devices, 
			speaker_devices		: deviceInfo.speaker_devices,
			volume				: deviceInfo.volume,
			step: 0,
			netquality: 0,
			net_history: [0]
		}

		this.$client.on("lastmilequality", (quality) => {
			console.log("quality",quality)
			let qualities = this.state.net_history
			qualities = qualities.splice(qualities.length-50,qualities.length)
			qualities.push(quality)
			this.setState({ netquality: quality, net_history: qualities })
			if (quality == 1 || quality == 2) {
				quality = 1
			} else if (quality == 3) {
				quality = 2
			} else if (quality == 4) {
				quality = 3
			} else if (quality == 5) {
				quality = 4
			} else {
				quality = 0
			}
			net.log({name:"NET:STATUS", status: quality})
		})
		this.$client.on('error', (err)=>{
			console.error("Got error msg:", err);
		});
	}

	componentDidMount() {
		console.log("frompage",this.props.fromPage)
	}

	componentWillUnmount() {
		try {
			this.$client.videoSourceLeave();
			this.$client.videoSourceRelease();
			this.$client.stopPreview();
			this.$client.stopAudioRecordingDeviceTest();
			this.$client.removeAllListeners('audiovolumeindication');
			this.$client.stopAudioPlaybackDeviceTest();
			this.$client.disableLastmileTest()
		} catch (err) {
			console.log("client leave failed ", err);
		}
	}

	onStartMicTest() {
		this.$client.startAudioRecordingDeviceTest(100)
		this.$client.on('audiovolumeindication', (uid, volume, speaker, totalVolume) => {
			if (this.state.step == 2) {
				this.setState({
					inputVolume: parseInt(totalVolume / 255 * 13, 10)
				});
			}
		});
	}

	onChangeVolume(value) {
		this.setState({volume: value})
		this.$client.setAudioPlaybackVolume(value);
	}

	onStartPreview() {
		if (this.$previewing) return
		this.$client.setupLocalVideo($("#video-area")[0]);
		this.$client.startPreview();
		this.$previewing = true
	}

	onStopPreviewAndStepTo(step) {
		this.$previewing = false
		this.$client.stopPreview();
		$("#video-area").empty()
		setTimeout(()=>{
			this.setState({step})
		})
	}

	step0() {
		let systemInfo = (window.ENV_CONF||{}).systeminfo || {
			os:{},cpu:{},system:{}
		}
		try{
			let memory 	   = remote.process.getSystemMemoryInfo() || {total:0}
			let os		   = '操作系统：' + (systemInfo.os.distro || '') + ' ' + (systemInfo.os.kernal || '');
			let cpuCores   = 'CPU核数：' + (systemInfo.cpu.physicalCores || '') + '核' + (systemInfo.cpu.cores || '') + '线程';
			let cpuSpeed   = 'CPU主频：' + (systemInfo.cpu.speedmin || '') + 'Hz - ' + (systemInfo.cpu.speedmax || '') + 'Hz'; 
			let memoray    = '系统内存：' + (Math.round((memory.total||0)/1024/1024*10)/10)+"G";
			let deviceType = '设备型号：' + (systemInfo.system.manufacturer||'') + (systemInfo.system.model||'');
			return (
				<div className="step-content">
					<div className="os-detail-area">
						<div className='os-cell'>
							<div className='cell-tag'>{os}</div>
							<div className='cell-tag'>{cpuCores}</div>
							<div className='cell-tag'>{cpuSpeed}</div>
							<div className='cell-tag'>{memoray}</div>
							<div className='cell-tag'>{deviceType}</div>
						</div>
					</div>
					<div className="step-btns">
						<button onClick={()=>{
							// if (!context.join_class_enabled) {
							// 	this.props.alert({
							// 		content: "主机配置较低，无法进入下一步",
							// 		sure: ()=>{}
							// 	});
							// 	return;
							// }
							this.setState({step: 1})
						}} className="step-btn">下一步</button>
					</div>
				</div>
			)
		}catch(error){
			console.log('error:device->step0,',error.message || error);
		}
		return '';
	}

	step1() {
		setTimeout(()=>{
			this.onStartPreview()
		},0)
		return (
			<div className="step-content">
				<div className="step-title">确认摄像头能够正常显示，如有问题切换设备试试</div>
				<div className="selector">
					设备：<div className="select-box">{this.state.currentVideoName}</div>
					<select className="select" value={this.state.currentVideoDevice} onChange={(event)=>{
						var index = event.nativeEvent.target.selectedIndex;
						var name  = event.nativeEvent.target[index].text
						this.setState({currentVideoDevice : event.target.value, currentVideoName: name})
						Storage.store("VIDEO_DEVICE",event.target.value)
						this.$client.setVideoDevice(event.target.value);
					}}>
					{
						this.state.video_devices.length > 0 ?
							this.state.video_devices.map((device)=>(
							<option key={device.deviceid} value={device.deviceid}>
								{device.devicename}
							</option>
							))
						:
							<option key="nothing" disabled selected>
								无可用摄像头设备
							</option>
					}
					</select>
				</div>
				<div className="video-area" id="video-area"></div>
				<div className="step-btns">
					<button onClick={()=>{
						this.onStartMicTest()
						this.onStopPreviewAndStepTo(2)
					}} className="step-btn">下一步</button>
					<button onClick={()=>{
						this.onStopPreviewAndStepTo(0)
						this.setState({step: 0})
					}} className="prev-step-btn">上一步</button>
				</div>
			</div>
		)
	}

	step2() {
		let Steps = []
		for(let i=0;i<12;i++) {
			if (i >= this.state.inputVolume) {
				Steps.push(<div className="mic-step" key={i}></div>)
			} else {
				Steps.push(<div className="mic-step on" key={i}></div>)
			}
		}
		return (
			<div className="step-content">
				<div className="step-title">说几句话确认音量有变化，如有问题切换设备试试</div>
				<div className="selector">
					设备：<div className="select-box">{this.state.currentAudioName}</div>
					<select className="select" value={this.state.currentAudioDevice} onChange={(event)=>{
						var index = event.nativeEvent.target.selectedIndex;
						var name  = event.nativeEvent.target[index].text
						this.setState({currentAudioDevice : event.target.value, currentAudioName: name})
						Storage.store("AUDIO_DEVICE",event.target.value)
						this.$client.setAudioRecordingDevice(event.target.value);
					}}>
					{
						this.state.audio_devices.length > 0 ?
							this.state.audio_devices.map((device)=>(
							<option key={device.deviceid} value={device.deviceid}>
								{device.devicename}
							</option>
							))
						:
							<option key="nothing" disabled selected>
								无可用麦克风设备
							</option>
					}
					</select>
				</div>
				<div className="mic-area">
					<div className="mic-icon"></div>
					{Steps}
				</div>
				<div className="step-btns">
					<button onClick={()=>{
    					this.$client.stopAudioRecordingDeviceTest();
						this.setState({step: 3})
					}} className="step-btn">下一步</button>
					<button onClick={()=>{
    					this.$client.stopAudioRecordingDeviceTest();
						this.setState({step: 1})
					}} className="prev-step-btn">上一步</button>
				</div>
			</div>
		)
	}

	step3() {
		if (!this.$playing) {
			this.$playing = true
			setTimeout(()=>{
				let filepath;
				if (DEBUG) {
					filepath = path.join(window.ENV_CONF.__dirname,'libs','AgoraSDK','music.mp3');
				} else {
					filepath = path.join(window.ENV_CONF.__dirname, '..', 'app.asar.unpacked','dist','libs','AgoraSDK','music.mp3');
				}
				console.log("filepath",filepath)
				this.$client.startAudioPlaybackDeviceTest(filepath);
			},0)
		}
		return (
			<div className="step-content">
				<div className="step-title">调整音量确认能听到音乐，如有问题切换设备试试</div>
				<div className="selector">
					设备：<div className="select-box">{this.state.currentSpeakerName}</div>
					<select className="select" value={this.state.currentSpeakerDevice} onChange={(event)=>{
						var index = event.nativeEvent.target.selectedIndex;
						var name  = event.nativeEvent.target[index].text
						this.setState({currentSpeakerDevice : event.target.value, currentSpeakerName: name})
						Storage.store("PLAYBACK_DEVICE",event.target.value)
						this.$client.setAudioPlaybackDevice(event.target.value);
					}}>
					{
						this.state.speaker_devices.length > 0 ?
							this.state.speaker_devices.map((device)=>(
							<option key={device.deviceid} value={device.deviceid}>
								{device.devicename}
							</option>
							))
						:
							<option key="nothing" disabled selected>
								无可用扬声器设备
							</option>
					}
					</select>
				</div>
				<div className="music-area">
					<div className="music-icon"></div>
					<div className="progress-bar">
						<Slider
						min={0}
						max={255}
						value={this.state.volume}
						onChange={(value)=>{
							this.onChangeVolume(value)
						}}
						/>
					</div>
				</div>
				<div className="step-btns">
					<button className="step-btn" onClick={()=>{
						this.props.onExitTester()
					}}>完成</button>
					<button onClick={()=>{
						this.$playing = false
						this.$client.stopAudioPlaybackDeviceTest();
						this.onStartMicTest()
						this.setState({step: 2})
					}} className="prev-step-btn">上一步</button>
				</div>
			</div>
		)
	}

	render() {
		return  <div className="sound-outer">
			<button className="page-back" onClick={()=>{
				this.props.onExitTester()
			}}></button>
			<div className={"sound-tester s-"+this.state.step}>
				<div className="network">实时网络状态: {this.$quality_msg[this.state.netquality]}</div>
				<div className="network-bar">
				{this.state.net_history.map((quality,index)=>{
					return <div className={"quality q-"+quality} key={index}></div>
				})}
				</div>
				<div className="steps">
					<div className="line l0"></div>
					<div className="line l1"></div>
					<div className="line l2"></div>
					<div className="step step-0">
						<div className="step-name">
							<i className="icon"></i>
							主机检测
						</div>
						<div className="step-num">1</div>
					</div>
					<div className="step step-1">
						<div className="step-name">
							<i className="icon"></i>
							摄像头检测
						</div>
						<div className="step-num">2</div>
					</div>
					<div className="step step-2">
						<div className="step-name">
							<i className="icon"></i>
							麦克风检测
						</div>
						<div className="step-num">3</div>
					</div>
					<div className="step step-3">
						<div className="step-name">
							<i className="icon"></i>
							扬声器检测
						</div>
						<div className="step-num">4</div>
					</div>
				</div>
				{this[`step${this.state.step}`]()}
			</div>
		</div>
	}
}

const mapStateToProps = (state, ownProps) => {
	return {
		account : state.login.account,
		room 	: state.room.info,
		fromPage: state.main.fromPage
	}
}


const mapDispatchToProps = dispatch => ({
	onExitTester 	: () => dispatch(onExitTester()),
	alert 	   	   	: (data) => dispatch(alert(data))
})

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(Devices)