# GAIA / NEXUS Hypercube Computational Core v1

This increment converts the Hypercube design recovered from the Gemini project conversation into deterministic, independently testable computational primitives.

## Included

- Four-dimensional side-5 integer lattice: 625 vertices and 2,000 undirected unit edges.
- Manhattan geodesic constructor with a shortest-path proof by equality to the L1 lower bound.
- Domain-separated SHA-256 binary Merkle tree: 4,096 leaves, 8,191 total nodes, 13 levels L0-L12, and 12 sibling hashes per inclusion proof.
- Real bounded SHA-256d nonce search with configurable leading-zero-bit difficulty and independent verification.
- GF(256) arithmetic using primitive polynomial 0x11d, with exhaustive inverse checks over all 255 nonzero elements.
- Deterministic fold transcript accumulator with replay verification.

## Invariants

For a side-s four-dimensional grid, vertices = s^4 and edges = 4(s-1)s^3. At s=5 this is 625 vertices and 2,000 edges.

For N=4096=2^12 Merkle leaves, total nodes = 2N-1 = 8191, tree depth = 12, and levels = 13.

Every Manhattan path requires at least ||u-v||1 hops. This constructor changes one coordinate by one per hop and uses exactly that many hops, so its path is shortest.

For each nonzero a in GF(256), the exhaustive test checks a * inverse(a) = 1.

## Server API integration

The server exposes bounded JSON endpoints: GET /api/compute/self-test; POST /api/compute/path; POST /api/compute/merkle; and POST /api/compute/pow. Request validation caps Merkle input at 4,096 leaves and proof-of-work at 1,000,000 attempts with difficulty limited to 20 leading-zero bits. The runtime-status response advertises the compute engine version and endpoint names. These are server APIs; they are not yet Gemini function-calling tools. The model must not claim it executed one unless an authorized host adapter actually invokes the endpoint and returns a result.

## Explicit proof boundary

The fold transcript is NOT a SNARK, STARK, Nova folding scheme, zero-knowledge proof, or constant-time succinct verifier. It is a deterministic accumulator whose witness sequence is replayed during verification. A genuine recursive proof system needs a sound constraint system, commitment scheme, challenge derivation, proof generation, and an independent verifier.

The PoW routine searches SHA-256d nonces in the Node process. It is not a cryptocurrency consensus client, does not connect to a pool, and does not claim GPU or multi-core acceleration.

QC-LDPC encoding/decoding and Reed-Solomon encoding/decoding are not included yet. GF(256) is their field foundation, not a substitute for either codec. All throughput must be measured on the executing host; no benchmark result is hard-coded.

## Run

node --test tests/computational-core.test.mjs
