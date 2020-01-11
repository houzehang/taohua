const Q = require('q')
const fs = $require('fs');
const Eventer = require('./eventer')
const desktopCapturer = $require('electron').desktopCapturer;
const APP_NAME = '课件部署助手-测试环境';

class VideoRecord extends Eventer {
    constructor() {
        super()
        this.$recorder = null;
    }

    start() {
        desktopCapturer.getSources({ types: ['window', 'screen'] }, (error, sources) => {
            if (error) throw error;
            for (var i = 0; i < sources.length; ++i) {
                if (sources[i].name == APP_NAME) {
                    navigator.webkitGetUserMedia({
                        audio: {
                            mandatory: {
                                chromeMediaSource: 'desktop'
                            }
                        },
                        video: {
                            mandatory: {
                                chromeMediaSource: 'desktop',
                                chromeMediaSourceId: sources[i].id,
                                minWidth: 1300,
                                maxWidth: 1300,
                                minHeight: 790,
                                maxHeight: 790
                            }
                        }
                    }, this.__gotStream.bind(this), this.__get_user_media_error.bind(this));
                    return;
                }
            }
        });
    }

    stop() {
        if (this.$recorder) {
            this.$recorder.stop();
        }
    }

    __mixAudioStream(Mediastream) {
        let systemAudioTrack = Mediastream.getAudioTracks()[0]; //获取强制获取的桌面音【轨】
        return Q.Promise((resolve, reject) => {
            this.__get_micro_audio_stream().then((audioStream) => {//获取麦克风音频【流】
                let audioContext = new AudioContext();//创建音频上下文
                let microphoneStreamNode = audioContext.createMediaStreamSource(audioStream);//创建节点
                let sysAudioStream = new MediaStream();//创建一个媒体流
                sysAudioStream.addTrack(systemAudioTrack);//把系统音轨添加到新的媒体流

                let sysAudioStreamNode = audioContext.createMediaStreamSource(sysAudioStream);//创建系统音频节点
                let mixedOutput = audioContext.createMediaStreamDestination();//创建一个输出媒体流节点
                microphoneStreamNode.connect(mixedOutput);//把麦克风节点和系统音节点添加到输出媒体流
                sysAudioStreamNode.connect(mixedOutput);//把麦克风节点和系统音节点添加到输出媒体流
                resolve(mixedOutput.stream);//返回混合后的媒体流
            }).catch(err => {
                reject()
            })
        })
    }

    __gotStream(stream) {
        this.__mixAudioStream(stream).then((mixedstream) => {
            stream.removeTrack(stream.getAudioTracks()[0]);
            stream.addTrack(mixedstream.getAudioTracks()[0])
            this.__create_recorder(stream);
        })
    }

    __create_recorder(stream) {
        this.$recorder = new MediaRecorder(stream);
        this.$recorder.start();
        this.$recorder.ondataavailable = event => {
            let blob = new Blob([event.data], {
                type: 'video/mp4'
            });
            this.__save_media(blob);
        };
    }

    __get_micro_audio_stream() {
        return navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    }

    __save_media(blob) {
        let fileReader = new FileReader();
        fileReader.onload = function () {
            let buffer = new Buffer(fileReader.result);
            let savepath = String.raw`D:/_youshi/kecheng-pc2/video_records/` + (Date().replace(/\W+|\:/g, '_')) + `.mp4`;
            fs.writeFile(savepath, buffer, {}, (err, res) => {
                if (err) {
                    console.error(err);
                    return
                }
            })
        }
        fileReader.readAsArrayBuffer(blob);
    }

    __get_user_media_error(e) {
        console.log('__get_user_media_error', e);
    }
}
module.exports = new VideoRecord