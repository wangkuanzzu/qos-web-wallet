import { getCurrentAccount } from '../../business/auth'
import store from '@/store'
import * as types from '@/store/mutation-types'
// import { ToPage } from '../../business/types'
import {
  isNotEmpty
} from '../../utils'
const extension = require('extensionizer')

// 非登录权限下使用
const whiteListPage = ['/login/login', '/register/register', '/wallet/create', '/wallet/result', '/wallet/import']
// const whiteListPage = ['/login', '/register', '/transfer', '/newwallet', '/newwalletresult', '/importwalletwithseed', '/homepage', '/delegateorunbond', '/txresult', '/accountlist', '/newaccount', '/importaccount']

// 获取backgroud.js中store中的state
const bg = extension.extension.getBackgroundPage()
const bgState = bg.getBgState()
store.commit(types.CLONE_STATE, { keyArr: ['msgQueue', 'accounts'], bgState })

export async function beforeEach (to, from, next) {
  // const first = await bg.getFirstMsg()
  const first = store.getters.getFirstMsg
  console.log('store.getters.firstMsg', store.getters.firstMsg)
  const accounts = store.getters.getAccounts
  // 请增加登录校验
  if (!accounts.length === 0 && whiteListPage.indexOf(to.path) === -1) {
    console.log('real to page name', to.name)
    // const accList = getAccountList()
    const acc = getCurrentAccount()
    // if (!accList || accList.length === 0) {
    if (!acc) {
      next('/register/register')
      return
    }
    next('/login/login')
    return
  }

  if (isNotEmpty(first)) {
    const data = first.params
    if (isNotEmpty(data.pageName) && !first.hasDirect) {
      // 更新当前first data 为已跳转页面状态
      store.commit(types.HAS_DIRECT_PAGE)
      next({
        name: data.pageName
      })
      return
    }
  }
  // const toPage = await store.dispatch('getToPage')
  // if (isNotEmpty(toPage.pageName)) {
  //   next({ name: toPage.pageName })
  //   return
  // }
  // alert(getToken())

  next()
}
