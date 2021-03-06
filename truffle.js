/**
 * https://github.com/aragon/aragonOS/blob/v4.0.0/truffle-config.js
 */
const homedir = require('homedir')
const path = require('path')

const HDWalletProvider = require('truffle-hdwallet-provider')
const HDWalletProviderPrivkey = require('truffle-hdwallet-provider-privkey')

const DEFAULT_MNEMONIC =
  'ill song party come kid carry calm captain state purse weather ozone'

const defaultRPC = network =>
  `https://${network}.infura.io/v3/052ac227a2994b69aaf6f5914b4e35c5`

const configFilePath = filename => path.join(homedir(), `.aragon/${filename}`)

const mnemonic = () => {
  try {
    return require(configFilePath('mnemonic.json')).mnemonic
  } catch (e) {
    return DEFAULT_MNEMONIC
  }
}

const settingsForNetwork = network => {
  try {
    return require(configFilePath(`${network}_key.json`))
  } catch (e) {
    return {}
  }
}

// Lazily loaded provider
const providerForNetwork = network => () => {
  let { rpc, keys } = settingsForNetwork(network)
  rpc = rpc || defaultRPC(network)

  if (!keys || keys.length === 0) {
    return new HDWalletProvider(mnemonic(), rpc)
  }

  return new HDWalletProviderPrivkey(keys, rpc)
}
module.exports = {
  networks: {
    devchain: {
      network_id: '*',
      host: 'localhost',
      port: 38401,
    },
    mainnet: {
      network_id: 1,
      provider: providerForNetwork('mainnet'),
    },
    rinkeby: {
      network_id: 4,
      provider: providerForNetwork('rinkeby'),
    },
    coverage: {
      host: 'localhost',
      network_id: '*',
      port: 8555,
      gas: 0xffffffffff,
      gasPrice: 0x01,
    },
  },
  compilers: {
    solc: {
      version: '0.4.24', // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true, // Use what you've installed locally with docker (default: false)
      settings: {
        // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: true,
          runs: 200,
        },
        // evmVersion: "byzantium"
      },
    },
  },
}
