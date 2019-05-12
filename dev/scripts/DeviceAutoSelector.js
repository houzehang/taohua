const Eventer = require('./eventer')
const Storage = require("./Storage")

// const DEVICE_SIGN = 'Logitech'

class DeviceAutoSelector extends Eventer {
    constructor() {
        super()
    }
    
    checkPreferDevice(client) {
        let deviceInfo = this.getPreferDevice(client)
        const {currentVideoDevice,currentAudioDevice,currentSpeakerDevice} = deviceInfo
        if (currentVideoDevice) {
            Storage.store("VIDEO_DEVICE",currentVideoDevice)
			this.$client.setVideoDevice(currentVideoDevice);
        }
		if (currentAudioDevice) {
            Storage.store("AUDIO_DEVICE",currentAudioDevice)
            this.$client.setAudioRecordingDevice(currentAudioDevice);
		}
        if (currentSpeakerDevice) {
            Storage.store("PLAYBACK_DEVICE",currentSpeakerDevice)
            this.$client.setAudioPlaybackDevice(currentSpeakerDevice);
        }
        return deviceInfo
    }

    getPreferDevice(client) {
        if (!client) return;
        this.$client = client

        //读取设备记录
		let currentVideoDevice 	= Storage.get("VIDEO_DEVICE"),
			currentAudioDevice 	= Storage.get("AUDIO_DEVICE"),
            currentSpeakerDevice= Storage.get("PLAYBACK_DEVICE"),
            currentVideoName, 
            currentAudioName,
            currentSpeakerName,
            preferAudioDeviceId, 
            preferSpeakerDeviceId

        //读取设备列表
        let video_devices 	    = this.$client.getVideoDevices()
        let audio_devices       = this.$client.getAudioRecordingDevices()
        let speaker_devices     = this.$client.getAudioPlaybackDevices()

        //优选设备
            
        //检测设备是否存在
        let foundVideo          = false,
            foundAudio          = false,
            foundSpeaker        = false;
        video_devices.map((item)=>{
            if (item && item.deviceid == currentVideoDevice) {
                currentVideoName = item.devicename
                foundVideo = true;
            }
        })
        audio_devices.map((item)=>{
            if (item && item.deviceid == currentAudioDevice) {
                foundAudio = true;
                currentAudioName      = item.devicename
            }
            // if (new RegExp(DEVICE_SIGN).test(item.devicename)) {
            //     preferAudioDeviceId   = item.deviceid
            //     currentAudioName      = item.devicename
            // }
        })
        speaker_devices.map((item)=>{
            if (item && item.deviceid == currentSpeakerDevice) {
                foundSpeaker          = true;
                currentSpeakerName    = item.devicename
            }
            // if (new RegExp(DEVICE_SIGN).test(item.devicename)) {
            //     preferSpeakerDeviceId = item.deviceid
            //     currentSpeakerName    = item.devicename
            // }
        })

        //storage没有记录设备 || storage记录的设备已不再列表中
		if (!currentVideoDevice || !foundVideo) {
            currentVideoDevice  = this.$client.getCurrentVideoDevice()
            video_devices.map((item)=>{
                if (item && item.deviceid == currentVideoDevice) {
                    currentVideoName = item.devicename;
                }
            })
        }
        //没有优选设备 && (storage没有记录设备 || storage记录的设备已不再列表中)
		if (!preferAudioDeviceId && (!currentAudioDevice || !foundAudio)) {
            currentAudioDevice  = this.$client.getCurrentAudioRecordingDevice()
            audio_devices.map((item)=>{
                if (item && item.deviceid == currentAudioDevice) {
                    currentAudioName = item.devicename;
                }
            })
		}
        //没有优选设备 && (storage没有记录设备 || storage记录的设备已不再列表中)
		if (!preferSpeakerDeviceId && (!currentSpeakerDevice || !foundSpeaker)) {
            currentSpeakerDevice= this.$client.getCurrentAudioPlaybackDevice()
            speaker_devices.map((item)=>{
                if (item && item.deviceid == currentSpeakerDevice){
                    currentSpeakerName = item.devicename;
                }
            })
        }
        
        //记录设备
        currentAudioDevice   = preferAudioDeviceId || currentAudioDevice;
        currentSpeakerDevice = preferSpeakerDeviceId || currentSpeakerDevice;

        return {
            currentVideoDevice,
            currentSpeakerDevice,
            currentAudioDevice,
            currentVideoName,
            currentSpeakerName,
            currentAudioName,
            video_devices,
            audio_devices,
            speaker_devices,
			volume: this.$client.getAudioPlaybackVolume(),
        }
    }
}
module.exports = new DeviceAutoSelector