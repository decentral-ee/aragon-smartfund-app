function wad4human(wad) {
  return Number(web3.utils.fromWei(wad, 'ether')).toFixed(4)
}

module.exports = function(deployer, network, accounts) {
  const MAX_DEADLINE = '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
  const admin = accounts[0]

  deployer.then(async () => {
    global.web3 = web3
    const { web3tx } = require('@decentral.ee/web3-test-helpers')
    const DemoStrategy = artifacts.require('DemoStrategy')
    const DemoStrategyContract = new web3.eth.Contract(DemoStrategy.abi)
    const DemoStrategyFactory = artifacts.require('DemoStrategyFactory')
    const TruffleContract = require('truffle-contract')
    const { UniswapFactory, UniswapExchange } = require('../uniswap')
    const ERC20Mintable = TruffleContract(
      require('openzeppelin-solidity/build/contracts/ERC20Mintable.json')
    )
    const TestContracts = artifacts.require('TestContracts')

    const contracts = [UniswapFactory, UniswapExchange, ERC20Mintable]
    contracts.forEach(c => {
      c.setProvider(web3.currentProvider)
    })

    const demoStrategyFactory = await deployer.deploy(DemoStrategyFactory, {
      from: admin,
    })
    console.log('demoStrategyFactory.address', demoStrategyFactory.address)

    if (network === 'devchain' || network === 'test') {
      const testContracts = await deployer.deploy(TestContracts)

      const exchangeTemplate = await UniswapExchange.new({ from: admin })
      console.log('exchangeTemplate.address:', exchangeTemplate.address)

      const uniswapFactory = await UniswapFactory.new({ from: admin })
      console.log('uniswapFactory.address:', uniswapFactory.address)
      await uniswapFactory.initializeFactory(exchangeTemplate.address, {
        from: admin,
      })
      await testContracts.set('uniswapFactory', uniswapFactory.address)

      const tokenAmount = web3.utils.toWei('1000', 'ether')
      const tokens = ['testTokenA', 'testTokenB']
      const tokenAddresses = []
      const tokenSetups = tokens.map(tokenName => async () => {
        const token = await ERC20Mintable.new({ from: admin })
        tokenAddresses.push(token.address)
        await testContracts.set(tokenName, token.address)
        console.log(`${tokenName}.address:`, token.address)

        console.log(`${tokenName} minting...`)
        await token.mint(admin, tokenAmount, { from: admin })
        console.log(
          `${tokenName} balanceOf(admin)`,
          wad4human(await token.balanceOf.call(admin))
        )

        console.log(`${tokenName} creating exchange...`)
        await uniswapFactory.createExchange(token.address, {
          from: admin,
        })
        const exchangeAddress = await uniswapFactory.getExchange.call(
          token.address
        )
        console.log(`${tokenName} exchange created at`, exchangeAddress)
        const exchange = await UniswapExchange.at(exchangeAddress)

        console.log(`${tokenName} approving...`)
        await token.approve(exchangeAddress, tokenAmount, { from: admin })
        console.log(
          `${tokenName} allowance(admin -> exchange)`,
          wad4human(await token.allowance.call(admin, exchangeAddress))
        )

        await web3tx(
          exchange.addLiquidity,
          `${tokenName} exchange.addLiquidity`
        )(0, tokenAmount, MAX_DEADLINE, {
          from: admin,
          gas: 2000000,
          value: web3.utils.toWei('1', 'ether'),
        })
      })

      await (async () => {
        for (let i = 0; i < tokenSetups.length; ++i) {
          await tokenSetups[i]()
        }
      })()

      console.log(
        'demoStrategyFactory configuration',
        demoStrategyFactory.address,
        DemoStrategyContract.methods
          .configure(uniswapFactory.address, tokenAddresses, [60, 40])
          .encodeABI()
      )
    }
  })
}
