const { assertRevert } = require('@aragon/test-helpers/assertThrow')
const { web3tx } = require('@decentral.ee/web3-test-helpers')

const DemoStrategy = artifacts.require('DemoStrategy')

contract('DemoStrategy', accounts => {
  const admin = accounts[0]
  const fund = accounts[1]
  const investor1 = accounts[2]
  const investor2 = accounts[3]
  let st

  beforeEach(async () => {
    st = await web3tx(DemoStrategy.new, 'DemoStrategy.new')(fund, {
      from: admin,
    })
    await web3tx(st.configure, 'DemoStrategy.configure')([], [], {
      from: fund,
    })
  })

  it('name test', async () => {
    assert.equal(await st.name.call(), 'demo')
  })

  it.only('normal investment flow', async () => {
    await web3tx(st.subscribe, 'st.subscribe')(investor1, {
      from: fund,
      value: web3.utils.toWei('0.01', 'ether'),
    })
  })

  it('rebalance', async () => {
    await st.rebalance({ from: fund })
    await assertRevert(st.rebalance({ from: admin }))
  })
})
