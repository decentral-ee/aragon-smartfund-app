import React, { useState } from 'react'
import { useAragonApi } from '@aragon/api-react'
import { Main, Field, TextInput, Button } from '@aragon/ui'
import styled from 'styled-components'

function App() {
  const { api, appState } = useAragonApi()
  const { strategyName, nav, syncing } = appState
  const [strategyFactoryAddress, setStrategyFactoryAddress] = useState('')
  const [strategyConfiguration, setStrategyConfiguration] = useState('')
  return (
    <Main>
      <BaseLayout>
        {syncing && <Syncing />}

        <Info>Strategy: {strategyName}</Info>
        <Info>NAV: {nav}</Info>

        <h2>For investors:</h2>
        <FunctionGroup>
          <LayoutGroup>
            <Button mode="secondary" onClick={() => api.decrement(1)}>
              Subscribe
            </Button>
          </LayoutGroup>
        </FunctionGroup>
        <FunctionGroup>
          <LayoutGroup>
            <Button mode="secondary" onClick={() => api.increment(1)}>
              Redeem
            </Button>
          </LayoutGroup>
        </FunctionGroup>
        <hr />

        <h2>For fund managers:</h2>
        <FunctionGroup>
          <LayoutGroup>
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
          </LayoutGroup>
          <LayoutGroup>
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
          </LayoutGroup>
        </FunctionGroup>
        <FunctionGroup>
          <LayoutGroup>
            <Button
              mode="secondary"
              onClick={() => requestStrategyApproval(api)}
            >
              Request Strategy Approval
            </Button>
          </LayoutGroup>
        </FunctionGroup>
        <FunctionGroup>
          <LayoutGroup>
            <Button mode="secondary" onClick={() => api.decrement(1)}>
              Rebalance
            </Button>
          </LayoutGroup>
        </FunctionGroup>
      </BaseLayout>
    </Main>
  )
}

const BaseLayout = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  flex-direction: column;
`

const Info = styled.h1`
  font-size: 30px;
`

const LayoutGroup = styled.div`
  border: none;
  display: grid;
  grid-auto-flow: column;
  grid-gap: 40px;
  margin-top: 20px;
`

const FunctionGroup = styled.div`
  margin: 10px;
  display: grid;
  border: 1px solid;
`

const Syncing = styled.div.attrs({ children: 'Syncing…' })`
  position: absolute;
  top: 15px;
  right: 20px;
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

export default App
