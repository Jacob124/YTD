const min = document.getElementById('min');
const close = document.getElementById('close');

min.addEventListener('click', () => {
    const win = remote.getCurrentWindow();
    win.minimize();
})

close.addEventListener('click', () => {
    const win = remote.getCurrentWindow();
    win.close();
})