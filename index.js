import fs from 'fs';
import pkg0 from 'ethers';
const { ethers } = pkg0;
import pkg1 from 'merkletreejs';
const { MerkleTree } = pkg1;

function generateLeaf(address) {
  const encodedData = ethers.utils
    .keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ['address'],
        [ethers.utils.getAddress(address)]
      )
    )
    .slice(2);
  return Buffer.from(encodedData, 'hex');
}

function generateMerkleTree(allowlist) {
  return new MerkleTree(allowlist.map(generateLeaf), ethers.utils.keccak256, {
    sortPairs: true,
  });
}

function verifyMerkleProof(merkleRoot, address, merkleProof) {
  return MerkleTree.verify(
    merkleProof,
    generateLeaf(address),
    merkleRoot,
    ethers.utils.keccak256,
    { sortPairs: true }
  );
}

function getMerkleProof(tree, address, index) {
  const leaf = generateLeaf(address);
  return tree.getHexProof(leaf, index);
}

function getEncodedMerkleProof(tree, address, allowlist) {
  const index = allowlist.findIndex((a) => a === address);
  if (index < 0) {
    throw new Error(`${address} is not on the allowlist`);
  }
  return ethers.utils.defaultAbiCoder.encode(
    ['bytes32[]'],
    [getMerkleProof(tree, address, index)]
  );
}

function fetchAllowlistAddresses(filepath) {
  const fileContent = fs.readFileSync(filepath, { encoding: 'utf-8' });
  const addresses = fileContent
    .split('\n')
    .map((e) => e.trim())
    .filter((e) => e !== '')
    .map((address) => ethers.utils.getAddress(address));
  return addresses;
}

const allowlist = fetchAllowlistAddresses('./allowlist.csv');

// Build tree and root
const merkleTree = generateMerkleTree(allowlist);
console.log(`Merkle tree successfully generated.`);
const merkleRoot = '0x' + merkleTree.getRoot().toString('hex');
console.log(`Merkle root: ${merkleRoot}`);
console.log(`-------------------`);

// Generate and verify proof for test address
const testAddress = allowlist[0];
const merkleProof = getMerkleProof(merkleTree, testAddress, allowlist);
const isVerified = verifyMerkleProof(merkleRoot, testAddress, merkleProof);
console.log(`Test address: ${testAddress}`);
console.log(`Test proof: ${merkleProof}`);
console.log(`Test proof is verified: ${isVerified}`);
console.log(`-------------------`);

// Generate encoded proof to supply to contract
const encodedMerkleProof = getEncodedMerkleProof(
  merkleTree,
  testAddress,
  allowlist
);
console.log(`Encoded test proof (for contract): ${encodedMerkleProof}`);
console.log(`-------------------`);

// Generate JSON file
console.log('Generating tree.json ...');
const treeJSON = { root: merkleRoot, proofs: {} };
for (let address of allowlist) {
  treeJSON.proofs[address] = getEncodedMerkleProof(
    merkleTree,
    address,
    allowlist
  );
}
fs.writeFileSync('tree.json', JSON.stringify(treeJSON, null, 4));
console.log('tree.json generated');
