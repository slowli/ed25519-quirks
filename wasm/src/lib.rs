//! Rust part of Ed25519 Quirks.

#![warn(missing_debug_implementations, bare_trait_objects, rust_2018_idioms)]
#![warn(clippy::all, clippy::pedantic)]
#![allow(
    clippy::must_use_candidate,
    clippy::missing_panics_doc,
    clippy::missing_errors_doc
)]

use curve25519_dalek::{
    constants::{BASEPOINT_ORDER, ED25519_BASEPOINT_POINT, EIGHT_TORSION},
    digest::Digest,
    edwards::{CompressedEdwardsY, EdwardsPoint},
    scalar::Scalar,
};
use ed25519_dalek::{
    self as ed,
    ed25519::signature::{Signer, Verifier},
    hazmat::ExpandedSecretKey,
    Sha512,
};
use num_bigint::BigUint;
use rand_core::{CryptoRng, RngCore};
use wasm_bindgen::prelude::*;

use std::fmt;

////////// Binding to a JavaScript CSPRNG. ////////////

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_name = getRandomValues, js_namespace = crypto)]
    fn random_bytes(dest: &mut [u8]);
}

/// RNG based on `window.crypto.getRandomValues()`.
struct RandomValuesRng;

impl RngCore for RandomValuesRng {
    fn next_u32(&mut self) -> u32 {
        let mut bytes = [0_u8; 4];
        random_bytes(&mut bytes);
        let mut result = u32::from(bytes[0]);
        for (i, &byte) in bytes.iter().enumerate().skip(1) {
            result += u32::from(byte) << (i * 8);
        }
        result
    }

    fn next_u64(&mut self) -> u64 {
        let mut bytes = [0_u8; 8];
        random_bytes(&mut bytes);
        let mut result = u64::from(bytes[0]);
        for (i, &byte) in bytes.iter().enumerate().skip(1) {
            result += u64::from(byte) << (i * 8);
        }
        result
    }

    fn fill_bytes(&mut self, dest: &mut [u8]) {
        random_bytes(dest);
    }

    fn try_fill_bytes(&mut self, dest: &mut [u8]) -> Result<(), rand_core::Error> {
        self.fill_bytes(dest);
        Ok(())
    }
}

impl CryptoRng for RandomValuesRng {}

////////// JS-compatible iterator for `PublicKey`s. //////////

/// Iterator returned by `PublicKeyIter`.
#[wasm_bindgen]
#[derive(Debug)]
pub struct PublicKeyIterOutput {
    /// Value yielded by the iterator.
    #[wasm_bindgen(readonly)]
    pub value: Option<PublicKey>,

    /// Is iterator done?
    #[wasm_bindgen(readonly)]
    pub done: bool,
}

/// Iterator over `PublicKey`s returned by `PublicKey::small_subgroup()`.
#[wasm_bindgen]
pub struct PublicKeyIter {
    inner: Box<dyn Iterator<Item = PublicKey>>,
}

impl fmt::Debug for PublicKeyIter {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter
            .debug_struct("PublicKeyIter")
            .finish_non_exhaustive()
    }
}

#[allow(clippy::should_implement_trait)]
#[wasm_bindgen]
impl PublicKeyIter {
    /// Advances the iterator.
    pub fn next(&mut self) -> PublicKeyIterOutput {
        let value = self.inner.next();
        PublicKeyIterOutput {
            done: value.is_none(),
            value,
        }
    }
}

////////// Basic Ed25519 interface //////////

/// Ed25519 public key wrapper.
#[wasm_bindgen]
#[derive(Debug, Clone, Copy)]
pub struct PublicKey(ed::VerifyingKey);

#[wasm_bindgen]
impl PublicKey {
    /// Parses a public key from the supplied bytes.
    pub fn parse(bytes: &[u8]) -> Result<PublicKey, JsValue> {
        ed::VerifyingKey::try_from(bytes)
            .map(PublicKey)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Returns the public keys corresponding to 8 torsion points on the Ed25519 curve.
    #[wasm_bindgen(js_name = smallSubgroup)]
    pub fn small_subgroup() -> PublicKeyIter {
        let keys = EIGHT_TORSION.iter().map(|point| {
            PublicKey(ed::VerifyingKey::from_bytes(point.compress().as_bytes()).unwrap_throw())
        });
        PublicKeyIter {
            inner: Box::new(keys),
        }
    }

    /// Returns the binary serialization of this public key.
    pub fn bytes(&self) -> Box<[u8]> {
        Box::new(self.0.to_bytes())
    }

    /// Verifies a signed message under this public key.
    pub fn verify(&self, message: &[u8], signature: &[u8]) -> bool {
        let Ok(ed_signature) = ed::Signature::try_from(signature) else {
            return false;
        };
        self.0.verify(message, &ed_signature).is_ok()
    }

    /// Produces `Verification` object for the given signed message.
    ///
    /// # Exceptions
    ///
    /// This method will return an error if the signature has an invalid format (e.g.,
    /// not 64 bytes long).
    pub fn verification(&self, message: &[u8], signature: &[u8]) -> Result<Verification, JsValue> {
        let ed_signature = ed::Signature::try_from(signature)
            .map_err(|_| JsValue::from_str("invalid signature"))?;

        let random_point = CompressedEdwardsY(*ed_signature.r_bytes());
        let signature_scalar = Scalar::from_bytes_mod_order(*ed_signature.s_bytes());

        let mut hasher = Sha512::new();
        hasher.update(random_point.as_bytes());
        hasher.update(self.0.as_bytes());
        hasher.update(message);
        let hash_scalar = Scalar::from_hash(hasher);

        let public_key_point = CompressedEdwardsY(*self.0.as_bytes()).decompress();
        let computed_point = if let Some(ref public_key_point) = public_key_point {
            EdwardsPoint::vartime_double_scalar_mul_basepoint(
                &hash_scalar,
                &-public_key_point,
                &signature_scalar,
            )
            .compress()
        } else {
            CompressedEdwardsY([0; 32])
        };

        Ok(Verification {
            hash_scalar,
            computed_point,
            decompression_error: public_key_point.is_none(),
            result: self.0.verify(message, &ed_signature).is_ok(),
        })
    }
}

/// Result of verifying an Ed25519 signature.
#[wasm_bindgen]
#[derive(Debug)]
pub struct Verification {
    result: bool,
    decompression_error: bool,
    hash_scalar: Scalar,
    computed_point: CompressedEdwardsY,
}

#[wasm_bindgen]
impl Verification {
    /// Hash scalar `H(R || A || M)` computed during verification.
    #[wasm_bindgen(js_name = hashScalar)]
    pub fn hash_scalar(&self) -> Box<[u8]> {
        Box::new(self.hash_scalar.to_bytes())
    }

    /// Computed compressed point `R' = [s]B - [H(R || A || M)]A`.
    #[wasm_bindgen(js_name = computedPoint)]
    pub fn computed_point(&self) -> Box<[u8]> {
        Box::new(self.computed_point.to_bytes())
    }

    /// `true` if the public key `A` cannot be decompressed into a point.
    #[wasm_bindgen(js_name = decompressionError)]
    pub fn decompression_error(&self) -> bool {
        self.decompression_error
    }

    /// Verification result.
    pub fn success(&self) -> bool {
        self.result
    }
}

/// Ed25519 keypair.
#[wasm_bindgen]
#[derive(Debug)]
pub struct Keypair(ed::SigningKey);

impl Default for Keypair {
    fn default() -> Self {
        Keypair::new()
    }
}

#[wasm_bindgen]
impl Keypair {
    /// Generates a new keypair using the `crypto.subtle` RNG.
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        let mut secret = [0_u8; 32];
        RandomValuesRng.fill_bytes(&mut secret);
        let signing_key = ed::SigningKey::from_bytes(&secret);
        Keypair(signing_key)
    }

    /// Constructs a keypair from a seed.
    #[wasm_bindgen(js_name = fromSeed)]
    pub fn from_seed(seed: &[u8]) -> Result<Keypair, JsValue> {
        let signing_key =
            ed::SigningKey::try_from(seed).map_err(|_| JsValue::from_str("invalid seed length"))?;
        Ok(Keypair(signing_key))
    }

    /// Returns the 32-byte seed (aka Ed25519 secret key) corresponding to this keypair.
    pub fn seed(&self) -> Box<[u8]> {
        Box::new(self.0.to_bytes())
    }

    /// Returns the 64-byte expanded seed obtained by hashing the `seed()` with SHA-512.
    #[wasm_bindgen(js_name = expandedSeed)]
    pub fn expanded_seed(&self) -> Box<[u8]> {
        let mut bytes = [0; 64];
        bytes.copy_from_slice(&Sha512::digest(&self.seed()));
        Box::new(bytes)
    }

    /// Returns the `Ed25519` group scalar derived from the `seed()`.
    ///
    /// The scalar is derived as first 32 bytes of `SHA512(seed)` "clamped" as per Ed25519 spec:
    /// setting lowest 3 bits and the highest bit to 0, and the second-highest bit to 1.
    pub fn scalar(&self) -> Box<[u8]> {
        let expanded_secret = ExpandedSecretKey::from(&self.0.to_bytes());
        Box::new(expanded_secret.scalar.to_bytes())
    }

    /// Returns the Ed25519 nonce used during signing.
    ///
    /// The nonce is equal to the upper 32 bytes of `SHA512(seed)`.
    pub fn nonce(&self) -> Box<[u8]> {
        let expanded_secret = ExpandedSecretKey::from(&self.0.to_bytes());
        Box::new(expanded_secret.hash_prefix)
    }

    /// Returns the public key part of this keypair.
    #[wasm_bindgen(js_name = publicKey)]
    pub fn public_key(&self) -> PublicKey {
        PublicKey(self.0.verifying_key())
    }

    /// Signs the supplied message.
    pub fn sign(&self, message: &[u8]) -> Signature {
        Signature::new(&self.0, message)
    }

    #[wasm_bindgen(js_name = signWithScalar)]
    pub fn sign_with_scalar(&self, message: &[u8], random_scalar: &RandomScalar) -> Signature {
        Signature::with_random_scalar(&self.0, message, &random_scalar.0)
    }
}

/// Ed25519 signature with additional debug information.
#[wasm_bindgen]
#[derive(Debug, Clone)]
pub struct Signature {
    inner: ed::Signature,
    random_scalar: Scalar,
    hash: Option<[u8; 64]>,
}

impl Signature {
    fn new(signing_key: &ed::SigningKey, message: &[u8]) -> Self {
        let signature = signing_key.sign(message);

        let expanded_secret = ExpandedSecretKey::from(&signing_key.to_bytes());
        let nonce = expanded_secret.hash_prefix;
        let mut hasher = Sha512::new();
        hasher.update(nonce);
        hasher.update(message);
        let random_scalar = Scalar::from_hash(hasher);
        let random_point = (random_scalar * ED25519_BASEPOINT_POINT).compress();
        assert_eq!(random_point.as_bytes(), &signature.to_bytes()[..32]);

        let mut hasher = Sha512::new();
        hasher.update(random_point.as_bytes());
        hasher.update(signing_key.as_ref().as_bytes());
        hasher.update(message);
        let mut hash = [0; 64];
        hash.copy_from_slice(&hasher.finalize()[..]);

        Signature {
            inner: signature,
            random_scalar,
            hash: Some(hash),
        }
    }

    fn with_random_scalar(
        signing_key: &ed::SigningKey,
        message: &[u8],
        random_scalar: &Scalar,
    ) -> Self {
        let random_point = (random_scalar * ED25519_BASEPOINT_POINT).compress();

        let mut hasher = Sha512::new();
        hasher.update(random_point.as_bytes());
        hasher.update(signing_key.as_ref().as_bytes());
        hasher.update(message);
        let mut hash = [0; 64];
        hash.copy_from_slice(&hasher.finalize()[..]);

        let expanded_secret = ExpandedSecretKey::from(&signing_key.to_bytes());
        let secret_scalar = &expanded_secret.scalar;
        let signature_scalar =
            random_scalar + Scalar::from_bytes_mod_order_wide(&hash) * secret_scalar;

        let mut inner = [0; 64];
        inner[..32].copy_from_slice(random_point.as_bytes());
        inner[32..].copy_from_slice(&signature_scalar.to_bytes());
        let inner = ed::Signature::from_bytes(&inner);

        Signature {
            inner,
            random_scalar: *random_scalar,
            hash: Some(hash),
        }
    }
}

#[wasm_bindgen]
impl Signature {
    /// Creates a signature with the form `([s]B, s)`, where `s` is a random scalar.
    /// This signature can be valid for a non-negligible fraction of messages under
    /// any of small-subgroup public keys.
    #[wasm_bindgen(js_name = "fromRandomScalar")]
    pub fn from_random_scalar() -> Self {
        let mut scalar_bytes = [0_u8; 64];
        RandomValuesRng.fill_bytes(&mut scalar_bytes);
        let scalar = Scalar::from_bytes_mod_order_wide(&scalar_bytes);

        let point = (scalar * ED25519_BASEPOINT_POINT).compress();
        let mut bytes = [0; 64];
        bytes[..32].copy_from_slice(point.as_bytes());
        bytes[32..].copy_from_slice(scalar.as_bytes());

        Signature {
            inner: ed::Signature::from_bytes(&bytes),
            random_scalar: scalar,
            hash: None,
        }
    }

    /// Generates string messages valid under this signature and the specified public key.
    ///
    /// Warning. We do not verify that public key is one of torsion points; the caller
    /// must do this check.
    #[wasm_bindgen(js_name = generateValidMessages)]
    pub fn generate_valid_messages(&self, public_key: &PublicKey, count: usize) -> Box<[JsValue]> {
        let mut rng = RandomValuesRng;

        let messages: Vec<_> = (0..)
            .map(|_| match rng.next_u32() % 2 {
                0 => format!(
                    "{0} bottles of beer on the wall, {0} bottles of beer",
                    rng.next_u32()
                ),
                1 => format!(
                    "Take {} down, pass them around, {} bottles of beer on the wall...",
                    rng.next_u32(),
                    rng.next_u32()
                ),
                _ => unreachable!(),
            })
            .filter(|message| {
                let mut hasher = Sha512::new();
                hasher.update(&self.inner.to_bytes()[..32]);
                hasher.update(public_key.0.as_bytes());
                hasher.update(message.as_bytes());

                // We're being lazy here: depending on the `public_key`, it may be enough
                // for the hash scalar to be divisible by 2 or 4 (or even 1, in the case of
                // the identity).
                Scalar::from_hash(hasher).as_bytes()[0] % 8 == 0
            })
            .map(|s| JsValue::from_str(&s))
            .take(count)
            .collect();
        messages.into_boxed_slice()
    }

    /// Returns the random scalar used in signature generation.
    ///
    /// This is secret information, which should not be leaked in correct Ed25519
    /// implementations. It's provided here for debug purposes.
    #[wasm_bindgen(js_name = randomScalar)]
    pub fn random_scalar(&self) -> Box<[u8]> {
        Box::new(self.random_scalar.to_bytes())
    }

    /// Returns the byte presentation of the signature.
    pub fn bytes(&self) -> Box<[u8]> {
        Box::new(self.inner.to_bytes())
    }

    /// Returns the point part of the signature `R`.
    pub fn random_point(&self) -> Box<[u8]> {
        Box::new({
            let mut bytes = [0; 32];
            bytes.copy_from_slice(&self.inner.to_bytes()[..32]);
            bytes
        })
    }

    /// Returns the scalar part of the signature `s`.
    pub fn scalar(&self) -> Box<[u8]> {
        Box::new({
            let mut bytes = [0; 32];
            bytes.copy_from_slice(&self.inner.to_bytes()[32..]);
            bytes
        })
    }

    /// Returns the scalar shifted by the subgroup order `l`, `s' = s + l`.
    #[wasm_bindgen(js_name = "modifiedScalar")]
    pub fn modified_scalar(&self) -> ModifiedScalar {
        let s = BigUint::from_bytes_le(&self.scalar());
        let basepoint_order = BigUint::from_bytes_le(BASEPOINT_ORDER.as_bytes());
        let shifted_s = (s + &basepoint_order).to_bytes_le();
        assert_eq!(shifted_s.len(), 32);
        ModifiedScalar::new(shifted_s.into_boxed_slice(), &self.random_point())
    }

    /// Returns the hash used in signature creation / verification,
    /// `SHA512(R || A || M)`.
    pub fn hash(&self) -> Option<Box<[u8]>> {
        self.hash.map(|hash| Box::new(hash) as Box<[u8]>)
    }

    /// Returns the `hash()` reduced to a Ed25519 group scalar.
    #[wasm_bindgen(js_name = hashScalar)]
    pub fn hash_scalar(&self) -> Option<Box<[u8]>> {
        self.hash
            .map(|hash| Box::new(Scalar::from_bytes_mod_order_wide(&hash).to_bytes()) as Box<[u8]>)
    }
}

/// Scalar value used in Ed25519.
#[wasm_bindgen]
#[derive(Debug)]
pub struct RandomScalar(Scalar);

impl Default for RandomScalar {
    fn default() -> Self {
        RandomScalar::new()
    }
}

#[wasm_bindgen]
impl RandomScalar {
    /// Generates a new random scalar.
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        let mut scalar_bytes = [0_u8; 64];
        RandomValuesRng.fill_bytes(&mut scalar_bytes);
        RandomScalar(Scalar::from_bytes_mod_order_wide(&scalar_bytes))
    }
}

/// Modified scalar in an Ed25519 signature.
#[wasm_bindgen]
#[derive(Debug)]
pub struct ModifiedScalar {
    valid: bool,
    bytes: Box<[u8]>,
    signature: Option<Box<[u8]>>,
}

impl ModifiedScalar {
    fn new(bytes: Box<[u8]>, point: &[u8]) -> Self {
        let valid = bytes[31] & 224 == 0;
        let signature = if valid {
            let mut signature_bytes = [0; 64];
            signature_bytes[..32].copy_from_slice(point);
            signature_bytes[32..].copy_from_slice(&bytes);
            Some(Box::new(signature_bytes) as Box<[u8]>)
        } else {
            None
        };

        ModifiedScalar {
            valid,
            bytes,
            signature,
        }
    }
}

#[wasm_bindgen]
impl ModifiedScalar {
    /// Is the scalar valid according to the relaxed validation rule `s < 2^253`?
    pub fn valid(&self) -> bool {
        self.valid
    }

    /// Scalar bytes.
    pub fn bytes(&self) -> Box<[u8]> {
        self.bytes.clone()
    }

    /// Signature with this scalar if the scalar is valid.
    pub fn signature(&self) -> Option<Box<[u8]>> {
        self.signature.clone()
    }
}
