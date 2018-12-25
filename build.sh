#!/bin/bash

# Build script for one-shot build environments.

set -e

# Install Rust
RUST_VERSION=nightly-2018-11-13
curl -sSf https://sh.rustup.rs | sh -s -- --default-toolchain=$RUST_VERSION -y
source ~/.cargo/env
rustup target add --toolchain $RUST_VERSION wasm32-unknown-unknown
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh -s -- -f
rustup override set $RUST_VERSION

# Build!
npm run build
