const { assertRevert } = require('@aragon/test-helpers/assertThrow')

const SmartFundApp = artifacts.require('SmartFundApp')
const DemoStrategyFactory = artifacts.require('DemoStrategyFactory')
const DemoStrategy = artifacts.require('DemoStrategy')
const DAOFactory = artifacts.require(
  '@aragon/core/contracts/factory/DAOFactory'
)
const EVMScriptRegistryFactory = artifacts.require(
  '@aragon/core/contracts/factory/EVMScriptRegistryFactory'
)
const ACL = artifacts.require('@aragon/core/contracts/acl/ACL')
const Kernel = artifacts.require('@aragon/core/contracts/kernel/Kernel')

const getContract = name => artifacts.require(name)

const ANY_ADDRESS = '0xffffffffffffffffffffffffffffffffffffffff'

contract('SmartFundApp', accounts => {
  let APP_MANAGER_ROLE, INVESTMENT_ROLE, FUND_MANAGER_ROLE, STRATEGY_CHANGE_ROLE
  let daoFact, appBase, app

  const firstAccount = accounts[0]
  const secondAccount = accounts[1]

  const DemoStrategyContract = new web3.eth.Contract(DemoStrategy.abi)

  before(async () => {
    const kernelBase = await getContract('Kernel').new(true) // petrify immediately
    const aclBase = await getContract('ACL').new()
    const regFact = await EVMScriptRegistryFactory.new()
    daoFact = await DAOFactory.new(
      kernelBase.address,
      aclBase.address,
      regFact.address
    )
    appBase = await SmartFundApp.new()

    // Setup constants
    APP_MANAGER_ROLE = await kernelBase.APP_MANAGER_ROLE()
    INVESTMENT_ROLE = await appBase.INVESTMENT_ROLE()
    FUND_MANAGER_ROLE = await appBase.FUND_MANAGER_ROLE()
    STRATEGY_CHANGE_ROLE = await appBase.STRATEGY_CHANGE_ROLE()
  })

  beforeEach(async () => {
    const daoReceipt = await daoFact.newDAO(firstAccount)
    const dao = await Kernel.at(
      daoReceipt.logs.filter(l => l.event === 'DeployDAO')[0].args.dao
    )
    const acl = await ACL.at(await dao.acl())

    await acl.createPermission(
      firstAccount,
      dao.address,
      APP_MANAGER_ROLE,
      firstAccount,
      {
        from: firstAccount,
      }
    )

    const receipt = await dao.newAppInstance(
      '0x1234',
      appBase.address,
      '0x',
      false,
      { from: firstAccount }
    )

    app = await SmartFundApp.at(
      receipt.logs.filter(l => l.event === 'NewAppProxy')[0].args.proxy
    )

    await acl.createPermission(
      ANY_ADDRESS,
      app.address,
      INVESTMENT_ROLE,
      firstAccount,
      {
        from: firstAccount,
      }
    )
    await acl.createPermission(
      firstAccount,
      app.address,
      FUND_MANAGER_ROLE,
      firstAccount,
      {
        from: firstAccount,
      }
    )
    await acl.createPermission(
      secondAccount,
      app.address,
      STRATEGY_CHANGE_ROLE,
      firstAccount,
      {
        from: firstAccount,
      }
    )
  })

  it('propose and approve strategy', async () => {
    await app.initialize()
    const demoStrategyFactory = await DemoStrategyFactory.new()
    await app.proposeStrategy(
      demoStrategyFactory.address,
      DemoStrategyContract.methods.configure(ANY_ADDRESS, [], []).encodeABI(),
      {
        from: firstAccount,
      }
    )
    await app.approveStrategy({ from: secondAccount })
  })

  it('should fail to approve strategy by wrong account', async () => {
    await app.initialize()
    const demoStrategyFactory = await DemoStrategyFactory.new()
    await app.proposeStrategy(
      demoStrategyFactory.address,
      DemoStrategyContract.methods.configure(ANY_ADDRESS, [], []).encodeABI(),
      {
        from: firstAccount,
      }
    )
    await assertRevert(app.approveStrategy({ from: firstAccount }))
  })

  it('should fail to approve strategy if there is none proposed', async () => {
    await app.initialize()
    await assertRevert(async () => {
      return app.approveStrategy({ from: secondAccount })
    })
  })
})
