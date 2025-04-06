import { defineStore } from "pinia";
import axios from "axios";

const NetEaseAPI = axios.create({
    baseURL: "http://localhost:3000",
    timeout: 5000,
});
const MiGuAPI = axios.create({
    baseURL: "http://localhost:3001",
    timeout: 5000,
});
const KuGouAPI = axios.create({
    baseURL: "http://localhost:3002",
    timeout: 5000,
});

export const useStore = defineStore("main", {
    state: () => ({
        // 不要图片了，流量消耗大还卡
        currentSongId: "",
        currentSongName: "",
        currentSongUrl: "",
        currentSongArtist: "",
        currentSongDuration: 0,
        currentSongLyric: [] as Array<{ time: number; text: string }>,
        currentSoundSource: "",
        SongItem: [] as Array<
            {
                id: string;
                name: string;
                url: string;
                artist: Array <string>;
                duration: number;
                lyric?: Array<{ time: number; text: string }>;
            }
        >,
        currentSongLyricIndex: 0,
        currentSongLyricTime: 0,
    }),
    getters: {
        getCurrentSongId: (state) => state.currentSongId,
        getCurrentSongName: (state) => state.currentSongName,
        getCurrentSongUrl: (state) => state.currentSongUrl,
        getCurrentSongArtist: (state) => state.currentSongArtist,
        getCurrentSoundSource: (state) => state.currentSoundSource,
        getCurrentSongLyricIndex: (state) => state.currentSongLyricIndex,
        getCurrentSongLyricTime: (state) => state.currentSongLyricTime,
        getCurrentSongDuration: (state) => state.currentSongDuration,
        getCurrentSongLyric: (state) => state.currentSongLyric,
        getSongItem: (state) => state.SongItem,
    },
    actions: {
        // 歌词格式化
        formatLyric(lyric: string): Array<{ time: number; text: string }> {
            if (!lyric) return [];
            
            const lines = lyric.split('\n');
            const result: Array<{ time: number; text: string }> = [];
            
            // 正则表达式匹配时间标签 [mm:ss.xxx]
            const timeRegExp = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;
            
            lines.forEach(line => {
                if (!line) return;
                
                // 重置正则表达式状态
                timeRegExp.lastIndex = 0;
                
                // 提取所有时间标签和文本内容
                const textContent = line.replace(timeRegExp, '').trim();
                if (!textContent) return; // 跳过只有时间标签没有歌词的行
                
                let match;
                while ((match = timeRegExp.exec(line)) !== null) {
                    const minutes = parseInt(match[1]);
                    const seconds = parseInt(match[2]);
                    const milliseconds = parseInt(match[3].padEnd(3, '0'));
                    
                    // 转换为毫秒时间戳
                    const time = minutes * 60 * 1000 + seconds * 1000 + milliseconds;
                    
                    result.push({
                        time,
                        text: textContent
                    });
                }
            });
            
            // 按时间排序
            return result.sort((a, b) => a.time - b.time);
        },
        // 设置歌词索引
        updateLyricIndex(currentTime: number) {
            // 将传入的秒转换为毫秒
            const timeMs = currentTime * 1000;
            this.currentSongLyricTime = timeMs;
            
            // 如果没有歌词，直接返回
            if (!this.currentSongLyric || this.currentSongLyric.length === 0) {
                this.currentSongLyricIndex = -1;
                return;
            }
            
            // 查找当前时间对应的歌词索引
            let index = -1;
            for (let i = 0; i < this.currentSongLyric.length; i++) {
                if (this.currentSongLyric[i].time <= timeMs) {
                    index = i;
                } else {
                    break;
                }
            }
            
            // 更新当前歌词索引
            this.currentSongLyricIndex = index;
        },
        // 设置音源
        setCurrentSoundSource(source: string) {
            this.currentSoundSource = source;
        },

        // 网易云音乐
        // 搜索歌曲
        // id,name,artists,duration,
        async searchNetEaseSong(keyword: string) {
            const response = await NetEaseAPI.get("/cloudsearch", {
                params: {
                    keywords: keyword,
                    type: 1,
                },
            });
            return response.data.result.songs;
        },
        // 搜索建议
        async searchNetEaseSuggest(keyword: string) {
            const response = await NetEaseAPI.get("/search/suggest", {
                params: {
                    keywords: keyword,
                },
            });
            return response.data.result.songs;
        },
        // 获取歌曲url
        // 减少一下网络请求次数
        async getNetEaseSongUrl(id: Array<string>) {
            const response = await NetEaseAPI.get("/song/url/v1", {
                params: {
                    id: id.join(","),
                    level: "jymaster",
                },
            });
            // 返回的是一个数组
            return response.data.data;
        },
        // 获取歌曲歌词
        async getNetEaseSongLyric(id: string) {
            const response = await NetEaseAPI.get("/lyric", {
                params: {
                    id: id,
                },
            });
            // 返回的是一个数组
            return this.formatLyric(response.data.lrc.lyric);
        }
    },
});
