#!/bin/bash

# Build script for one-shot build environments.

RUST_VERSION=1.45.0

set -ex

# Install Rust
curl -sSf https://sh.rustup.rs | sh -s -- --default-toolchain=$RUST_VERSION -y
source ~/.cargo/env
rustup target add --toolchain $RUST_VERSION wasm32-unknown-unknown
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh -s -- -f
rustup override set $RUST_VERSION

# Build!
PATH="$PATH:$HOME/.local/bin" BINARYEN_CORES=1 npm run build
