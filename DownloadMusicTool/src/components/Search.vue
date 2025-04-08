<template>
    <!-- 搜索 -->
    <div id="Search">
        <div class="search-input-container">
            <input type="text" v-model="searchQuery" placeholder="搜索音乐、歌手或专辑..." @keyup.enter="searchMusic"
                @input="getSuggestions" @focus="showSuggestionsPanel = true" @blur="hideSuggestionsDelayed" />
            <button @click="searchMusic">
                <svg width="20" height="20" viewBox="0 0 24 24">
                    <path
                        d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
                        fill="currentColor" />
                </svg>
            </button>
        </div>

        <!-- 搜索建议面板 -->
        <div class="search-suggestions-panel"
            v-if="showSuggestionsPanel && searchSuggestions.length > 0 && searchQuery.length > 0">
            <div v-for="(suggestion, index) in searchSuggestions" :key="index" class="suggestion-item"
                @mousedown="selectSuggestion(suggestion)" :class="{ 'active': selectedSuggestionIndex === index }">
                <div class="suggestion-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24">
                        <path
                            d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
                            fill="currentColor" />
                    </svg>
                </div>
                <div class="suggestion-text">
                    <span v-html="highlightQuery(suggestion.name)"></span>
                    <small>{{ formatArtists(suggestion.artists) }}</small>
                </div>
            </div>
            <div class="suggestion-footer">
                <span>按回车键搜索</span>
            </div>
        </div>

        <!-- 搜索结果 -->
        <div class="search-results" v-if="searchResults.length">
            <ul>
                <li v-for="(result, index) in searchResults" :key="index" class="result-item">
                    <div class="result-info">
                        <h3>{{ result.name }}</h3>
                        <p>{{ formatArtists(result.artists) }}</p>
                        <span class="duration">{{ formatDuration(result.duration) }}</span>
                    </div>
                    <div class="result-actions">
                        <button class="action-button play" @click="playMusic(result)">
                            <svg width="18" height="18" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" fill="currentColor" />
                            </svg>
                        </button>
                        <button class="action-button download" @click="downloadMusic(result)">
                            <svg width="18" height="18" viewBox="0 0 24 24">
                                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor" />
                            </svg>
                        </button>
                    </div>
                </li>
            </ul>
        </div>
        <div class="no-results" v-else-if="hasSearched">
            <p>未找到相关结果，请尝试其他关键词</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useStore } from '../../stores';
import { debounce } from 'lodash';

// 定义搜索结果的类型
interface SearchResult {
    name: string;
    id: string;
    url: string;
    artists: Array<any>;
    duration: number;
    lyric?: Array<{ time: number; text: string }>;
}

interface SearchSuggestion {
    name: string;
    id?: string;
    artists?: Array<any>;
}

const store = useStore();
const searchQuery = ref('');
const searchResults = ref<SearchResult[]>([]);
const hasSearched = ref(false);
const audioPlayer = ref<HTMLAudioElement | null>(null);

const searchSuggestions = ref<SearchSuggestion[]>([]);
const showSuggestionsPanel = ref(false);
const selectedSuggestionIndex = ref(-1);
let hideTimer: number | null = null;

const getSuggestions = debounce(async () => {
    if (!searchQuery.value || !store.currentSoundSource) {
        searchSuggestions.value = [];
        console.log('不满足搜索条件:', {
            query: searchQuery.value,
            length: searchQuery.value.length,
            source: store.currentSoundSource
        });
        return;
    }

    console.log('开始获取搜索建议:', {
        query: searchQuery.value,
        source: store.currentSoundSource
    });

    try {
        if (store.currentSoundSource === 'netease') {
            const suggestions = await store.searchNetEaseSuggest(searchQuery.value);
            console.log('获取到搜索建议原始数据:', suggestions);

            if (suggestions && suggestions.length > 0) {
                searchSuggestions.value = suggestions.slice(0, 8).map((item: any) => ({
                    name: item.name,
                    id: item.id,
                    artists: item.artists
                }));
                console.log('处理后的搜索建议:', searchSuggestions.value);
                showSuggestionsPanel.value = true;
            } else {
                console.log('没有搜索建议结果');
                searchSuggestions.value = [];
            }
        } else if (store.currentSoundSource === 'migu') {
            alert("API错误");
            console.log('咪咕搜索建议', searchQuery.value);
        } else if (store.currentSoundSource === 'kugou') {
            const suggestions = await store.searchKuGouSuggest(searchQuery.value);
            console.log('获取到搜索建议原始数据:', suggestions);
            if (suggestions && suggestions.length > 0) {
                searchSuggestions.value = suggestions.slice(0, 8).map((item: any) => ({
                    name: item.HintInfo,
                }));
                console.log('处理后的搜索建议:', searchSuggestions.value);
                showSuggestionsPanel.value = true;
            } else {
                console.log('没有搜索建议结果');
                searchSuggestions.value = [];
            }

        }
    } catch (error) {
        console.error('获取搜索建议失败:', error);
        searchSuggestions.value = [];

    }
}, 300);

// 高亮查询词
const highlightQuery = (text: string): string => {
    if (!searchQuery.value) return text;

    const regex = new RegExp(`(${searchQuery.value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
};

// 延迟隐藏建议面板（防止点击建议项时面板消失）
const hideSuggestionsDelayed = () => {
    hideTimer = window.setTimeout(() => {
        showSuggestionsPanel.value = false;
    }, 200);
};

// 选择建议项
const selectSuggestion = (suggestion: SearchSuggestion) => {
    searchQuery.value = suggestion.name;
    showSuggestionsPanel.value = false;
    searchMusic();
};

// 处理键盘导航
const handleKeyboardNavigation = (e: KeyboardEvent) => {
    if (!showSuggestionsPanel.value || searchSuggestions.value.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedSuggestionIndex.value = (selectedSuggestionIndex.value + 1) % searchSuggestions.value.length;
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedSuggestionIndex.value = selectedSuggestionIndex.value <= 0 ?
            searchSuggestions.value.length - 1 : selectedSuggestionIndex.value - 1;
    } else if (e.key === 'Enter' && selectedSuggestionIndex.value >= 0) {
        e.preventDefault();
        selectSuggestion(searchSuggestions.value[selectedSuggestionIndex.value]);
    }
};

onMounted(() => {
    audioPlayer.value = document.querySelector('audio');

    // 添加键盘事件监听
    window.addEventListener('keydown', handleKeyboardNavigation);
});

// 监听搜索词变化，重置选中索引
watch(searchQuery, () => {
    selectedSuggestionIndex.value = -1;
});

// 格式化歌手名称
const formatArtists = (artists?: Array<any>) => {
    if (artists) {
        if ((!artists || artists.length === 0) && store.currentSoundSource === "netease") return '未知歌手';
        if ((!artists || artists.length === 0) && store.currentSoundSource === "kugou") return ' ';

        return artists.map(artist => artist.name).join(' ');
    } else {
        return "";
    }
};

// 格式化时长
const formatDuration = (ms: number) => {
    if (!ms) return '00:00';

    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// 搜索音乐
const searchMusic = async () => {
    if (!searchQuery.value || !store.currentSoundSource) {
        if (!store.currentSoundSource) {
            alert('请先选择音乐源');
        }
        return;
    }

    hasSearched.value = true;
    searchResults.value = [];

    try {
        if (store.currentSoundSource === 'netease') {
            const songs = await store.searchNetEaseSong(searchQuery.value);
            // 拼接id
            const songIds = songs.map((song: any) => song.id).join(',');
            // 获取歌曲URL
            // console.log(songIds);
            const urlData = await store.getNetEaseSongUrl(songIds);
            // console.log(urlData);

            if (songs && songs.length > 0) {
                searchResults.value = songs.map((song: any) => ({
                    name: song.name,
                    id: song.id,
                    url: urlData.find((url: any) => url.id === song.id)?.url || '',
                    artists: song.ar,
                    duration: song.dt,
                }));
            } else {
                hasSearched.value = false;
            }
        } else if (store.currentSoundSource === 'migu') {
            // 咪咕搜索接口，待实现
            alert("API错误");
            console.log('咪咕搜索', searchQuery.value);
            // TODO: 实现咪咕搜索
        } else if (store.currentSoundSource === 'kugou') {
            const songs = await store.searchKuGouSong(searchQuery.value);

            if (songs && songs.length > 0) {
                // 为每首歌获取URL
                const urlPromises = songs.map(async (song : any) => {
                    try {
                        // 添加错误处理，避免undefined导致的错误
                        const url = await store.getKuGouSongUrl(song.FileHash);
                        return url;
                    } catch (error) {
                        console.error(`获取歌曲URL失败: ${song.FileName}`, error);
                        return ''; // 返回空字符串作为默认值
                    }
                });

                const urlResults = await Promise.all(urlPromises);

                // 映射搜索结果
                searchResults.value = songs.map((song:any, index:number) => ({
                    name: song.FileName.replace(` - ${song.SingerName}`, ''), 
                    id: song.FileHash, 
                    url: urlResults[index] || '', 
                    artists: song.Singers && song.Singers.length > 0 ? song.Singers : [{ name: song.SingerName }],
                    duration: song.Duration ? song.Duration * 1000 : 0, 
                }));
            } else {
                hasSearched.value = false;
            }
        }
    } catch (error) {
        console.error('搜索失败:', error);
    }
};

// 处理酷狗歌词格式
const processKuGouLyric = (lyricText: string) => {
    if (!lyricText) return [];
    
    // 提取元数据和歌词行
    const lines = lyricText.split('\n').filter(line => line.trim() !== '');
    const processedLyrics = [];
    
    // 处理每一行歌词
    for (const line of lines) {
        // 匹配时间标签 [00:00.00] 
        const timeMatch = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\](.*)/);
        if (timeMatch) {
            const minutes = parseInt(timeMatch[1]);
            const seconds = parseInt(timeMatch[2]);
            const milliseconds = parseInt(timeMatch[3]) * 10; // 转换为毫秒
            const totalTime = minutes * 60 * 1000 + seconds * 1000 + milliseconds;
            
            const text = timeMatch[4].trim();
            processedLyrics.push({
                time: totalTime,
                text: text
            });
        }
    }
    
    return processedLyrics.sort((a, b) => a.time - b.time);
};

// 播放音乐
const playMusic = (result: SearchResult) => {
    store.setCurrentSongId(result.id);
    store.setCurrentSongName(result.name);
    store.setCurrentSongUrl(result.url);
    store.setCurrentSongArtists(formatArtists(result.artists));
    store.setCurrentSongDuration(result.duration);
    
    if (store.currentSoundSource === 'netease') {
        store.getNetEaseSongLyric(result.id).then(lyric => {
            console.log('获取歌词成功:', lyric);
            store.currentSongLyric = lyric;
        }).catch(err => {
            console.error('获取歌词失败:', err);
            store.currentSongLyric = [];
        });
    }
    else if (store.currentSoundSource === 'kugou') {
        store.getKuGouSongLyric(result.id).then(lyricText => {
            console.log('获取歌词成功:', lyricText);
            
            // 提取元数据，可能会用于增强显示
            const artistMatch = lyricText.match(/\[ar:(.*?)\]/);
            const titleMatch = lyricText.match(/\[ti:(.*?)\]/);
            const albumMatch = lyricText.match(/\[al:(.*?)\]/);
            
            if (artistMatch && artistMatch[1].trim()) {
                console.log('歌手信息:', artistMatch[1]);
            }
            
            if (titleMatch && titleMatch[1].trim()) {
                console.log('歌曲标题:', titleMatch[1]);
            }
            
            if (albumMatch && albumMatch[1].trim()) {
                console.log('专辑信息:', albumMatch[1]);
            }
            
            // 处理并设置歌词
            const processedLyric = processKuGouLyric(lyricText);
            store.currentSongLyric = processedLyric;
            console.log('处理后的歌词:', processedLyric);
        }).catch(err => {
            console.error('获取歌词失败:', err);
            store.currentSongLyric = [];
        });
    } else if (store.currentSoundSource === 'migu') {
        // 咪咕歌词接口，待实现
        alert("API错误");
        console.log('咪咕歌词', result.id);
    }
    
    console.log('播放音乐:', result.name, result.url);
    if (audioPlayer.value) {
        audioPlayer.value.src = result.url;
    } else {
        console.error('未找到音频播放器元素');
    }
}

// 下载音乐
const downloadMusic = async (result: SearchResult) => {
    try {
        console.log('开始下载...');

        const response = await fetch(result.url);
        if (!response.ok) {
            throw new Error('下载音频失败');
        }

        const blob = await response.blob();

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        let artistsString = formatArtists(result.artists).replace(/[\s]/g, '_');
        a.download = `${result.name}-${artistsString}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('下载完成:', result.name);
    } catch (error) {
        console.error('下载失败:', error);
        alert('下载失败，请重试');
    }
}

</script>

<style scoped lang="less">
#Search {
    width: 80%;
    margin: 0 auto;
    position: relative;

    .search-suggest-container {
        position: absolute;
        top: 60px;
    }
}

.search-input-container {
    display: flex;
    position: relative;
    margin-bottom: 24px;
    align-items: center;
    justify-content: center;

    input {
        flex: 1;
        height: 50px;
        padding: 0 20px;
        font-size: 16px;
        border: none;
        border-radius: 12px;
        background-color: rgba(250, 250, 252, 0.8);
        box-shadow:
            0 2px 8px rgba(0, 0, 0, 0.05),
            0 0 1px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        transition: all 0.3s ease;

        &:focus {
            outline: none;
            background-color: rgba(255, 255, 255, 0.95);
            box-shadow:
                0 4px 12px rgba(0, 0, 0, 0.08),
                0 1px 3px rgba(0, 0, 0, 0.1);
        }
    }

    button {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        cursor: pointer;
        color: #666;
        transition: color 0.3s ease;

        &:hover {
            color: #333;
        }
    }
}

.search-results {
    margin-top: 20px;
    overflow-y: auto;
    max-height: calc(min(88vh, 760px) - 250px);
    scrollbar-width: none;
    padding-left: 5px;
    padding-right: 5px;

    ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .result-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        margin-bottom: 12px;
        background-color: rgba(250, 250, 252, 0.8);
        border-radius: 12px;
        box-shadow:
            0 2px 8px rgba(0, 0, 0, 0.04),
            0 0 1px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        transition: all 0.3s ease;

        &:hover {
            background-color: rgba(255, 255, 255, 0.95);
            box-shadow:
                0 4px 12px rgba(0, 0, 0, 0.08),
                0 1px 3px rgba(0, 0, 0, 0.1);
            transform: translateY(-2px);
        }

        .result-info {
            flex: 1;
            position: relative;

            h3 {
                margin: 0 0 5px 0;
                font-size: 16px;
                color: #333;
                font-weight: 600;
            }

            p {
                margin: 0;
                font-size: 14px;
                color: #666;
            }

            .duration {
                position: absolute;
                right: 20px;
                top: 50%;
                transform: translateY(-50%);
                font-size: 14px;
                color: #aaa;
            }
        }

        .result-actions {
            display: flex;
            gap: 10px;

            .action-button {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.2s ease;

                &.play {
                    background: linear-gradient(135deg, #3498db, #2980b9);
                    color: white;

                    &:hover {
                        background: linear-gradient(135deg, #2980b9, #2573a7);
                        transform: scale(1.05);
                    }
                }

                &.download {
                    background: linear-gradient(135deg, #27ae60, #2ecc71);
                    color: white;

                    &:hover {
                        background: linear-gradient(135deg, #2ecc71, #27ae60);
                        transform: scale(1.05);
                    }
                }
            }
        }
    }
}

.no-results {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100px;
    background-color: rgba(250, 250, 252, 0.8);
    border-radius: 12px;
    margin-top: 20px;

    p {
        color: #666;
        font-size: 16px;
    }
}

.search-suggestions-panel {
    position: absolute;
    top: 60px;
    left: 0;
    right: 0;
    background-color: rgba(255, 255, 255, 0.98);
    border-radius: 12px;
    box-shadow:
        0 6px 16px rgba(0, 0, 0, 0.1),
        0 3px 6px rgba(0, 0, 0, 0.05);
    max-height: 350px;
    overflow-y: auto;
    z-index: 100;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(0, 0, 0, 0.06);

    .suggestion-item {
        display: flex;
        align-items: center;
        padding: 12px 18px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover,
        &.active {
            background-color: rgba(0, 0, 0, 0.04);
        }

        .suggestion-icon {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 32px;
            height: 32px;
            background-color: rgba(0, 0, 0, 0.05);
            border-radius: 50%;
            margin-right: 12px;
            color: #666;
        }

        .suggestion-text {
            display: flex;
            flex-direction: column;

            span {
                font-size: 15px;
                color: #333;
                margin-bottom: 2px;

                .highlight {
                    color: #3498db;
                    font-weight: 600;
                }
            }

            small {
                font-size: 13px;
                color: #999;
            }
        }
    }

    .suggestion-footer {
        padding: 10px 0;
        text-align: center;
        border-top: 1px solid rgba(0, 0, 0, 0.06);
        font-size: 13px;
        color: #aaa;
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

@media (prefers-color-scheme: dark) {
    .search-input-container {
        input {
            background-color: rgba(45, 45, 50, 0.8);
            color: #e2e2e4;

            &:focus {
                background-color: rgba(50, 50, 55, 0.95);
            }
        }

        button {
            color: #aaa;

            &:hover {
                color: #ddd;
            }
        }
    }

    .search-results {
        .result-item {
            background-color: rgba(45, 45, 50, 0.8);

            &:hover {
                background-color: rgba(50, 50, 55, 0.95);
            }

            .result-info {
                h3 {
                    color: #e2e2e4;
                }

                p {
                    color: #aaa;
                }


            }
        }
    }

    .no-results {
        background-color: rgba(45, 45, 50, 0.8);

        p {
            color: #aaa;
        }
    }

    .search-suggestions-panel {
        background-color: rgba(50, 50, 55, 0.98);
        box-shadow:
            0 6px 16px rgba(0, 0, 0, 0.3),
            0 3px 6px rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.1);

        .suggestion-item {

            &:hover,
            &.active {
                background-color: rgba(255, 255, 255, 0.1);
            }

            .suggestion-icon {
                background-color: rgba(255, 255, 255, 0.1);
                color: #ccc;
            }

            .suggestion-text {
                span {
                    color: #e2e2e4;

                    .highlight {
                        color: #6eb2e7;
                    }
                }

                small {
                    color: #888;
                }
            }
        }

        .suggestion-footer {
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            color: #777;
        }

        &::-webkit-scrollbar-thumb {
            background-color: rgba(255, 255, 255, 0.2);
        }
    }
}

@media (max-width: 600px) {
    #Search {
        padding: 10px;
    }

    .search-input-container {
        input {
            height: 45px;
            font-size: 15px;
        }
    }

    .search-results .result-item {
        padding: 12px 15px;

        .result-info {
            h3 {
                font-size: 15px;
            }

            p {
                font-size: 13px;
            }
        }

        .result-actions .action-button {
            width: 36px;
            height: 36px;
        }
    }

    .search-suggestions-panel {
        top: 55px;

        .suggestion-item {
            padding: 10px 15px;

            .suggestion-icon {
                width: 28px;
                height: 28px;
                margin-right: 10px;
            }

            .suggestion-text {
                span {
                    font-size: 14px;
                }

                small {
                    font-size: 12px;
                }
            }
        }
    }
}
</style>