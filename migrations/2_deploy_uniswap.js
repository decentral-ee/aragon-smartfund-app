module.exports = function(deployer, network, accounts) {
  deployer.then(async () => {
    const { UniswapFactory, UniswapExchange } = require('../uniswap')
    const TruffleContract = require('truffle-contract')
    const ERC20Mintable = TruffleContract(
      require('openzeppelin-solidity/build/contracts/ERC20Mintable.json')
    )

    UniswapFactory.setProvider(web3.currentProvider)
    UniswapExchange.setProvider(web3.currentProvider)
    ERC20Mintable.setProvider(web3.currentProvider)

    if (network === 'development') {
      const exchangeTemplate = await UniswapExchange.new({ from: accounts[0] })
      console.log('exchangeTemplate.address:', exchangeTemplate.address)

      const uniswapFactory = await UniswapFactory.new({ from: accounts[0] })
      console.log('uniswapFactory.address:', uniswapFactory.address)
      uniswapFactory.initializeFactory(exchangeTemplate.address)

      const testToken = await ERC20Mintable.new({ from: accounts[0] })
      console.log('testToken.address:', testToken.address)
    }
  })
}
