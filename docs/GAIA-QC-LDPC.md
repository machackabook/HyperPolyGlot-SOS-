# QC-LDPC computational layer

The initial profile is a deliberately small, executable quasi-cyclic LDPC profile with lifting factor Z=3. Its 2x4 base matrix expands to H in GF(2) with 6 rows and 12 columns. The final two circulant blocks form an identity parity submatrix, so the encoder is systematic with 6 information bits and 6 parity bits.

The module includes circulant expansion, Gaussian elimination over GF(2) for rank, systematic encoding, syndrome calculation, and normalized min-sum decoding over supplied log-likelihood ratios.

Mathematical acceptance checks:
- expanded H dimensions are 6x12;
- rank_GF(2)(H)=6;
- every encoded word satisfies H*c^T=0 over GF(2);
- decoder returns only a codeword whose syndrome is zero.

This Z=3 profile is a correctness fixture, not a production communications code. Production QC-LDPC requires a reviewed profile, girth/ACE analysis, rate and block-length selection, channel model, BER/FER sweeps, and benchmark evidence.