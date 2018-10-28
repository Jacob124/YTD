const EventEmitter      = require('events');
const Song              = require('./song')
const Downloader        = require("./downloader");
const path              = require('path')
const fs                = require('fs')
const { shell, remote } = require('electron')
const { dialog }        = remote


/**
 *
 *
 * @class SongManager
 * @extends {EventEmitter}
 */
class SongManager extends EventEmitter {
    constructor() {
        super()
        this.songList = {};
        this.table = document.querySelector('#song-table');
        this.downloader = new Downloader();
        this.odd = false;
        this.downloadLocation = path.join(remote.getGlobal('defaultMusicPath'), 'YouTube to MP3')

        if (fs.existsSync('downloadLocation')) {
            this.downloadLocation = fs.readFileSync('downloadLocation', { encoding: 'utf8' })
        }

        // Create download folder if it doesn't exist
        if (!fs.existsSync(this.downloadLocation)) {
            
            fs.mkdir(this.downloadLocation, { recursive: true }, (err) => {
                if (err) throw err;
            });

        }

        this.displayDownloadLocation()
    }


    /**
     * @description parses seconds to mm:ss
     *
     * @param {int} sec
     * @returns string
     * @memberof SongManager
     */
    parseSeconds(sec) {
        return Math.floor(sec / 60) + ":" + ( "00" + Math.floor(sec % 60)).slice(-2);
    }


    /**
     * @description adds a new row to the song table with the song's info
     *
     * @param {object} info
     * @memberof SongManager
     */
    addRow(info) {
        let row = `
            <tr id="id${info.videoId}" class="${(this.odd ? "odd" : "even")}">
                <td>${info.title}</td>
                <td>${info.author}</td>
                <td>${this.parseSeconds(info.lengthSeconds)}</td>
                <td>0% <div class="status status--progress"></div></td>
            </tr>`;
        this.table.innerHTML = row + this.table.innerHTML
        this.odd = !this.odd;
    }


    /**
     * @description update row's download progress
     *
     * @param {string} id
     * @param {object} progress
     * @memberof SongManager
     */
    updateRow(id, progress) {
        const row = this.table.querySelector(`#id${id}`)
        let tds = row.querySelectorAll('td')

        tds[3].innerHTML = Math.floor(progress.percentage) + "% <div class=\"status status--progress\"></div>"
    }

    /**
     * @description update row's title and artist
     *
     * @param {string} id
     * @param {object} meta
     * @memberof SongManager
     */
    updateRowMeta(id, meta) {
        const row = this.table.querySelector(`#id${id}`)
        let tds = row.querySelectorAll('td')

        tds[0].innerHTML = meta.title
        tds[1].innerHTML = meta.artist
    }


    /**
     * @description Marks row as complete
     *
     * @param {string} id
     * @memberof SongManager
     */
    finishRow(id) {
        const row = this.table.querySelector(`#id${id}`);
        let tds = row.querySelectorAll('td');
        tds[3].innerHTML = "Complete! <div class='status status--complete'></div>"
    }

    /**
     * @description marks row as failed with error
     *
     * @param {string} id
     * @memberof SongManager
     */
    failRow(id) {
        const row = this.table.querySelector(`#id${id}`);
        let tds = row.querySelectorAll('td');

        row.classList.add('error');

        tds[3].innerHTML = "Error! <div class='status status--error'></div>"
    }

    /**
     * @description set song's meta information, apply it and move the file if it has finished downloading
     *
     * @param {string} id
     * @param {object} meta
     * @memberof SongManager
     */
    async setMeta(id, meta) {
        const song = this.songList[id]
        if(song.status !== "error") {
            song.setMeta(meta);
            this.updateRowMeta(id, meta)

            if(song.status === "complete") {
                this.finishSong(id)
            }
        }
    }


    /**
     * @description Apply meta information to file and move & rename it to the download location
     *
     * @param {string} id
     * @memberof SongManager
     */
    async finishSong(id) {
        const song = this.songList[id]
        if (song.status === "complete") {
            await song.writeMeta();
            await song.move(this.downloadLocation)
        }
    }


    /**
     * @description Trigger the download of the file and assign event listeners
     *
     * @param {string} url
     * @returns boolean
     * @memberof SongManager
     */
    startDownload(url) {
        return this.downloader.getMP3({
            url: url,
            name: "test",
            error: (err, data) => {
                this.failRow(data.videoId)
                this.emit('error', data)
                console.error(err)
            },
            progress: (progress) => {
                this.updateRow(progress.videoId, progress.progress)
            },
            info: (info) => {
                this.songList[info.videoId] = new Song(info.videoId, info.title)
                this.addRow(info);
                this.emit('start', info)
            },
            finished: (err, data) => {
                if (err) {
                    this.failRow(data.videoId)
                    throw err;
                }
                this.songList[data.videoId].setLocation(data.file)
                if (fs.existsSync(this.songList[data.videoId].location)) {
                    this.finishSong(data.videoId)
                }
                this.finishRow(data.videoId)
            }
        })
    }


    /**
     * @description Check the status of the song, return's true if it's complete
     *
     * @param {string} id
     * @returns
     * @memberof SongManager
     */
    downloadIsComplete(id) {
        return this.songList[id].status === "complete"
    }


    /**
     * @description Open the song's location in folder
     *
     * @param {string} id
     * @memberof SongManager
     */
    openFileLocation(id) {
        const songPath = this.songList[id].location
        shell.showItemInFolder(songPath);
    }


    /**
     * @description Opens the song with the default app
     *
     * @param {string} id
     * @memberof SongManager
     */
    openItem(id) {
        const songPath = this.songList[id].location
        shell.openItem(songPath);
    }


    /**
     * @description updates the on-screen text to the download location
     *
     * @memberof SongManager
     */
    displayDownloadLocation() {
        const path = document.querySelector('#dl-location')

        path.innerHTML = this.downloadLocation
    }


    /**
     * @description Lets you choose new location for song downloads
     *
     * @memberof SongManager
     */
    changeDownloadLocation() {
        dialog.showOpenDialog({
            title: 'Select Location of Downloaded Music',
            defaultPath: this.downloadLocation,
            properties: ['openDirectory']
        }, newLocation => {
            if(newLocation){

                this.downloadLocation = newLocation[0]
                this.displayDownloadLocation()

                fs.writeFile('downloadLocation', this.downloadLocation, err => {
                    if(err) throw err
                })
            }
        })
    }
}


module.exports = SongManager