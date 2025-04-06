<template>
    <div id="App">
        <Header />
        <Display />
        <Player />
    </div>
</template>

<script setup lang="ts">
import Header from './components/Header.vue'
import Display from './components/Display.vue'
import Player from './components/Player.vue'
    
</script>
<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>

<style scoped lang="less">
    #App{
        display: flex;
        flex-direction: column;
        align-items: center;
        background: linear-gradient(to top, #d7d0cfc0, #ffffff);
        height: min(80vh, 700px);
        width: min(90vw, 500px);
        border-radius: 1vw;
        margin-top: 2vh;
    }

</style>
