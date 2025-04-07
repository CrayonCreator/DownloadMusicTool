<template>
    <!-- 搜索 -->
    <div id="Search">
        <div class="search-input-container">
            <input type="text" v-model="searchQuery" placeholder="搜索音乐、歌手或专辑..." @keyup.enter="searchMusic" />
            <button @click="searchMusic">
                <svg width="20" height="20" viewBox="0 0 24 24">
                    <path
                        d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
                        fill="currentColor" />
                </svg>
            </button>
        </div>

        <div class="search-results" v-if="searchResults.length">
            <ul>
                <li v-for="(result, index) in searchResults" :key="index" class="result-item">
                    <div class="result-info">
                        <h3>{{ result.name }}</h3>
                        <p>{{ formatArtists(result.artists) }}</p>
                        <span class="duration">{{ formatDuration(result.duration) }}</span>
                    </div>
                    <div class="result-actions">
                        <button class="action-button play" @click="playMusic()">
                            <svg width="18" height="18" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" fill="currentColor" />
                            </svg>
                        </button>
                        <button class="action-button download" @click="downloadMusic()">
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
import { ref } from 'vue';
import { useStore } from '../../stores';

// 定义搜索结果的类型
interface SearchResult {
    name: string;
    id: string;
    url: string;
    artists: Array<string>;
    duration: number;
    lyric?: Array<{ time: number; text: string }>;
}

const store = useStore();
const searchQuery = ref('');
const searchResults = ref<SearchResult[]>([]);
const hasSearched = ref(false);

// 格式化歌手名称
const formatArtists = (artists: Array<any>) => {
    if (!artists || artists.length === 0) return '未知歌手';
    return artists.map(artist => artist.name).join(' ');
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
            console.log('咪咕搜索', searchQuery.value);
            // TODO: 实现咪咕搜索
        } else if (store.currentSoundSource === 'kugou') {
            // 酷狗搜索接口，待实现
            console.log('酷狗搜索', searchQuery.value);
            // TODO: 实现酷狗搜索
        }
    } catch (error) {
        console.error('搜索失败:', error);
    }
};
// 播放音乐
const playMusic = () => {

}

// 下载音乐
const downloadMusic = () => {

}

</script>

<style scoped lang="less">
#Search {
    width: 80%;
    margin: 0 auto;
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
}
</style>