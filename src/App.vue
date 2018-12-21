<template>
  <div>
    <header class="body-header">
      <div class="container">
        <h1 class="display-3">
          <router-link class="d-block" :to="{ name: 'intro' }">Ed25519 Quirks</router-link>
        </h1>
        <nav class="navbar navbar-expand-lg navbar-light px-0 pb-0">
          <button class="navbar-toggler mb-1" type="button" data-toggle="collapse" data-target="#main-nav-content"
                  aria-controls="main-nav-content" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>

          <div class="collapse navbar-collapse" id="main-nav-content">
            <ul class="navbar-nav mr-auto">
              <li class="nav-item" :class="{ active: $route.name === 'basics' }">
                <router-link class="nav-link" :to="{ name: 'basics' }">Basics</router-link>
              </li>
              <li class="nav-item" :class="{ active: $route.name === 'malleability' }">
                <router-link class="nav-link" :to="{ name: 'malleability' }">Malleability</router-link>
              </li>
              <li class="nav-item" :class="{ active: $route.name === 'wildcards' }">
                <router-link class="nav-link" :to="{ name: 'wildcards' }">Wildcards</router-link>
              </li>
            </ul>

            <ul class="navbar-nav">
              <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" role="button" data-toggle="dropdown" aria-haspopup="true"
                   aria-expanded="false">
                  Settings
                </a>
                <div class="dropdown-menu dropdown-menu-right">
                  <h6 class="dropdown-header">Encoding</h6>
                  <form class="mx-3 my-1">
                    <div class="custom-control custom-radio custom-control-inline">
                      <input type="radio" id="encoding-hex" name="encoding" value="hex" class="custom-control-input"
                             v-model="encoding" @change="updateEncoding('hex')">
                      <label class="custom-control-label" for="encoding-hex">Hex</label>
                    </div>
                    <div class="custom-control custom-radio custom-control-inline">
                      <input type="radio" id="encoding-base64" name="encoding" value="base64"
                             class="custom-control-input" v-model="encoding" @change="updateEncoding('base64')">
                      <label class="custom-control-label" for="encoding-base64">Base64</label>
                    </div>
                  </form>
                </div>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </header>

    <div class="container pt-4">
      <router-view :encoding="encoding"></router-view>

      <div v-if="$route.meta.prev || $route.meta.next" class="row mt-4">
        <div v-if="$route.meta.prev" class="col-md-5 mb-1 mb-md-0">
          <router-link :to="{ name: $route.meta.prev }"><span class="text-muted">←</span>
            {{ $router.resolve({ name: $route.meta.prev }).route.meta.description }}
          </router-link>
        </div>
        <div v-if="$route.meta.next" class="col-md-5 ml-auto text-md-right">
          <router-link :to="{ name: $route.meta.next }">
            {{ $router.resolve({ name: $route.meta.next }).route.meta.description }}
            <span class="text-muted">→</span>
          </router-link>
        </div>
      </div>

      <footer class="page-footer small text-muted">
        <span class="copyright">© 2018 Alex Ostrovski</span>
        <div class="float-none float-sm-right">
          <router-link :to="{ name: 'about' }">About</router-link>&nbsp;•
          <a href="https://github.com/slowli/ed25519-quirks">GitHub</a>
        </div>
      </footer>
    </div>
  </div>
</template>
<style>
  code {
    color: #6c7596;
    padding: .1rem .2rem;
    border-radius: .25rem;
    background-color: #f8f9fa;
  }

  .body-header {
    padding: 1rem 1rem 0;
    background: #f4f4f4;
    border-bottom: 1px solid #eee;
  }

  .body-header h1 a,
  .body-header h1 a:hover {
    color: inherit !important;
    text-decoration: none !important;
  }

  .body-header .nav-item {
    border-bottom: 2px solid transparent;
  }

  .body-header .nav-item.active {
    border-bottom: 2px solid;
  }

  .page-footer {
    margin: 4rem -0.5rem 0 -0.5rem;
    padding: 2rem 0 1.5rem;
    border-top: 1px solid rgba(0, 0, 0, 0.15);
  }
</style>
<script>
  export default {
    data() {
      let encoding = localStorage.getItem('encoding') || '';
      if (['hex', 'base64'].indexOf(encoding) < 0) {
        encoding = 'base64';
        localStorage.setItem('encoding', encoding);
      }

      return {
        encoding
      };
    },

    methods: {
      updateEncoding(encoding) {
        localStorage.setItem('encoding', encoding);
      }
    }
  };
</script>
