const TruffleContract = require('truffle-contract')
const { UniswapFactory, UniswapExchange } = require('../uniswap')
const ERC20Mintable = TruffleContract(
  require('openzeppelin-solidity/build/contracts/ERC20Mintable.json')
)
const TestContracts = artifacts.require('TestContracts')

const { assertRevert } = require('@aragon/test-helpers/assertThrow')
const { web3tx } = require('@decentral.ee/web3-test-helpers')

const DemoStrategy = artifacts.require('DemoStrategy')

function wad4human(wad) {
  return Number(web3.utils.fromWei(wad, 'ether')).toFixed(4)
}

function unitPrice4human(price) {
  return Number(web3.utils.fromWei(price, 'szabo')).toFixed(6)
}

function unitCountBN(count) {
  return web3.utils.toBN(web3.utils.toWei(count.toString(), 'mwei'))
}

function unitCount4human(count) {
  return Number(web3.utils.fromWei(count, 'mwei')).toFixed(6)
}

contract('DemoStrategy', accounts => {
  const admin = accounts[0]
  const fund = accounts[1]
  const investor1 = accounts[2]
  const investor2 = accounts[3]
  let uniswapFactory
  let tokenA
  let exchangeA
  let tokenB
  let exchangeB
  let st

  before(async () => {
    const contracts = [UniswapFactory, UniswapExchange, ERC20Mintable]
    const testContracts = await TestContracts.deployed()
    contracts.forEach(c => c.setProvider(web3.currentProvider))
    uniswapFactory = await UniswapFactory.at(
      await testContracts.get.call('uniswapFactory')
    )
    tokenA = await ERC20Mintable.at(await testContracts.get.call('testTokenA'))
    exchangeA = await UniswapExchange.at(
      await uniswapFactory.getExchange.call(tokenA.address)
    )
    tokenB = await ERC20Mintable.at(await testContracts.get.call('testTokenB'))
    exchangeB = await UniswapExchange.at(
      await uniswapFactory.getExchange.call(tokenB.address)
    )
  })

  beforeEach(async () => {
    st = await web3tx(DemoStrategy.new, 'DemoStrategy.new')(fund, {
      from: admin,
    })
    await web3tx(st.configure, 'DemoStrategy.configure')(
      uniswapFactory.address,
      [tokenA.address, tokenB.address],
      [40, 60],
      {
        from: fund,
      }
    )
  })

  async function printSt() {
    console.log(
      'tokenA.balanceOf(st)',
      wad4human(await tokenA.balanceOf.call(st.address))
    )
    console.log(
      'tokenB.balanceOf(st)',
      wad4human(await tokenB.balanceOf.call(st.address))
    )
    console.log(
      'web3.eth.getBalance(st)',
      wad4human(await web3.eth.getBalance(st.address))
    )
    console.log('st.nav', wad4human(await st.nav.call()))
    console.log('st.unitPrice', unitPrice4human(await st.unitPrice.call()))
    console.log(
      'st.totalUnitCount',
      unitCount4human(await st.totalUnitCount.call())
    )
    console.log(
      'st.unitCount(investor1)',
      unitCount4human(await st.unitCount.call(investor1))
    )
    console.log(
      'st.unitCount(investor2)',
      unitCount4human(await st.unitCount.call(investor2))
    )
  }

  it('name test', async () => {
    assert.equal(await st.name.call(), 'demo')
  })

  it('normal investment flow', async () => {
    await printSt()
    assert.equal(unitPrice4human(await st.unitPrice.call()), '0.001000')
    assert.isTrue(web3.utils.toBN('0').eq(await st.totalUnitCount.call()))
    assert.isTrue(web3.utils.toBN('0').eq(await st.nav.call()))

    await web3tx(st.subscribe, 'st.subscribe(0.01) by investor1')(investor1, {
      from: fund,
      value: web3.utils.toWei('0.01', 'ether'),
    })
    await web3tx(st.subscribe, 'st.subscribe(0.01) by investor2')(investor2, {
      from: fund,
      value: web3.utils.toWei('0.01', 'ether'),
    })
    await printSt()
    assert.isTrue((await st.unitCount.call(investor1)).gte(unitCountBN(10)))
    assert.isTrue((await st.unitCount.call(investor2)).gte(unitCountBN(10)))

    const balanceBefore = web3.utils.toBN(await web3.eth.getBalance(investor1))
    console.log('investor1 balance before:', wad4human(balanceBefore))
    await web3tx(st.redeem, 'st.redeem(0.005) by investor1')(
      investor1,
      unitCountBN(5),
      {
        from: fund,
      }
    )
    await printSt()
    const balanceAfter = web3.utils.toBN(await web3.eth.getBalance(investor1))
    console.log('investor1 balance after:', wad4human(balanceAfter))
    assert.isTrue(
      balanceAfter
        .sub(balanceBefore)
        .gte(web3.utils.toBN(web3.utils.toWei('0.0045', 'ether')))
    )
  })

  // it('rebalance', async () => {
  //   await st.rebalance({ from: fund })
  //   await assertRevert(st.rebalance({ from: admin }))
  // })
})
