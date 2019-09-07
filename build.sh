#!/bin/bash

# Build script for one-shot build environments.

RUST_VERSION=1.37.0
BINARYEN_VER=version_89

set -ex

# Install Rust
curl -sSf https://sh.rustup.rs | sh -s -- --default-toolchain=$RUST_VERSION -y
source ~/.cargo/env
rustup target add --toolchain $RUST_VERSION wasm32-unknown-unknown
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh -s -- -f
rustup override set $RUST_VERSION

# Install `wasm-opt` optimizer from Binaryen
wget -q "https://github.com/WebAssembly/binaryen/releases/download/$BINARYEN_VER/binaryen-$BINARYEN_VER-x86_64-linux.tar.gz" -O binaryen.tar.gz
tar -xf binaryen.tar.gz "binaryen-$BINARYEN_VER/wasm-opt"
mkdir -p "$HOME/.local/bin"
mv "binaryen-$BINARYEN_VER/wasm-opt" "$HOME/.local/bin"
rm -rf "binaryen-$BINARYEN_VER" binaryen.tar.gz

# Build!
PATH="$PATH:$HOME/.local/bin" npm run build-opt
