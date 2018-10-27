var YoutubeMp3Downloader = require("./YoutubeMp3Downloader");
 
var Downloader = function() {
 
    var self = this;
    
    //Configure YoutubeMp3Downloader with your settings
    self.YD = new YoutubeMp3Downloader({
        "ffmpegPath": "./bin/ffmpeg.exe",        // Where is the FFmpeg binary located?
        "outputPath": "./downloads",            // Where should the downloaded and encoded files be stored?
        "youtubeVideoQuality": "lowest",       // What video quality should be used?
        "queueParallelism": 2,                  // How many parallel downloads/encodes should be started?
        "progressTimeout": 200                 // How long should be the interval of the progress reports
    });
 
    self.downloads = {};
 
    self.YD.on("finished", function(error, data) {
        
        if (self.downloads[data.videoId].finished) {
            self.downloads[data.videoId].finished(error, data);
        } else {
            console.log("Error: No callback for videoId!");
        }
    
    });
 
    self.YD.on("error", function(error, data) {
    
        if (self.downloads[data.videoId].error) {
            self.downloads[data.videoId].error(error, data);
        } else {
            console.log("Error: No callback for videoId!");
        }
     
    });

    self.YD.on('info', function(info) {
        if (self.downloads[info.videoId].info) {
            self.downloads[info.videoId].info(info);
        }
    })

    self.YD.on("progress", function(data) {
    
        if (self.downloads[data.videoId].progress) {
            self.downloads[data.videoId].progress(data);
        }
    }); 
};

Downloader.prototype.extractId = function(url) {
    const m = url.match(/[A-Za-z0-9-_]{11}/)
    return m ? m[0] : false;
}
 
Downloader.prototype.getMP3 = function(s){
 
    var self = this;
    let settings = Object.assign({
        name: "",
        url: "",
        error: () => {},
        progress: () => {},
        finished: () => {},
    }, s);

    settings.videoId = this.extractId(settings.url);

    if(!settings.videoId) {
        console.error('Invalid URL!');
        return false;
    }
    
    // Register callbacks
    self.downloads[settings.videoId] = settings;
    // Trigger download
    self.YD.download(settings.videoId);

    return true;
 
};
 
module.exports = Downloader;