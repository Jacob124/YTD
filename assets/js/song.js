const ffmetadata = require("ffmetadata")

const fs         = require("fs")
const path       = require('path')

class Song {
    constructor(id, title) {
        this.id = id
        this.title = title
        this.meta = {}
        this.location = null
        this.status = "downloading"
    }


    setMeta(meta) {
        this.meta = meta;
    }


    setLocation(loc) {
        this.location = loc;
        this.status = "complete"
    }


    writeMeta() {
        return new Promise(resolve => {

            if(this.meta) {
                if (this.location) {
                    ffmetadata.write(this.location, this.meta, function (err) {
                        if (err) console.error("Error writing metadata", err);
                        resolve();
                    });
                }
            } else {
                resolve()
            }

        })
    }


    move(newFolder) {
        return new Promise(resolve => {

            const name = (this.meta.title ? (this.meta.title + " - " + this.meta.artist) : this.title)
            let newLocation = path.join(newFolder, this.cleanPath(name) + '.mp3')

            fs.rename(this.location, newLocation, (err) => {
                if(err) throw err

                this.location = newLocation
                resolve()
            })

        })
    }


    cleanPath(path) {
    const replacements = [[/\*/g, ""], [/"/g, ""], [/'/g, ""], [/\//g, ""], [/\?/g, ""], [/:/g, ""], [/;/g, ""]]
        replacements.forEach(r => {
            path = path.replace(r[0], r[1])
        })
        return path
    }
}

module.exports = Song;