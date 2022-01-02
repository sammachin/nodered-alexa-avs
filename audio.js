const Stream = require('stream')
const fs = require('fs')
const temp = require('temp')
const ffmpeg = require('fluent-ffmpeg')

module.exports = function(RED) {
function alexaAudio(config) {
    RED.nodes.createNode(this,config);
    var node = this;
    temp.track()
    ffmpeg.setFfmpegPath(config.ffmpegPath)
    node.mode = config.mode
    this.on('input', function(msg, send, done) {
        const inputStream = Stream.Readable.from(msg.payload);
        switch (node.mode) {
            case 'wav':
                const suffix='.wav'
                const freq=16000
                const codec='pcm_s16le'
                break
            case 'mp3':
                const suffix='.mp3'
                const freq=22050
                const codec='libmp3lame'
                break
        }
        temp.open({ suffix: suffix }, function (error, info) {
            const tempfile = info.path
            ffmpeg()
                .input(inputStream)
                .audioCodec(codec)
                .audioChannels(1)
                .audioFrequency(freq)
                .on('error', function(e){console.log(e)})
                .output(tempfile)
                .on('end', function () {
                    fs.readFile(tempfile, 'binary', (err, data) => {
                        msg.payload = Buffer.from(data.toString(), 'binary')
                        node.send(msg)
                        temp.cleanupSync();
                    })
                })
                .run()
        })
        if (done) {
            done();
        }
    })
}
RED.nodes.registerType("alexa-audio",alexaAudio);


}
