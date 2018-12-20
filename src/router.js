import Vue from 'vue';
import Router from 'vue-router';
import IntroPage from './pages/Intro.vue';
import BasicsPage from './pages/Basics.vue';
import MalleabilityPage from './pages/Malleability.vue';
import WildcardsPage from './pages/Wildcards.vue';
import ClampingPage from './pages/Clamping.vue';
import AboutPage from './pages/About.vue';

Vue.use(Router);

const router = new Router({
  routes: [
    {
      path: '/',
      name: 'intro',
      meta: {
        next: 'basics',
        description: 'Introduction into Ed25519',
      },
      component: IntroPage,
    },
    {
      path: '/basics',
      name: 'basics',
      meta: {
        prev: 'intro',
        next: 'malleability',
        description: 'Creating and verifying signatures',
      },
      component: BasicsPage,
    },
    {
      path: '/malleability',
      name: 'malleability',
      meta: {
        prev: 'basics',
        next: 'wildcards',
        description: 'Malleable signatures',
      },
      component: MalleabilityPage,
    },
    {
      path: '/wildcards',
      name: 'wildcards',
      meta: {
        prev: 'malleability',
        description: 'Wildcard signatures',
      },
      component: WildcardsPage,
    },
    {
      path: '/clamping',
      name: 'clamping',
      component: ClampingPage,
    },
    {
      path: '/about',
      name: 'about',
      component: AboutPage,
    }
  ],

  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return {
        selector: to.hash, offset: { x: 0, y: 10 }
      };
    } else if (savedPosition) {
      return savedPosition;
    } else {
      return { x: 0, y: 0 };
    }
  }
});

// Hack to make the `hash` work when opening a page from scratch.
// Quite possibly, there is a better way.
let firstRoute = true;
router.beforeEach((to, from, next) => {
  if (firstRoute) {
    firstRoute = false;
    next({
      replace: true,
      path: to.path,
      hash: to.hash,
      query: to.query,
      params: to.params,
    });
  } else {
    next();
  }
});

export default router;
