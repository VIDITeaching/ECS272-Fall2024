import { createApp } from 'vue';
import App from './src/App.vue';
import store from './store'; // If you're using Vuex for state management

createApp(App).use(store).mount('#app');
