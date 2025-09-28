const songs = [
    {
        src: "assets/music/夜的尽头.mp3",
        cover: "assets/music/夜的尽头.jpg",
        title: "夜的尽头",
        artist: "邓紫棋"
    },
    {
        src: "assets/music/这就是爱.mp3",
        cover: "assets/music/这就是爱.jpg",
        title: "这就是爱",
        artist: "张杰"
    }
];
let currentSongIndex = 0;

const audio = document.getElementById('audio');
const playPauseBtn = document.getElementById('playPauseBtn');
const nextBtn = document.getElementById('nextBtn');
const progressBar = document.getElementById('progress-bar');
const progressHandle = document.getElementById('progress-handle');
const progressBg = document.getElementById('progress-bg');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const lyricsEl = document.getElementById('lyrics');
const albumImg = document.getElementById('album-img');
const songTitleEl = document.getElementById('song-title');
const songArtistEl = document.getElementById('song-artist');
let lyricsData = [];
let lyricsLoaded = false;
let activeLineIndex = -1;
let isPlaying = false;

function formatTime(sec) {
    if (isNaN(sec)) return "00:00";
    let m = Math.floor(sec / 60);
    let s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function togglePlay() {
    if (audio.paused) {
        audio.play();
        isPlaying = true;
        albumImg.classList.add('playing');
    } else {
        audio.pause();
        isPlaying = false;
        albumImg.classList.remove('playing');
    }
}

function loadSong(index, autoPlay = false) {
    currentSongIndex = index;
    const song = songs[currentSongIndex];
    audio.src = song.src;
    setAlbumCover(song.cover);
    songTitleEl.textContent = song.title;
    songArtistEl.textContent = song.artist;
    lyricsData = [];
    lyricsLoaded = false;
    lyricsEl.innerHTML = '';
    activeLineIndex = -1;
    lyricsEl.style.transform = 'translateY(0)';
    audio.load();
    if (autoPlay) {
        audio.play();
        isPlaying = true;
        albumImg.classList.add('playing');
    } else {
        isPlaying = false;
        albumImg.classList.remove('playing');
    }
}
nextBtn.addEventListener('click', function () {
    let nextIndex = (currentSongIndex + 1) % songs.length;
    loadSong(nextIndex, isPlaying);
});
audio.addEventListener('ended', function () {
    let nextIndex = (currentSongIndex + 1) % songs.length;
    loadSong(nextIndex, true);
});

loadSong(0, false);

audio.addEventListener('play', () => {
    playPauseBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fill="#ffffff" fill-rule="evenodd" d="M6.75 3a2 2 0 0 0-2 2v10a2 2 0 1 0 4 0V5a2 2 0 0 0-2-2Zm6.5 0a2 2 0 0 0-2 2v10a2 2 0 1 0 4 0V5a2 2 0 0 0-2-2Z" clip-rule="evenodd"/></svg>';
    isPlaying = true;
    albumImg.classList.add('playing');
});
audio.addEventListener('pause', () => {
    playPauseBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#ffffff" d="M21.409 9.353a2.998 2.998 0 0 1 0 5.294L8.597 21.614C6.534 22.737 4 21.277 4 18.968V5.033c0-2.31 2.534-3.769 4.597-2.648z"/></svg>';
    isPlaying = false;
    albumImg.classList.remove('playing');
});
audio.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(audio.duration);
});
audio.addEventListener('timeupdate', () => {
    const progress = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width = progress + '%';
    progressHandle.style.left = progress + '%';
    currentTimeEl.textContent = formatTime(audio.currentTime);
    updateLyrics(audio.currentTime);
});
function seek(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
}
function parseLRC(lrc) {
    const lines = lrc.split('\n');
    const result = [];
    const timeExp = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;
    for (let line of lines) {
        let matches;
        let text = line.replace(timeExp, '').trim();
        while ((matches = timeExp.exec(line)) !== null) {
            let min = parseInt(matches[1]);
            let sec = parseInt(matches[2]);
            let ms = matches[3] ? parseInt(matches[3].padEnd(3, '0')) : 0;
            let time = min * 60 + sec + ms / 1000;
            result.push({ time, text });
        }
    }
    result.sort((a, b) => a.time - b.time);
    return result;
}
function updateLyrics(currentTime) {
    if (!lyricsLoaded || !lyricsData.length) return;
    let newActiveIndex = 0;
    for (let i = 0; i < lyricsData.length; i++) {
        if (currentTime >= lyricsData[i].time) newActiveIndex = i;
        else break;
    }
    if (newActiveIndex !== activeLineIndex) {
        activeLineIndex = newActiveIndex;
        renderLyrics();
    }
    scrollToActiveLine();
}
function renderLyrics() {
    let html = '';
    for (let i = 0; i < lyricsData.length; i++) {
        let cls = i === activeLineIndex ? 'lyrics-line lyrics-active' : 'lyrics-line';
        html += `<div class="${cls}">${lyricsData[i].text || '&nbsp;'}</div>`;
    }
    lyricsEl.innerHTML = html;
}
function scrollToActiveLine() {
    const activeLine = lyricsEl.querySelector('.lyrics-active');
    if (!activeLine) return;
    const container = lyricsEl.parentElement;
    const containerHeight = container.clientHeight;
    const lineTop = activeLine.offsetTop;
    const lineHeight = activeLine.offsetHeight;
    const targetScrollTop = lineTop - (containerHeight / 2) + (lineHeight / 2);
    lyricsEl.style.transform = `translateY(-${targetScrollTop}px)`;
}
function loadLyrics() {
    const lrcFile = audio.src.replace(/\.\w+$/, '.lrc');
    fetch(lrcFile)
        .then(res => res.ok ? res.text() : '')
        .then(lrc => {
            if (lrc.trim()) {
                lyricsData = parseLRC(lrc);
                lyricsLoaded = true;
                renderLyrics();
            } else {
                throw new Error('No lyrics');
            }
        })
        .catch(() => {
            lyricsData = [];
            lyricsLoaded = false;
            lyricsEl.innerHTML = '<span style="opacity:.7">暂无歌词</span>';
        });
}
function setAlbumCover(imageUrl) {
    albumImg.src = imageUrl;
}
audio.addEventListener('loadeddata', loadLyrics);
if (audio.readyState > 0) loadLyrics();
progressBg.addEventListener('mouseenter', () => {
    if (isPlaying) {
        progressHandle.style.opacity = '1';
    }
});
progressBg.addEventListener('mouseleave', () => {
    progressHandle.style.opacity = '0';
});
document.querySelector('.menu-toggle').addEventListener('click', function () {
    document.querySelector('.nav-links').classList.toggle('show');
});
//@RFKONG me.main.js