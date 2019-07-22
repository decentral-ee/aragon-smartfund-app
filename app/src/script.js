import '@babel/polyfill'
import { of } from 'rxjs'
import AragonApi from '@aragon/api'

const INITIALIZATION_TRIGGER = Symbol('INITIALIZATION_TRIGGER')

const api = new AragonApi()

api.store(
  async (state, event) => {
    let newState

    switch (event.event) {
      case INITIALIZATION_TRIGGER:
        console.log('!!!! INITIALIZATION_TRIGGER 1')
        newState = {
          strategy: await api.call('strategyName').toPromise(),
        }
        console.log('!!!! INITIALIZATION_TRIGGER 2', newState)
        break
      case 'StrategyChanged':
        newState = {
          strategy: await api.call('strategyName').toPromise(),
          unitPrice: await api.call('unitPrice').toPromise(),
          nav: await api.call('nav').toPromise(),
        }
        break
      default:
        newState = state
    }

    return newState
  },
  [
    // Always initialize the store with our own home-made event
    of({ event: INITIALIZATION_TRIGGER }),
  ]
)
