#!/usr/bin/env bash

# Build script for one-shot build environments.

set -ex

if [[ "$RUST_VERSION" == "" ]]; then
  echo "RUST_VERSION env var is not defined; set it to the Rust toolchain to use (e.g., 1.65.0)"
  exit 1
fi

# Install Rust
curl -sSf https://sh.rustup.rs | sh -s -- --default-toolchain="$RUST_VERSION" -y
source ~/.cargo/env
rustup target add --toolchain "$RUST_VERSION" wasm32-unknown-unknown
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh -s -- -f
rustup override set "$RUST_VERSION"

# Build!
BINARYEN_CORES=1 npm run build
