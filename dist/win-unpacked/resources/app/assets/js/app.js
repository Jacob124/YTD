//************************************************************** */
// Require Node Modules
//************************************************************** */
const {remote} = require('electron')
const { Menu, MenuItem } = remote
const fs = require('fs')

console.log("running")

//************************************************************** */
// Require Custom Modules
//************************************************************** */
const SongManager  = require("./assets/js/song-manager")
const autocomplete = require('./assets/js/autocomplete')

const songManager = new SongManager();


//************************************************************** */
// Define HTML Constants
//************************************************************** */
const input = document.querySelector('.url')
const submit = document.querySelector('#url__submit')
const form = document.querySelector('#url__form')

const metaForm = document.querySelector('#meta')

const slider = document.querySelector('.slide__container')
const slides = document.querySelectorAll('.slide')

const table  = document.querySelector('#song-table')

const path   = document.querySelector('#dl-location')


const min = document.getElementById('min');
const close = document.getElementById('close');


//************************************************************** */
// Add Event Listeners
//************************************************************** */
songManager.on('error', () => slide(0))

min.addEventListener('click', () => remote.getCurrentWindow().minimize())
close.addEventListener('click', () => remote.getCurrentWindow().close())

form.addEventListener('submit', submitDownload)
metaForm.addEventListener('submit', submitMeta)
table.addEventListener('contextmenu', songContextMenu)

window.addEventListener('load', initSlider);
window.addEventListener('resize', initSlider)

path.addEventListener('click', () => songManager.changeDownloadLocation())


//************************************************************** */
// Define Helper Functions
//************************************************************** */
function submitDownload(e) {
    e.preventDefault()
    const url = input.value.trim()
    if (url) {
        if(songManager.startDownload(url)) {

            input.setAttribute("disabled", "disabled")
            submit.setAttribute("disabled", "disabled")
            submit.value = "Fetching Video..."

            songManager.on('start', (info) => {

                input.value = ""
                input.removeAttribute("disabled")
                submit.removeAttribute("disabled")
                submit.value = "Download MP3"

                prepareForm(info);
                slide(1);
            })
        } else {
            errorAnimation();
        }
    }
}

function submitMeta(e) {
    e.preventDefault();
    let inputs = this.querySelectorAll('input')
    let data = {};
    let id = this.querySelector('input[name="id"]').value
    inputs.forEach(input => {
        if(input.name !== "id") {
            data[input.name] = input.value
        }
    })
    songManager.setMeta(id, data)
    slide(0);
}

function prepareForm(info) {
    metaForm.querySelectorAll('input[type="text"], input[type="number"]').forEach(e => {
        e.value = ""
    })

    metaForm.querySelector('input[name="id"]').value = info.videoId
    metaForm.querySelector('input[name="title"]').value = info.title
    metaForm.querySelector('input[name="artist"]').value = info.author

    const textInputs = metaForm.querySelectorAll('input[type="text"]')
    autocomplete(textInputs, info.keywords)

}

function initSlider() {
    const w = window.innerWidth;

    slider.style.width = (w * slides.length) + "px"

    slides.forEach(slide => {
        slide.style.width = w + "px"
    })
}

function slide(s) {
    slider.style.transform = 'translateX(' + -s * window.innerWidth + 'px)'
}

function songContextMenu(e) {
    e.preventDefault();
    if (e.target && e.target.nodeName == "TD") {
        const id = e.target.parentElement.id.slice(2)

        if(songManager.downloadIsComplete(id)){

            ctxMenu = [
                {
                    label: "Open File Location",
                    click: () => {
                        songManager.openFileLocation(id)
                    }
                },
                {
                    label: "Play File",
                    click: () => {
                        songManager.openItem(id)
                    }
                }
            ]
        } else {
            ctxMenu = [
                {
                    label: "Downloading, please wait..."
                }
            ]
        }
        contextMenu(ctxMenu)
    }
}

function contextMenu(opts) {
    const menu = new Menu()
    for (let i = 0; i < opts.length; i++) {
        menu.append(new MenuItem(opts[i]))
    }
    menu.popup({ window: remote.getCurrentWindow() })
}

function errorAnimation() {
    form.classList.add('error')
    setTimeout(() => {
        form.classList.remove('error')
    }, 3000)
}

document.addEventListener("keydown", function (e) {
    if (e.which === 123) {
        require('remote').getCurrentWindow().toggleDevTools();
    } else if (e.which === 116) {
        location.reload();
    }
});