import React, { useState } from 'react'
import { useAragonApi } from '@aragon/api-react'
import { Main, Field, TextInput, Button } from '@aragon/ui'
import styled from 'styled-components'
import { fromDecimals, toDecimals } from '../lib/math-utils'

function App() {
  const { api, appState } = useAragonApi()
  const { strategyName, nav, unitPrice, totalUnitCount, unitCount } = appState
  const [strategyFactoryAddress, setStrategyFactoryAddress] = useState('')
  const [strategyConfiguration, setStrategyConfiguration] = useState('')
  const [subscriptionAmount, setSubscriptionAmount] = useState(0)
  const [redemptionAmount, setRedemptionAmount] = useState(0)
  return (
    <Main>
      <BaseLayout>
        <FundInfoPanel>
          <PanelTitle>Fund Info</PanelTitle>
          <FunctionGroup>
            <Info>Strategy: {strategyName}</Info>
            <Info>NAV: {wad4human(nav)} (ETH)</Info>
            <Info>Unit Price: {unitPrice4human(unitPrice)} (ETH) </Info>
            <Info>Total Unit Count: {unitCount4human(totalUnitCount)}</Info>
          </FunctionGroup>
        </FundInfoPanel>

        <InvestorPanel>
          <PanelTitle>For Investors</PanelTitle>
          <FunctionGroup>
            <Info>Unit Count: {unitCount4human(unitCount)}</Info>
            <Info>
              Current Value:{' '}
              {Number(
                fromDecimals(unitCount, 6) * fromDecimals(unitPrice, 12)
              ).toFixed(4)}
              (ETH)
            </Info>
          </FunctionGroup>
          <FunctionGroup>
            <Field label="Subscription Amount (ETH)">
              <TextInput.Number
                value={subscriptionAmount}
                onChange={event => setSubscriptionAmount(event.target.value)}
                wide
              />
            </Field>
            <Button
              mode="secondary"
              onClick={() => subscribeFund(api, subscriptionAmount)}
            >
              Subscribe
            </Button>
          </FunctionGroup>
          <FunctionGroup>
            <Field label="Redemption Amount (ETH)">
              <TextInput.Number
                value={redemptionAmount}
                onChange={event => setRedemptionAmount(event.target.value)}
                wide
              />
            </Field>
            <Button mode="secondary" onClick={() => subscribeFund(api)}>
              Redeem
            </Button>
          </FunctionGroup>
        </InvestorPanel>

        <FundManagerPanel>
          <PanelTitle>For Fund Managers</PanelTitle>
          <FunctionGroup>
            <Field label="Strategy Factory Address">
              <TextInput
                value={strategyFactoryAddress}
                onChange={event =>
                  setStrategyFactoryAddress(event.target.value)
                }
                wide
              />
            </Field>
            <Field label="Strategy Configuration">
              <TextInput
                value={strategyConfiguration}
                onChange={event => setStrategyConfiguration(event.target.value)}
                wide
              />
            </Field>
            <Button
              mode="secondary"
              onClick={() =>
                proposeStrategy(
                  api,
                  strategyFactoryAddress,
                  strategyConfiguration
                )
              }
            >
              Propose Strategy
            </Button>
          </FunctionGroup>
          <FunctionGroup>
            <Button
              mode="secondary"
              onClick={() => requestStrategyApproval(api)}
            >
              Request Strategy Approval
            </Button>
          </FunctionGroup>
          <FunctionGroup>
            <Button mode="secondary" onClick={() => api.decrement(1)}>
              Rebalance
            </Button>
          </FunctionGroup>
        </FundManagerPanel>
      </BaseLayout>
    </Main>
  )
}

const BaseLayout = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 80%;
  margin: auto;
  flex-direction: row;
`

const FundInfoPanel = styled.div`
  width: 100%;
`

const InvestorPanel = styled.div`
  width: 100%;
`

const FundManagerPanel = styled.div`
  width: 100%;
`

const PanelTitle = styled.div`
  font-size: 24px;
  font-weight: bold;
  text-align: center;
`

const Info = styled.h1`
  font-size: 18px;
`

const FunctionGroup = styled.div`
  margin: 10px;
  padding: 20px;
  box-shadow: 10px 10px 5px 0px rgba(0, 0, 0, 0.22);
`

async function proposeStrategy(
  api,
  strategyFactoryAddress,
  strategyConfiguration
) {
  await api
    .proposeStrategy(strategyFactoryAddress, strategyConfiguration)
    .toPromise()
}

async function requestStrategyApproval(api) {
  await api.approveStrategy().toPromise()
}

async function subscribeFund(api, ethAmount) {
  await api.subscribe({ value: toDecimals(ethAmount, 18) })
}

function wad4human(wad) {
  return Number(fromDecimals(wad, 18)).toFixed(4)
}

function unitPrice4human(p) {
  return Number(fromDecimals(p, 12)).toFixed(4)
}

function unitCount4human(p) {
  return Number(fromDecimals(p, 6)).toFixed(4)
}

export default App
