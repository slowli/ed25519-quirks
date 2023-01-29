# Ed25519 Quirks

[![Build status][ci-image]][ci-url]
[![Live website][website-image]][website-url]
[![License: Apache-2.0][license-image]][license-url] 

[ci-image]: https://github.com/slowli/ed25519-quirks/actions/workflows/ci.yml/badge.svg
[ci-url]: https://github.com/slowli/ed25519-quirks/actions/workflows/ci.yml
[website-image]: https://img.shields.io/badge/website-live-blue.svg
[website-url]: https://quirks.ed25519.info/
[license-image]: https://img.shields.io/github/license/slowli/ed25519-quirks.svg
[license-url]: https://github.com/slowli/ed25519-quirks/blob/master/LICENSE

Single-page web app demonstrating some of Ed25519 peculiarities. Built with the Rust/WASM toolchain
and Vue.

## Running locally

You will need to install a Node / npm toolchain (preferably via a manager like [`nvm`])
and a Rust toolchain (preferably via [`rustup`]). Both toolchains should be recent; i.e., Node 16-LTS
and Rust 1.65+. You should also install [`wasm-pack`].

To (re)build the WASM file and its JS bindings, execute

```shell
npm run build-wasm
```

To serve the app locally with the Webpack dev server, run

```shell
npm start
```

(You may need to build WASM first, it's not done automatically.)

## Testing

To run tests, use `npm test` (for front-end tests) and `npm run test-wasm` (for WASM tests).
Be aware that the `test-wasm` command requires specifying browsers used for testing as flags
(e.g., `-- --firefox`).

Consult [`package.json`](package.json) for the full list of linting and testing commands.
Note that Rust-related linting requires additional components (`fmt` and `clippy`) installed as a part
of the relevant toolchain.

## License

Licensed under [Apache-2.0 license](LICENSE).

[`nvm`]: https://github.com/creationix/nvm
[`rustup`]: https://rustup.rs/
[`wasm-pack`]: https://rustwasm.github.io/wasm-pack/installer/
