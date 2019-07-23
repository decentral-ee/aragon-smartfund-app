import '@babel/polyfill'
import { of } from 'rxjs'
import { first } from 'rxjs/operators'
import AragonApi from '@aragon/api'

const INITIALIZATION_TRIGGER = Symbol('INITIALIZATION_TRIGGER')

const api = new AragonApi()

api.store(
  async (state, event) => {
    let newState

    try {
      switch (event.event) {
        case INITIALIZATION_TRIGGER:
          newState = {
            ...state,
            ...(await fetchFundStaticInfo()),
            ...(await fetchFundNavInfo()),
            ...(await fetchFundInvestorInfo()),
          }
          break
        case 'StrategyProposed':
          break
        case 'StrategyChanged':
          newState = {
            ...state,
            ...(await fetchFundStaticInfo()),
            ...(await fetchFundNavInfo()),
            ...(await fetchFundInvestorInfo()),
          }
          break
        case 'Subscribed':
          newState = {
            ...state,
            ...(await fetchFundNavInfo()),
            ...(await fetchFundInvestorInfo()),
          }
          break
        case 'Redeemed':
          newState = {
            ...state,
            ...(await fetchFundNavInfo()),
            ...(await fetchFundInvestorInfo()),
          }
          break
        default:
          console.log('Unhandled event', event.event)
          newState = state
      }
    } catch (e) {
      console.error('script failed', event.event, e)
    }

    return newState
  },
  [
    // Always initialize the store with our own home-made event
    of({ event: INITIALIZATION_TRIGGER }),
  ]
)

async function fetchFundStaticInfo() {
  return {
    strategyName: await api.call('strategyName').toPromise(),
  }
}

async function fetchFundNavInfo() {
  return {
    unitPrice: await api.call('unitPrice').toPromise(),
    nav: await api.call('nav').toPromise(),
    totalUnitCount: await api.call('totalUnitCount').toPromise(),
  }
}

async function fetchFundInvestorInfo() {
  return {
    unitCount: await api
      .call(
        'unitCount',
        (await api
          .accounts()
          .pipe(first())
          .toPromise())[0]
      )
      .toPromise(),
  }
}
