const presets = {
    video: { 'video': true },
    all: { 'video': true, 'audio': true },
    qvga: { 'video': { 'width': { 'exact': 320 }, 'height': { 'exact': 240 } } },
    vga: { 'video': { 'width': { 'exact': 640 }, 'height': { 'exact': 480 } } },
    hd: { 'video': { 'width': { 'exact': 1280 }, 'height': { 'exact': 720 } } }
};

export const video = {
    stream: null
};

video.displayStream = function (stream) {
    this.stream = stream;
    document.querySelector('video#localVideoFeed').srcObject = stream;
    document.querySelector('#device-name').innerHTML = stream.getVideoTracks()[0].label;
    document.querySelector('#video-overlay').classList.remove('hidden');
    stream.getVideoTracks()[0].addEventListener('ended', () => {
        console.log('Stream has ended.');
    });
};

video.setConstraint = function (name) {
    if (presets[name]) {
        this.stream.getVideoTracks()[0].applyConstraints(presets[name].video);
    }
};

video.openCamera = function () {
    navigator.mediaDevices.getUserMedia(presets.video)
        .then(this.displayStream.bind(this))
        .catch(error => {
            console.error('Error accessing media devices.', error);
        });
};

video.openScreen = function () {
    navigator.mediaDevices.getDisplayMedia(presets.video)
        .then(this.displayStream.bind(this))
        .catch(error => {
            console.error('Error accessing media devices.', error);
        });
};

video.close = function () {
    if (this.stream) { // stop using the camera
        this.stream.getTracks().forEach(track => {
            track.stop();
        });
        this.stream = null;
    }
    document.querySelector('video#localVideoFeed').srcObject = null;
    document.querySelector('#device-name').innerHTML = '';
    document.querySelector('#video-overlay').classList.add('hidden');
};
