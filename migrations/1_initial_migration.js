var Migrations = artifacts.require('./Migrations.sol')

function wad4human(wad) {
  return Number(web3.utils.fromWei(wad, 'ether')).toFixed(4)
}

module.exports = function(deployer, network, accounts) {
  deployer.then(async () => {
    const admin = accounts[0]

    console.log('admin address: ', admin)
    console.log(
      'admin eth balance: ',
      wad4human(await web3.eth.getBalance(admin))
    )
    deployer.deploy(Migrations, { from: admin })
  })
}
