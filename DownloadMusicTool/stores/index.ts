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
        currentSongArtists: "",
        currentSongDuration: 0,
        currentSongLyric: [] as Array<{ time: number; text: string }>,
        currentSoundSource: "",
        SongItem: [] as Array<
            {
                name: string;
                id: string;
                url: string;
                artists: Array<string>;
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
        getCurrentSongArtists: (state) => state.currentSongArtists,
        getCurrentSoundSource: (state) => state.currentSoundSource,
        getCurrentSongLyricIndex: (state) => state.currentSongLyricIndex,
        getCurrentSongLyricTime: (state) => state.currentSongLyricTime,
        getCurrentSongDuration: (state) => state.currentSongDuration,
        getCurrentSongLyric: (state) => state.currentSongLyric,
        getSongItem: (state) => state.SongItem,
    },
    actions: {
        setCurrentSongId(id: string) {
            this.currentSongId = id;
        },
        setCurrentSongName(name: string) {
            this.currentSongName = name;
        },
        setCurrentSongUrl(url: string) {
            this.currentSongUrl = url;
        },
        setCurrentSongArtists(artists: string) {
            this.currentSongArtists = artists;
        },
        setCurrentSongLyricIndex(index: number) {
            this.currentSongLyricIndex = index;
        },
        setCurrentSongLyricTime(time: number) {
            this.currentSongLyricTime = time;
        },
        setCurrentSongDuration(duration: number) {
            this.currentSongDuration = duration;
        },
        // 歌词格式化
        formatLyric(lyric: string): Array<{ time: number; text: string }> {
            if (!lyric) return [];

            const lines = lyric.split("\n");
            const result: Array<{ time: number; text: string }> = [];

            // 正则表达式匹配时间标签 [mm:ss.xxx]
            const timeRegExp = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;

            lines.forEach((line) => {
                if (!line) return;

                // 重置正则表达式状态
                timeRegExp.lastIndex = 0;

                // 提取所有时间标签和文本内容
                const textContent = line.replace(timeRegExp, "").trim();
                if (!textContent) return; // 跳过只有时间标签没有歌词的行

                let match;
                while ((match = timeRegExp.exec(line)) !== null) {
                    const minutes = parseInt(match[1]);
                    const seconds = parseInt(match[2]);
                    const milliseconds = parseInt(match[3].padEnd(3, "0"));

                    // 转换为毫秒时间戳
                    const time = minutes * 60 * 1000 + seconds * 1000 +
                        milliseconds;

                    result.push({
                        time,
                        text: textContent,
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
        async getNetEaseSongUrl(id: string) {
            const response = await NetEaseAPI.get("/song/url/v1", {
                params: {
                    id: id,
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
        },

        // 咪咕音乐(api有问题)
        // 搜索歌曲
        // async searchMiGuSong(keyword: string) {
        //     const response = await MiGuAPI.get("/search", {
        //         params: {
        //             keyword: keyword,
        //         },
        //     });
        //     return response.data.data.list;
        // },
        // // 搜索建议
        // async searchMiGuSuggest(keyword: string) {
        //     const response = await fetch(
        //         `https://m.music.migu.cn/migumusic/h5/search/suggest?text=${keyword}`,
        //         {
        //             method: "GET",
        //             headers: {
        //                 "Accept": "application/json, text/plain, */*",
        //                 "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        //                 "By": "3fa31b52dd6ebc517e5492d43d77e61c",
        //                 "Connection": "keep-alive",
        //                 "Referer": "https://m.music.migu.cn/v4/search",
        //                 "Sec-Fetch-Dest": "empty",
        //                 "Sec-Fetch-Mode": "cors",
        //                 "Sec-Fetch-Site": "same-origin",
        //                 "User-Agent":
        //                     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
        //                 "sec-ch-ua":
        //                     '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
        //                 "sec-ch-ua-mobile": "?0",
        //                 "sec-ch-ua-platform": '"Windows"',
        //                 "Cookie":"migu_cookie_id=bda418b1-d407-441d-be96-2b0000da39db; mg_uem_user_id_3136357ddb6a49f5b317ca6254e7ea49=ccf84c8b-ff69-4e45-9272-4aa9b1ec1a7f; cookieId=1WwcI1G5QnEo3_sGlEU5o2pAeSF9Xfv1744035428727",
        //             },
        //         },
        //     );
        //     const data = await response.json();
        //     return data.data.songs;
        // },
        // // 获取歌曲url
        // async getMiGuSongUrl(cid: string) {
        //     const response = await MiGuAPI.get("/song/url", {
        //         params: {
        //             cid: cid,
        //         },
        //     });
        //     return response.data.data[0].url;
        // }

        // 酷狗音乐

        // 搜索歌曲
        async searchKuGouSong(keywords: string) {
            const response = await KuGouAPI.get("/search", {
                params: {
                    keywords: keywords,
                },
            });
            return response.data.data.lists;
        },
        // 搜索建议
        async searchKuGouSuggest(keywords: string) {
            const response = await KuGouAPI.get("/search/suggest", {
                params: {
                    keywords: keywords,
                },
            });
            return response.data.data[0].RecordDatas;
        },
        // 获取歌曲url
        async getKuGouSongUrl(hash: string) {
            // console.log(hash);
            
            const response = await KuGouAPI.get("/song/url/new", {
                params: {
                    hash: hash,
                },
            });

            return response.data.data[0].relate_goods[0].info.tracker_url[0];
        },
        // 获取歌曲id和accsesskey
        async getKuGouSongIdAndAccesskey(hash: string) {
            const response = await KuGouAPI.get("/search/lyric", {
                params: {
                    hash: hash,
                },
            });
            let result = {
                id: "",
                accesskey: "",
            }
            result.id = response.data.candidates[0].id;
            result.accesskey = response.data.candidates[0].accesskey;
            return result;
        },
        // 获取歌曲歌词
        async getKuGouSongLyric(hash: string) {
            const info = await this.getKuGouSongIdAndAccesskey(hash);
            const response = await KuGouAPI.get("/lyric", {
                params: {
                    id: info.id,
                    accesskey: info.accesskey,
                    fmt: "lrc",
                    decode: 1,
                },
            });
            return response.data.decodeContent


        },
    },
});
