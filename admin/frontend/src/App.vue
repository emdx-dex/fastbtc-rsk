<template>
  <v-app>
    <v-app-bar app dark height="100">
      <router-link class="app__header__link" to="/">
        <v-img
          alt="RSK Logo"
          class="shrink mr-2"
          contain
          src="./assets/rsk_logo_reverse.svg"
          transition="scale-transition"
          width="100"
        />
        <!-- <div class="d-flex align-center">Fast BTC-RSK</div> -->
      </router-link>

      <v-spacer></v-spacer>
    </v-app-bar>

    <v-main>
      <router-view class="background"></router-view>
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: 'App',

  components: {},

  data: () => ({}),
};
</script>
