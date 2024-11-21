<template>
    <div class="prose">
        <h1>TipTap Playground</h1>
        <hr />
        <div>
            <h1>Non UI</h1>
            <NuxtLink class="button" to="/nonui/basic"> Basic </NuxtLink>
            <NuxtLink class="button" to="/nonui/lowlight"> Lowlight </NuxtLink>
            <NuxtLink class="button" to="/nonui/image"> Image </NuxtLink>
        </div>
        <!-- <div>
      <h1>With UI</h1>
      <NuxtLink class="button" to="/basic"> Basic </NuxtLink>
      <NuxtLink class="button" to="/lowlight"> Lowlight </NuxtLink>
    </div> -->
    </div>
</template>

<script setup></script>

<style scoped>
.button {
    background-color: #4caf50; /* Green */
    border: none;
    color: white;
    padding: 15px 32px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 16px;
    margin: 4px 2px;
    cursor: pointer;
}
</style>
