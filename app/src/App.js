import React from 'react'
import { useAragonApi } from '@aragon/api-react'
import { Main, Button } from '@aragon/ui'
import styled from 'styled-components'

function App() {
  const { api, appState } = useAragonApi()
  const { strategy, nav, syncing } = appState
  return (
    <Main>
      <BaseLayout>
        {syncing && <Syncing />}
        <Strategy>Strategy: {strategy}</Strategy>
        <Nav>NAV: {nav}</Nav>
        <Buttons>
          <Button mode="secondary" onClick={() => api.decrement(1)}>
            Subscribe
          </Button>
          <Button mode="secondary" onClick={() => api.increment(1)}>
            Redeem
          </Button>
        </Buttons>
        <Buttons>
          <Button mode="secondary" onClick={() => setStrategy(api)}>
            Set Strategy
          </Button>
          <Button mode="secondary" onClick={() => api.decrement(1)}>
            Rebalance
          </Button>
        </Buttons>
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

const Nav = styled.h1`
  font-size: 30px;
`

const Strategy = styled.h1`
  font-size: 30px;
`

const Buttons = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-gap: 40px;
  margin-top: 20px;
`

const Syncing = styled.div.attrs({ children: 'Syncing…' })`
  position: absolute;
  top: 15px;
  right: 20px;
`

async function setStrategy(api) {
  await api.proposeStrategy('unicorn').toPromise()
  await api.approveStrategy().toPromise()
}

export default App
