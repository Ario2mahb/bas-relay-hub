const eth = require('ethereumjs-util')
const rlp = require('rlp')
const Web3 = require('web3');

/** @var web3 {Web3} */

const SIMPLE_TOKEN_TEMPLATE_BYTECODE = "0x60806040523480156200001157600080fd5b5060408051602080820180845260008084528451928301909452928152815191929091620000429160039162000061565b5080516200005890600490602084019062000061565b50505062000143565b8280546200006f9062000107565b90600052602060002090601f016020900481019282620000935760008555620000de565b82601f10620000ae57805160ff1916838001178555620000de565b82800160010185558215620000de579182015b82811115620000de578251825591602001919060010190620000c1565b50620000ec929150620000f0565b5090565b5b80821115620000ec5760008155600101620000f1565b600181811c908216806200011c57607f821691505b6020821081036200013d57634e487b7160e01b600052602260045260246000fd5b50919050565b610cb580620001536000396000f3fe608060405234801561001057600080fd5b50600436106100c55760003560e01c806306fdde03146100ca578063095ea7b3146100e857806318160ddd1461010b57806323b872dd1461011d578063313ce56714610130578063395093511461013f57806340c10f191461015257806358b917fd1461016757806370a082311461017a57806395d89b41146101a35780639dc29fac146101ab578063a457c2d7146101be578063a9059cbb146101d1578063dd62ed3e146101e4578063df1f29ee1461021d575b600080fd5b6100d2610240565b6040516100df9190610a5e565b60405180910390f35b6100fb6100f6366004610acf565b610252565b60405190151581526020016100df565b6002545b6040519081526020016100df565b6100fb61012b366004610af9565b610268565b604051601281526020016100df565b6100fb61014d366004610acf565b610317565b610165610160366004610acf565b610353565b005b610165610175366004610b35565b610378565b61010f610188366004610b74565b6001600160a01b031660009081526020819052604090205490565b6100d26103cd565b6101656101b9366004610acf565b6103da565b6100fb6101cc366004610acf565b6103fb565b6100fb6101df366004610acf565b610494565b61010f6101f2366004610b96565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b600954600854604080519283526001600160a01b039091166020830152016100df565b606061024d6006546104a1565b905090565b600061025f33848461057b565b50600192915050565b60006102758484846106a0565b6001600160a01b0384166000908152600160209081526040808320338452909152902054828110156102ff5760405162461bcd60e51b815260206004820152602860248201527f45524332303a207472616e7366657220616d6f756e74206578636565647320616044820152676c6c6f77616e636560c01b60648201526084015b60405180910390fd5b61030c853385840361057b565b506001949350505050565b3360008181526001602090815260408083206001600160a01b0387168452909152812054909161025f91859061034e908690610bdf565b61057b565b6007546001600160a01b0316331461036a57600080fd5b610374828261085d565b5050565b6007546001600160a01b03161561038e57600080fd5b60078054336001600160a01b031991821617909155600594909455600692909255600880549093166001600160a01b0390921691909117909155600955565b606061024d6005546104a1565b6007546001600160a01b031633146103f157600080fd5b610374828261092a565b3360009081526001602090815260408083206001600160a01b03861684529091528120548281101561047d5760405162461bcd60e51b815260206004820152602560248201527f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f77604482015264207a65726f60d81b60648201526084016102f6565b61048a338585840361057b565b5060019392505050565b600061025f3384846106a0565b606060008290036104c057505060408051600081526020810190915290565b600060105b60ff81161561051757836104d98284610c0d565b60ff16602081106104ec576104ec610c32565b1a60f81b6001600160f81b0319161561050c576105098183610c0d565b91505b60011c607f166104c5565b506000610525826001610c0d565b60ff1667ffffffffffffffff81111561054057610540610bf7565b6040519080825280601f01601f19166020018201604052801561056a576020820181803683370190505b506020810194909452509192915050565b6001600160a01b0383166105dd5760405162461bcd60e51b8152602060048201526024808201527f45524332303a20617070726f76652066726f6d20746865207a65726f206164646044820152637265737360e01b60648201526084016102f6565b6001600160a01b03821661063e5760405162461bcd60e51b815260206004820152602260248201527f45524332303a20617070726f766520746f20746865207a65726f206164647265604482015261737360f01b60648201526084016102f6565b6001600160a01b0383811660008181526001602090815260408083209487168084529482529182902085905590518481527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92591015b60405180910390a3505050565b6001600160a01b0383166107045760405162461bcd60e51b815260206004820152602560248201527f45524332303a207472616e736665722066726f6d20746865207a65726f206164604482015264647265737360d81b60648201526084016102f6565b6001600160a01b0382166107665760405162461bcd60e51b815260206004820152602360248201527f45524332303a207472616e7366657220746f20746865207a65726f206164647260448201526265737360e81b60648201526084016102f6565b6001600160a01b038316600090815260208190526040902054818110156107de5760405162461bcd60e51b815260206004820152602660248201527f45524332303a207472616e7366657220616d6f756e7420657863656564732062604482015265616c616e636560d01b60648201526084016102f6565b6001600160a01b03808516600090815260208190526040808220858503905591851681529081208054849290610815908490610bdf565b92505081905550826001600160a01b0316846001600160a01b0316600080516020610c608339815191528460405161084f91815260200190565b60405180910390a350505050565b6001600160a01b0382166108b35760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f20616464726573730060448201526064016102f6565b80600260008282546108c59190610bdf565b90915550506001600160a01b038216600090815260208190526040812080548392906108f2908490610bdf565b90915550506040518181526001600160a01b03831690600090600080516020610c608339815191529060200160405180910390a35050565b6001600160a01b03821661098a5760405162461bcd60e51b815260206004820152602160248201527f45524332303a206275726e2066726f6d20746865207a65726f206164647265736044820152607360f81b60648201526084016102f6565b6001600160a01b038216600090815260208190526040902054818110156109fe5760405162461bcd60e51b815260206004820152602260248201527f45524332303a206275726e20616d6f756e7420657863656564732062616c616e604482015261636560f01b60648201526084016102f6565b6001600160a01b0383166000908152602081905260408120838303905560028054849290610a2d908490610c48565b90915550506040518281526000906001600160a01b03851690600080516020610c6083398151915290602001610693565b600060208083528351808285015260005b81811015610a8b57858101830151858201604001528201610a6f565b81811115610a9d576000604083870101525b50601f01601f1916929092016040019392505050565b80356001600160a01b0381168114610aca57600080fd5b919050565b60008060408385031215610ae257600080fd5b610aeb83610ab3565b946020939093013593505050565b600080600060608486031215610b0e57600080fd5b610b1784610ab3565b9250610b2560208501610ab3565b9150604084013590509250925092565b60008060008060808587031215610b4b57600080fd5b843593506020850135925060408501359150610b6960608601610ab3565b905092959194509250565b600060208284031215610b8657600080fd5b610b8f82610ab3565b9392505050565b60008060408385031215610ba957600080fd5b610bb283610ab3565b9150610bc060208401610ab3565b90509250929050565b634e487b7160e01b600052601160045260246000fd5b60008219821115610bf257610bf2610bc9565b500190565b634e487b7160e01b600052604160045260246000fd5b600060ff821660ff84168060ff03821115610c2a57610c2a610bc9565b019392505050565b634e487b7160e01b600052603260045260246000fd5b600082821015610c5a57610c5a610bc9565b50039056feddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3efa264697066735822122055b0cca4f4a703aa70c2447bedb64abd731a34b5d8cc34e28097befcaa8f9e9064736f6c634300080e0033";
const SIMPLE_TOKEN_PROXY_BYTECODE = "0x608060405234801561001057600080fd5b50610201806100206000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c8063c4d66de8146100f0575b60008061005960017fa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d5161014d565b60001b9050805491506000826001600160a01b031663709bc7f36040518163ffffffff1660e01b81526004016020604051808303816000875af11580156100a4573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906100c8919061018a565b90503660008037600080366000845af43d6000803e8080156100e9573d6000f35b3d6000fd5b005b6100ee6100fe3660046101ae565b60008061012c60017fa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d5161014d565b8054925090506001600160a01b0382161561014657600080fd5b9190915550565b60008282101561016d57634e487b7160e01b600052601160045260246000fd5b500390565b6001600160a01b038116811461018757600080fd5b50565b60006020828403121561019c57600080fd5b81516101a781610172565b9392505050565b6000602082840312156101c057600080fd5b81356101a78161017256fea26469706673582212204708d9af56f7fde279b28aec42ae1ed319c0badb1966bee8dc1789cfab7ce64064736f6c634300080e0033";

function operatorByNetwork(networkName) {
  const operatorByNetwork = {
    // BSC
    'smartchaintestnet': '0x256e78f10eE9897bda1c36C30471A2b3c8aE5186',
    'smartchain': '0x4069D8A3dE3A72EcA86CA5e0a4B94619085E7362',
    // ETH
    'goerli': '0x256e78f10eE9897bda1c36C30471A2b3c8aE5186',
    'mainnet': '0x4069D8A3dE3A72EcA86CA5e0a4B94619085E7362',
    // polygon
    'polygontestnet': '0x256e78f10eE9897bda1c36C30471A2b3c8aE5186',
    'polygon': '0x4069D8A3dE3A72EcA86CA5e0a4B94619085E7362',
    // unit tests
    'test': '0x256e78f10eE9897bda1c36C30471A2b3c8aE5186',
    'soliditycoverage': '0x256e78f10eE9897bda1c36C30471A2b3c8aE5186',
    'ganache': '0x256e78f10eE9897bda1c36C30471A2b3c8aE5186',
  };
  const operatorAddress = operatorByNetwork[networkName]
  if (!operatorAddress) throw new Error(`Operator doesn't exist for network ${networkName}`)
  return operatorAddress;
}

function nameAndSymbolByNetwork(networkName) {
  const networks = {
    // BSC
    'smartchaintestnet': {name: 'BNB', symbol: 'BNB'},
    'smartchain': {name: 'BNB', symbol: 'BNB'},
    // ETH
    'goerli': {name: 'Ethereum', symbol: 'ETH'},
    'mainnet': {name: 'Ethereum', symbol: 'ETH'},
    // polygon
    'polygontestnet': {name: 'Matic Token', symbol: 'MATIC'},
    'polygon': {name: 'Matic Token', symbol: 'MATIC'},
    // unit tests
    'test': {name: 'Ethereum', symbol: 'ETH'},
    'soliditycoverage': {name: 'Ethereum', symbol: 'ETH'},
    'ganache': {name: 'Ethereum', symbol: 'ETH'},
  };
  if (!networks[networkName]) throw new Error(`Unknown network ${networkName}`);
  return networks[networkName];
}

function nativeAddressByNetwork(networkName) {
  function nativeHash(str) {
    return '0x' + eth.keccak256(Buffer.from(str, 'utf8')).slice(0, 20).toString('hex');
  }

  const {symbol} = nameAndSymbolByNetwork(networkName);
  return nativeHash(`CrossChainBridge:${symbol}`);
}

function simpleTokenTemplateAddress(deployer) {
  if (deployer.startsWith('0x')) {
    deployer = deployer.substr(2);
  }
  let salt = eth.keccak256(Buffer.from('SimpleTokenTemplateV1', 'utf8')).toString('hex')
  if (salt.startsWith('0x')) {
    salt = salt.substr(2);
  }
  const byteCodeHash = eth.keccak256(eth.toBuffer(SIMPLE_TOKEN_TEMPLATE_BYTECODE));
  const newAddress = eth.keccak256(eth.toBuffer([
    '0xff',
    deployer,
    web3.utils.padRight(salt, 64),
    byteCodeHash.toString('hex')
  ].join('')));
  return `0x${newAddress.toString('hex').substr(24)}`;
}

function simpleTokenProxyAddress(deployer, salt) {
  if (deployer.startsWith('0x')) {
    deployer = deployer.substr(2);
  }
  if (salt.startsWith('0x')) {
    salt = salt.substr(2);
  }
  const byteCodeHash = eth.keccak256(eth.toBuffer(SIMPLE_TOKEN_PROXY_BYTECODE));
  const newAddress = eth.keccak256(eth.toBuffer([
    '0xff',
    deployer,
    web3.utils.padRight(salt, 64),
    byteCodeHash.toString('hex')
  ].join('')));
  return `0x${newAddress.toString('hex').substr(24)}`;
}

function createSimpleTokenMetaData(symbol, name, chain, origin) {
  return [
    web3.eth.abi.encodeParameter('bytes32', web3.utils.asciiToHex(symbol)),
    web3.eth.abi.encodeParameter('bytes32', web3.utils.asciiToHex(name)),
    chain,
    origin
  ];
}

function encodeTransactionReceipt(txReceipt) {
  const rlpLogs = txReceipt.rawLogs.map(log => {
    return [
      // address
      log.address,
      // topics
      log.topics,
      // data
      new Buffer(log.data.substr(2), 'hex'),
    ];
  });
  const rlpReceipt = [
    // postStateOrStatus
    Number(txReceipt.status),
    // cumulativeGasUsed
    Web3.utils.numberToHex(txReceipt.gasUsed),
    // bloom
    txReceipt.logsBloom,
    // logs
    rlpLogs,
  ];
  const encodedReceipt = rlp.encode(rlpReceipt),
    receiptHash = eth.keccak256(encodedReceipt);
  return [`0x${encodedReceipt.toString('hex')}`, `0x${receiptHash.toString('hex')}`];
}

function encodeProof(chainId, status, txHash, blockNumber, blockHash, txIndex, receiptHash, amount) {
  const proofData = Buffer.concat([
    new Buffer(web3.eth.abi.encodeParameters(['uint256', 'uint256'], [chainId, status]).substr(2), 'hex'),
    new Buffer(txHash.substr(2), 'hex'),
    new Buffer(blockNumber.substr(2), 'hex'),
    new Buffer(blockHash.substr(2), 'hex'),
    new Buffer(txIndex.substr(2), 'hex'),
    new Buffer(receiptHash.substr(2), 'hex'),
    new Buffer(amount.substr(2), 'hex'),
  ]);
  const encodedProof = Buffer.concat([
      new Buffer(web3.eth.abi.encodeParameters(['uint256'], [chainId]).substr(2), 'hex'),
      new Buffer(txHash.substr(2), 'hex'),
      new Buffer(blockNumber.substr(2), 'hex'),
      new Buffer(blockHash.substr(2), 'hex'),
      new Buffer(txIndex.substr(2), 'hex'),
      new Buffer(amount.substr(2), 'hex'),
    ]),
    proofHash = eth.keccak256(proofData);
  return [`0x${encodedProof.toString('hex')}`, `0x${proofHash.toString('hex')}`];
}

module.exports = {
  createSimpleTokenMetaData,
  operatorByNetwork,
  nameAndSymbolByNetwork,
  nativeAddressByNetwork,
  simpleTokenProxyAddress,
  encodeTransactionReceipt,
  encodeProof,
};
