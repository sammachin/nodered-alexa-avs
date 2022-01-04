const Stream = require('stream')
const fs = require('fs')
const temp = require('temp')
const ffmpeg = require('fluent-ffmpeg')
const staticpath = require('ffmpeg-static');

const proc = (mode, data, ffmpegpath) =>  {
    console.log(mode)
    console.log(data.length)
    console.log(ffmpegpath)
    return new Promise((resolve) => {
    temp.track()
    if (ffmpegpath == 'auto'){
        ffmpeg.setFfmpegPath(staticpath)
    } else {
        ffmpeg.setFfmpegPath(ffmpegpath)
    }
        const inputStream = Stream.Readable.from(data);
        let sfx, freq, wav
        switch (mode) {
            case 'wav':
                sfx='.wav'
                freq=16000
                codec='pcm_s16le'
                break
            case 'mp3':
                sfx='.mp3'
                freq=22050
                codec='libmp3lame'
                break
        }
        temp.open({ suffix: sfx }, function (error, info) {
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
                        payload = Buffer.from(data.toString(), 'binary')
                        temp.cleanupSync();
                        resolve(payload)
                    })
                })
                .run()
        })
    })
}

exports.proc = proc;


