//! Tests for the Rust / WASM part of Ed25519 Quirks.

use ed25519_quirks::{Keypair, PublicKey, Signature};
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
fn keypair() {
    let keypair = Keypair::new();
    assert_eq!(keypair.seed().len(), 32);
    assert_eq!(keypair.public_key().bytes().len(), 32);

    let signature = keypair.sign(b"Hello, world!");
    assert!(keypair
        .public_key()
        .verify(b"Hello, world!", &signature.bytes()));
    assert!(!keypair
        .public_key()
        .verify(b"Hello, world", &signature.bytes()));
}

#[wasm_bindgen_test]
fn small_subgroup_key() {
    let mut public_keys = PublicKey::small_subgroup();
    loop {
        let public_key = public_keys.next();
        let public_key = if public_key.done {
            break;
        } else {
            public_key.value.unwrap()
        };

        let signature = Signature::from_random_scalar();
        let messages = signature.generate_valid_messages(&public_key, 10);

        for message in messages.as_ref() {
            let message = message.as_string().unwrap();
            assert!(public_key.verify(message.as_bytes(), &signature.bytes()));
        }
    }
}

#[wasm_bindgen_test]
fn malleable_signature() {
    let keypair = Keypair::new();
    let (message, low_signature, high_signature) = (0..)
        .map(|i| format!("message #{i}"))
        .filter_map(|message| {
            let signature = keypair.sign(message.as_bytes());
            let high_scalar = signature.modified_scalar();
            high_scalar
                .signature()
                .map(|high_signature| (message, signature.bytes(), high_signature))
        })
        .next()
        .unwrap();

    let public_key = keypair.public_key();
    assert!(public_key.verify(message.as_bytes(), &low_signature));
    assert!(public_key.verify(message.as_bytes(), &high_signature));
}
