const http2 = require('http2')
const fs = require('fs')
const contentTypeParser = require('content-type-parser')
const httpMessageParser = require('http-message-parser')
const crypto = require('crypto')
const { markAsUntransferable } = require('worker_threads')
const audio = require('../libs/audio')
const { resolve } = require('dns')
const { notDeepStrictEqual } = require('assert')

module.exports = function(RED) {
function alexaAVS(config) {
    RED.nodes.createNode(this,config);
    var node = this;
    let base_urls = ['https://alexa.na.gateway.devices.a2z.com', 'https://alexa.eu.gateway.devices.a2z.com', 'https://alexa.fe.gateway.devices.a2z.com']   
    node.accessToken = config.accessToken
    node.accessTokenType = config.accessTokenType
    node.baseURL = config.baseURL
    node.baseURLType = config.baseURLType
    node.output = config.outputType
    this.on('input', function(msg, send, done) {
        let token = RED.util.evaluateNodeProperty(node.accessToken, node.accessTokenType, node, msg);
        if (base_urls.indexOf(config.baseURLType) >= 0) {
            node.baseurl  = config.baseURLType;
        } else {
            node.baseurl = RED.util.evaluateNodeProperty(node.baseURL, node.baseURLType, node, msg);
        }
        if (config.ffmpegType == 'auto'){
            node.ffmpegPath = 'auto'
        } else{
            node.ffmpegPath = config.ffmpeg
        }
        let client = http2.connect(node.baseurl); 
        client.on('error', (err) => node.error(err));       
        let messageId = "msg_"+crypto.randomBytes(6).toString("hex");
        let dialogRequestId = msg.dialogRequestId || "dialog_"+crypto.randomBytes(6).toString("hex");
        msg.dialogRequestId = dialogRequestId
        var metadata = JSON.stringify(
            {
                "context": [
                    {
                        "header": {
                            "namespace": "SpeechRecognizer",
                            "name": "RecognizerState"
                        },
                        "payload": {

                        }
                    },
                    {
                        "header": {
                            "namespace": "Speaker",
                            "name": "VolumeState"
                        },
                        "payload": {
                            "volume": 25,
                            "muted": false
                        }
                    },
                    {
                        "header": {
                            "namespace": "Alerts",
                            "name": "AlertsState"
                        },
                        "payload": {
                            "allAlerts": [],
                            "activeAlerts": []
                        }
                    },
                    {
                        "header": {
                            "namespace": "SpeechSynthesizer",
                            "name": "SpeechState"
                        },
                        "payload": {
                            "token": "",
                            "offsetInMilliseconds": 0,
                            "playerActivity": "FINISHED"
                        }
                    },
                    {
                        "header": {
                            "namespace": "AudioPlayer",
                            "name": "PlaybackState"
                        },
                        "payload": {
                            "token": "",
                            "offsetInMilliseconds": 0,
                            "playerActivity": "IDLE"
                        }
                    }
                ],
                "event": {
                    "header": {
                        "namespace": "SpeechRecognizer",
                        "name": "Recognize",
                        "messageId": messageId,
                        "dialogRequestId": dialogRequestId
                    },
                    "payload": {
                        "profile": "CLOSE_TALK",
                        "format": "AUDIO_L16_RATE_16000_CHANNELS_1"
                    }
                }
            });
        var data = "--this-is-my-boundary-for-alexa\r\n";
        data += 'Content-Disposition: form-data; name="metadata"\r\n';
        data += 'Content-Type: application/json; charset=UTF-8\r\n\r\n';
        data += metadata;
        data += "\r\n";
        data += "--this-is-my-boundary-for-alexa\r\n";
        data += "Content-Disposition: form-data; name=\"audio\"\r\n";
        data += "Content-Type:application/octet-stream\r\n\r\n";
        audio.proc('wav', msg.payload, node.ffmpegPath)
        .then(content => {
            var payload = Buffer.concat([
                Buffer.from(data, "utf8"),
                Buffer.from(content, 'binary'),
                Buffer.from("\r\n--this-is-my-boundary-for-alexa\r\n", "utf8"),
            ]);
    
            client.on('error', (err) => node.error(err));
            client.on('socketError', (err) => node.error(err));
    
            var request = {
                ':method': 'POST',
                ':scheme': 'https',
                ':path': '/v20160207/events',
                'authorization': `Bearer ${token}`,
                'accept': 'multipart/form-data',
                'content-type': 'multipart/form-data; boundary=this-is-my-boundary-for-alexa'
            };
    
            var req = client.request(request);
            req.setEncoding('binary');
    
            req.on('response', (headers, flags) => {
                msg.avsHeaders = headers
                msg.avsHeaders.status = headers[":status"]
                delete msg.avsHeaders[":status"]
            });
    
            req.on('error', function (err) {
                node.error(err);
            });
    
            let outdata = ''
            req.on('data', (chunk) => { outdata += chunk; });
            req.on('end', () => {
                if (msg.avsHeaders.status == 200){
                        let data = httpMessageParser(outdata)
                        if (data.body != null && data.headers['Content-Type'] == 'application/json; charset=UTF-8'){
                            data.body = JSON.parse(data.body)
                        }
                        var process = function proc(d){
                            return new Promise(resolve => {
                                if (d.headers == null){
                                    resolve()
                                } else if (d.headers['Content-Type'] == 'application/json; charset=UTF-8'){
                                   resolve({headers: d.headers, body : JSON.parse(d.body)})
                                } else if (d.headers['Content-Type'] == 'application/octet-stream'){
                                    if (node.output == 'none') {
                                        resolve({headers : d.headers, body : Buffer.from(d.body.toString().slice(2), 'binary')})
                                    } else {
                                        audio.proc(node.output, Buffer.from(d.body.toString().slice(2), 'binary'), node.ffmpegPath)
                                        .then(b => resolve({headers : d.headers, body : b}) )
                                    }
                                }    
                            })
                        }
                        var promises = data.multipart.map(process)
                        var results = Promise.all(promises)
                        results.then(r =>{
                            data.multipart = r
                            msg.payload = data
                            node.send(msg)
                        })                      
                }
                else {
                    msg.payload = null
                    node.send(msg)
                }
            });
            req.write(payload);
            req.end();
        })
        
        if (done) {
            done();
        }
    })
}
RED.nodes.registerType("alexa-avs",alexaAVS);


}

function jsonparts(data, audioout, ffmpegPath) {
return new Promise((resolve, reject) => {
    if (data.body != null && data.headers['Content-Type'] == 'application/json; charset=UTF-8'){
        data.body = JSON.parse(data.body)
    }
    
})
}