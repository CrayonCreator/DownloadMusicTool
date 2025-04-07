<template>
    <div id="App">
        <Header />
        <Search />
        <Player />
    </div>
</template>

<script setup lang="ts">
import Header from './components/Header.vue'
import Search from './components/Search.vue'
import Player from './components/Player.vue'
    
</script>
<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(145deg, #f2f4f8 0%, #e8ebf2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  color: #333;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>

<style scoped lang="less">
    #App {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(35px) saturate(160%);
        -webkit-backdrop-filter: blur(35px) saturate(160%);
        box-shadow: 
            0 15px 35px rgba(0, 0, 0, 0.1),
            0 5px 15px rgba(0, 0, 0, 0.05),
            inset 0 0 0 1px rgba(255, 255, 255, 0.6);
        height: min(88vh, 760px);
        width: min(90vw, 540px);
        border-radius: 28px;
        margin-top: 0;
        border: 1px solid rgba(255, 255, 255, 0.8);
        transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        position: relative;
        overflow: hidden;
        
        &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 120px;
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 100%);
            z-index: 0;
        }
        
        &:hover {
            box-shadow: 
                0 25px 50px rgba(0, 0, 0, 0.15),
                0 10px 20px rgba(0, 0, 0, 0.08),
                inset 0 0 0 1px rgba(255, 255, 255, 0.6);
        }
    }

    @media (prefers-color-scheme: dark) {
        html, body {
            background: linear-gradient(145deg, #2d2d35 0%, #1a1a20 100%);
            color: #e2e2e4;
        }
        
        #App {
            background: rgba(32, 32, 38, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 
                0 15px 35px rgba(0, 0, 0, 0.35),
                0 5px 15px rgba(0, 0, 0, 0.2),
                inset 0 0 0 1px rgba(255, 255, 255, 0.08);
            &::before {
                background: linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0) 100%);
            }
            
            &:hover {
                box-shadow: 
                    0 25px 50px rgba(0, 0, 0, 0.45),
                    0 10px 20px rgba(0, 0, 0, 0.25),
                    inset 0 0 0 1px rgba(255, 255, 255, 0.1);
            }
        }
    }
</style>
