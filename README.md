# Aragon Smart Fund DAO

This is a demo app presented at the [Tallinn Blockchain Developers Meetup](https://www.meetup.com/Tallinn-Blockchain-Developers-Meetup/events/263162330/?_xtd=gatlbWFpbF9jbGlja9oAJGViMmRmNTY3LTIzNTUtNDQ3Ny1iMzA1LWE4NjIzYTRhYTQ0Mw)

## What is it?

It is:

- an app that can manage a "mutual fund", which controls inflow and outflow of ether and invest ether into different tokens according to the "investment strategy" written in a smart contract
- integrated with voting module to allow fund owners to agree to the change of the investment strategy

## How to try it?

### Step 0

```
$ npm install
```

### Step 1: Keep ethereum devchain running

```
$ npm run devchain
```

The devchain will be listening to the port `38401`.

### Step 2: Deploy some test tokens and a demo fund strategy factory

```
$ npx truffle migrate --network devchain
...
demoStrategyFactory configuration 0xC56a94cB177B297A9f4fe11781CE4E2eD1829f8B 0xf18107b80000000000000000000000005f4e510503d83bd1a5436bdae2923489da0be454000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000020000000000000000000000006e0745b6b18d0233708554049eeaab0cb81c4ab0000000000000000000000000019f12a7daa44a34cd0ff35055b0e2d4679d85210000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000003c0000000000000000000000000000000000000000000000000000000000000028
...
```

Take note of the logline extracted above, they are important later for setting up the fund.

### Step 3: Deploy a DAO

Deploy an Aragon DAO with Smart Fund App installed using the template.

```
$ npm run aragon:run:ipfs:template
...
    Opening http://localhost:8400/#/0x68bbD37A9826286e0Aa684E24fAc2bAd2c883D9B to view your DAO
...
```

Take note of the DAO address.

### Step 4: Configure the Smart Fund App

* Make sure the browser metamask has custom connection setup at
* Open the deployed DAO address
* Go to "Smart Fund" app
  * In "Strategy proposal" panel, fill in the two variables you got from the step 2 in order
  * Click "Propose Strategy"
  * Click "Request Strategy Approval"
* Go to "Voting" app to have a look of the vote you just created
* Subscribe 0.01 ETH (Do not subsribe more than 1 ETH, there is not enough liquidity in the uniswap for test tokens!)
* And redeem some units
* That's it!

## Having trouble or want to build similar apps?

Contact info@decentral.ee
