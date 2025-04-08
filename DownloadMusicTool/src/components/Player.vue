<template>
    <div id="Player" :class="{ 'expanded': showLyrics }">
        <!-- 播放器 -->
        <div id="audio-player">
            <div id="musicInfo">
                <div id="musicName">{{ store.currentSongName || '歌曲名称' }}</div>
                <div id="singerName">{{ store.currentSongArtists || '歌手名称' }}</div>
            </div>
            <audio controls controlsList="nodownload nofullscreen noremoteplayback noplaybackrate" src=""
                class="audio-player"></audio>
            <div id="musicFunction">
                <div id="lyricsBtn" class="function-btn" @click="toggleLyrics">
                    <svg class="icon" viewBox="0 0 1024 1024" width="16" height="16">
                        <path
                            d="M866.462 571.077H157.538a39.385 39.385 0 0 1 0-78.77h708.924a39.385 39.385 0 0 1 0 78.77zM748.308 196.923H275.692a39.385 39.385 0 0 1 0-78.77h472.616a39.385 39.385 0 0 1 0 78.77zM275.692 846.77h472.616a39.385 39.385 0 0 1 0 78.77H275.692a39.385 39.385 0 0 1 0-78.77z"
                            fill="currentColor" />
                    </svg>
                </div>
                <div id="downloadBtn" class="function-btn" @click="downloadSong">
                    <svg class="icon" viewBox="0 0 1024 1024" width="16" height="16">
                        <path
                            d="M853.333 853.333a42.667 42.667 0 0 1 0 85.334H170.667a42.667 42.667 0 0 1 0-85.334h682.666zM512 85.504a42.667 42.667 0 0 1 42.667 42.667v515.37l204.373-204.373a42.667 42.667 0 0 1 63.915 56.278l-3.584 4.01-277.376 277.547a42.667 42.667 0 0 1-56.32 3.584l-4.01-3.541-277.12-276.65a42.667 42.667 0 0 1 56.234-63.958l4.01 3.541L469.333 644.096V128.17a42.667 42.667 0 0 1 42.667-42.667z"
                            fill="currentColor" />
                    </svg>
                </div>
            </div>
        </div>

        <!-- 歌词区域 -->
        <div id="lyrics" :class="{ 'show': showLyrics }">
            <div class="lyrics-container" ref="lyricsContainer">
                <div v-if="store.currentSongLyric && store.currentSongLyric.length > 0">
                    <div v-for="(line, index) in store.currentSongLyric" :key="index" 
                        class="lyric-line"
                        @click="seekToTime(line.time)">
                        <div class="lyric-text" :class="{ 'active': currentLyricIndex === index }">
                            {{ line.text }}
                            <div class="time-tooltip">{{ formatTime(line.time) }}</div>
                        </div>
                    </div>
                </div>
                <div v-else class="no-lyrics">
                    <p>暂无歌词</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, reactive } from 'vue';
import { useStore } from '../../stores';

const store = useStore();
let audioElement = ref<HTMLAudioElement | null>(null);
const showLyrics = ref(false);
const currentLyricIndex = ref(-1);
const lyricsContainer = ref<HTMLElement | null>(null);
const userScrolling = ref(false);
const scrollTimer = ref<number | null>(null);

onMounted(() => {
    audioElement.value = document.querySelector('audio');
    lyricsContainer.value = document.querySelector('.lyrics-container');

    if (store.currentSongUrl && audioElement.value) {
        audioElement.value.src = store.currentSongUrl;
    }

    if (audioElement.value) {
        audioElement.value.addEventListener('timeupdate', updateLyrics);
    }

    // 添加滚动事件监听
    const lyricsElement = document.querySelector('#lyrics');
    if (lyricsElement) {
        lyricsElement.addEventListener('scroll', handleUserScroll);
    }
});

watch(() => store.currentSongUrl, (newUrl) => {
    if (newUrl && audioElement.value) {
        audioElement.value.src = newUrl;
        audioElement.value.play().catch(err => console.error('播放失败:', err));
        currentLyricIndex.value = -1;
    }
});

// 监听当前歌词索引变化，滚动到对应位置
watch(() => currentLyricIndex.value, (newIndex) => {
    if (newIndex >= 0 && !userScrolling.value) {
        scrollToActiveLyric();
    }
});

const toggleLyrics = () => {
    showLyrics.value = !showLyrics.value;
    // 如果打开歌词，确保滚动到当前播放的歌词
    if (showLyrics.value && currentLyricIndex.value >= 0) {
        // 延迟一下以确保动画完成后再滚动
        setTimeout(() => {
            scrollToActiveLyric();
        }, 500);
    }
};

const downloadSong = async () => {
    try {
        console.log('开始下载...');
        
        const response = await fetch(store.currentSongUrl);
        if (!response.ok) {
            throw new Error('下载音频失败');
        }
        
        const blob = await response.blob();
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${store.currentSongName}-${store.currentSongArtists}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('下载完成');
    } catch (error) {
        console.error('下载出错:', error);
    }
}

// 处理用户滚动
const handleUserScroll = () => {
    userScrolling.value = true;
    
    // 清除之前的定时器
    if (scrollTimer.value !== null) {
        clearTimeout(scrollTimer.value);
    }
    
    // 设置新的定时器，用户停止滚动2秒后恢复自动滚动
    scrollTimer.value = window.setTimeout(() => {
        userScrolling.value = false;
        // 恢复滚动到当前播放的歌词
        if (currentLyricIndex.value >= 0) {
            scrollToActiveLyric();
        }
    }, 2000);
};

// 滚动到当前活跃的歌词
const scrollToActiveLyric = () => {
    if (!lyricsContainer.value || currentLyricIndex.value < 0) return;
    
    const lyricsElement = document.querySelector('#lyrics');
    if (!lyricsElement) return;
    
    // 获取所有歌词行
    const lyricLines = document.querySelectorAll('.lyric-line');
    if (currentLyricIndex.value >= lyricLines.length) return;
    
    // 获取当前活跃的歌词行
    const activeLyricLine = lyricLines[currentLyricIndex.value] as HTMLElement;
    if (!activeLyricLine) return;
    
    const lyricsRect = lyricsElement.getBoundingClientRect();
    
    // 计算滚动位置，使活跃歌词居中
    const scrollTop = activeLyricLine.offsetTop - (lyricsRect.height / 2) + (activeLyricLine.offsetHeight / 2);
    
    // 使用平滑滚动
    lyricsElement.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
    });
};

const updateLyrics = () => {
    if (!audioElement.value || !store.currentSongLyric || store.currentSongLyric.length === 0) return;

    const currentTime = audioElement.value.currentTime * 1000; // 转为毫秒
    let foundIndex = -1;

    for (let i = 0; i < store.currentSongLyric.length; i++) {
        if (i === store.currentSongLyric.length - 1 || currentTime < store.currentSongLyric[i + 1].time) {
            if (currentTime >= store.currentSongLyric[i].time) {
                foundIndex = i;
                break;
            }
        }
    }

    // 只有当索引变化时才更新，以避免不必要的重渲染和滚动
    if (foundIndex !== currentLyricIndex.value) {
        currentLyricIndex.value = foundIndex;
    }
};

// 格式化时间为 mm:ss 格式
const formatTime = (timeMs: number): string => {
    const totalSeconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// 点击歌词跳转到对应时间
const seekToTime = (timeMs: number) => {
    if (audioElement.value) {
        audioElement.value.currentTime = timeMs / 1000;
        // 如果当前是暂停状态，点击歌词后自动播放
        if (audioElement.value.paused) {
            audioElement.value.play().catch(err => console.error('播放失败:', err));
        }
    }
};

onUnmounted(() => {
    if (audioElement.value) {
        audioElement.value.removeEventListener('timeupdate', updateLyrics);
    }
    
    const lyricsElement = document.querySelector('#lyrics');
    if (lyricsElement) {
        lyricsElement.removeEventListener('scroll', handleUserScroll);
    }
    
    // 清除滚动定时器
    if (scrollTimer.value !== null) {
        clearTimeout(scrollTimer.value);
    }
});
</script>

<style scoped lang="less">
#Player {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    width: 90%;
    height: 90px;
    z-index: 10;
    align-items: center;
    background-color: rgba(250, 250, 252, 0.8);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border-radius: 18px;
    padding: 0 20px;
    box-shadow:
        0 2px 8px rgba(0, 0, 0, 0.04),
        0 0 1px rgba(0, 0, 0, 0.1);
    transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
    overflow: hidden;
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);

    &.expanded {
        height: 60vh;
        max-height: calc(100vh - 200px);
        bottom: 20px;
    }

    &:hover {
        background-color: rgba(255, 255, 255, 0.9);
        box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.06),
            0 1px 3px rgba(0, 0, 0, 0.1);
    }

    #audio-player {
        display: flex;
        width: 100%;
        min-height: 90px;
        align-items: center;
        justify-content: space-between;
    }

    #musicInfo {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        margin-right: 15px;
        overflow: hidden;

        #musicName {
            font-size: 16px;
            font-weight: 600;
            color: #333;
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        #singerName {
            font-size: 14px;
            color: #666;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }

    .audio-player {
        &::-webkit-media-controls-panel {
            background-color: rgba(250, 250, 252, 0.7);
        }

        &::-webkit-media-controls-play-button {
            border-radius: 50%;
            background-color: rgba(0, 0, 0, 0.05);
        }

        &::-webkit-media-controls-current-time-display,
        &::-webkit-media-controls-time-remaining-display {
            color: #555;
            font-weight: 500;
        }

    }

    #musicFunction {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-left: 15px;

        .function-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: 10px;
            background-color: rgba(230, 230, 235, 0.8);
            color: #555;
            cursor: pointer;
            transition: all 0.2s ease;

            &:hover {
                background-color: rgba(220, 220, 225, 0.9);
                color: #333;
                transform: scale(1.05);
            }

            &:active {
                transform: scale(0.95);
            }

            .icon {
                width: 18px;
                height: 18px;
            }
        }
    }

    #lyrics {
        width: 100%;
        height: calc(100% - 90px);
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.4s ease;
        overflow-y: auto;
        scrollbar-width: none;
        padding: 20px 0;
        position: relative;

        &.show {
            opacity: 1;
            transform: translateY(0);
        }

        .lyrics-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0 15px;
            min-height: 100%;
        }

        // 添加前后的空白区域，确保歌词可以滚动到顶部和底部时仍能居中
        .lyrics-container > div {
            padding-top: 30vh;
            padding-bottom: 30vh;
            width: 100%;
        }

        .lyric-line {
            position: relative;
            text-align: center;
            margin: 10px 0;
            cursor: pointer;
        }

        .lyric-text {
            font-size: 16px;
            color: #666;
            transition: all 0.3s ease;
            padding: 4px 8px;
            border-radius: 4px;
            display: inline-block;
            position: relative;

            &:hover {
                background-color: rgba(0, 0, 0, 0.05);
                color: #333;
                
                .time-tooltip {
                    visibility: visible;
                    opacity: 1;
                }
            }

            &.active {
                font-size: 18px;
                color: #333;
                font-weight: 600;
            }
            
            .time-tooltip {
                position: absolute;
                top: -30px;
                left: 50%;
                transform: translateX(-50%);
                background-color: rgba(0, 0, 0, 0.7);
                color: #fff;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                pointer-events: none;
                visibility: hidden;
                opacity: 0;
                transition: opacity 0.2s ease, visibility 0.2s ease;
                white-space: nowrap;
                font-weight: normal;
            }
        }

        .no-lyrics {
            display: flex;
            height: 100%;
            align-items: center;
            justify-content: center;

            p {
                font-size: 16px;
                color: #999;
                font-style: italic;
            }
        }

        &::-webkit-scrollbar {
            width: 6px;
        }

        &::-webkit-scrollbar-track {
            background: transparent;
        }

        &::-webkit-scrollbar-thumb {
            background-color: rgba(0, 0, 0, 0.1);
            border-radius: 10px;
        }
    }
}

@media (prefers-color-scheme: dark) {
    #Player {
        background-color: rgba(45, 45, 50, 0.8);
        box-shadow:
            0 2px 10px rgba(0, 0, 0, 0.1),
            0 0 1px rgba(0, 0, 0, 0.2);

        &:hover {
            background-color: rgba(50, 50, 55, 0.9);
        }

        #musicInfo {
            #musicName {
                color: #e2e2e4;
            }

            #singerName {
                color: #aaa;
            }
        }

        .audio-player {
            &::-webkit-media-controls-panel {
                background-color: rgba(45, 45, 50, 0.7);
            }

            &::-webkit-media-controls-current-time-display,
            &::-webkit-media-controls-time-remaining-display {
                color: #ccc;
            }
        }

        #musicFunction {
            .function-btn {
                background-color: rgba(60, 60, 65, 0.8);
                color: #ccc;

                &:hover {
                    background-color: rgba(70, 70, 75, 0.9);
                    color: #fff;
                }
            }
        }

        #lyrics {
            .lyric-text {
                color: #aaa;

                &:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                    color: #e2e2e4;
                }

                &.active {
                    color: #e2e2e4;
                }
                
                .time-tooltip {
                    background-color: rgba(50, 50, 55, 0.9);
                    color: #e2e2e4;
                }
            }

            .no-lyrics p {
                color: #777;
            }

            &::-webkit-scrollbar-thumb {
                background-color: rgba(255, 255, 255, 0.1);
            }
        }
    }
}

@media (max-width: 600px) {
    #Player {
        padding: 0 12px;

        &:not(.expanded) {
            height: 8vh;
        }

        #musicInfo {
            #musicName {
                font-size: 14px;
            }

            #singerName {
                font-size: 12px;
            }
        }

        .audio-player {
            height: 32px;
        }

        #musicFunction {
            gap: 8px;

            .function-btn {
                width: 32px;
                height: 32px;

                .icon {
                    width: 16px;
                    height: 16px;
                }
            }
        }
    }
}
</style>