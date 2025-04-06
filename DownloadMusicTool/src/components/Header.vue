<template>
    <div id="Header">
        <div 
            v-for="source in sources" 
            :key="source.value"
            class="SourceOption" 
            :class="{ active: currentSource === source.value }" 
            @click="changeSource(source.value)"
        >
            <div class="source-icon" :style="{ background: source.gradient }">
                <span>{{ source.icon }}</span>
            </div>
            <span>{{ source.name }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from '../../stores';

const store = useStore();
const currentSource = computed(() => store.currentSoundSource);

const sources = [
    { 
        name: '网易云音乐', 
        value: 'netease', 
        gradient: 'linear-gradient(135deg, rgba(236, 65, 65, 0.65) 0%, rgba(252, 103, 103, 0.55) 100%)', 
        icon: '网' 
    },
    { 
        name: '咪咕音乐', 
        value: 'migu', 
        gradient: 'linear-gradient(135deg, rgba(50, 115, 220, 0.65) 0%, rgba(79, 144, 250, 0.55) 100%)', 
        icon: '咪' 
    },
    { 
        name: '酷狗音乐', 
        value: 'kugou', 
        gradient: 'linear-gradient(135deg, rgba(0, 191, 165, 0.65) 0%, rgba(49, 210, 183, 0.55) 100%)', 
        icon: '酷' 
    }
];

// 切换音乐源
const changeSource = (source: string) => {
    store.setCurrentSoundSource(source);
};
</script>

<style scoped lang="less">
#Header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 90%;
    height: 60px;
    margin: 10px 0;
    padding: 0 5px;
}

.SourceOption {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 32%;
    height: 46px;
    padding: 0 10px;
    background-color: rgba(255, 255, 255, 0.7);
    border-radius: 12px;
    margin: 0 4px;
    cursor: pointer;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
    transition: all 0.25s ease;
    font-weight: 500;
    color: #555;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(5px);
    
    // 悬停状态
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.12);
        background-color: rgba(255, 255, 255, 0.85);
        color: #333;
    }
    
    // 激活状态
    &.active {
        background-color: rgba(255, 255, 255, 0.9);
        color: #222;
        font-weight: 600;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        
        .source-icon {
            transform: scale(1.1);
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
        }
    }
    
    // 图标样式
    .source-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 28px;
    width: 28px;
    border-radius: 8px;
    margin-right: 10px;
    transition: all 0.3s ease;
    color: white;
    font-size: 14px;
    font-weight: bold;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    line-height: 1;
    
    span {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
        transform: translateY(0);
        position: relative;
        top: -1px;
    }
}
}

@media (max-width: 600px) {
    .SourceOption {
        height: 42px;
        font-size: 14px;
        
        .source-icon {
            height: 24px;
            width: 24px;
            font-size: 12px;
            margin-right: 6px;
        }
    }
    
    #Header {
        height: 52px;
    }
}
</style>