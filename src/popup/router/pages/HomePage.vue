<template>
  <div class="homepage-wrap">
    <div class="home-top-info">
      <div class="contents-head">
        <div class="div-left">
          <span class="link-wrap" @click="accNameModify">{{ userName }}</span>
        </div>
        <div @click="showAccountList" class="link-wrap div-right">
          <i class="el-icon-setting" title="账户设置"></i>
        </div>
      </div>
      <div class="contents-head">
        <div class="div-left">
          <span>{{ addressDisplay }}</span>
        </div>
        <div class="div-right">
          <i class="el-icon-document-copy btn" :data-clipboard-text="address" title="复制"></i>
        </div>
      </div>
    </div>
    <div>
      <el-tabs v-model="activeName" type="card" @tab-click="handleClick" stretch>
        <el-tab-pane label="我的资产" name="balance">
          <div>
            <div class="text-wrap">
              <div class="text-title">QOS</div>
              <div>
                <span class="number-style">{{ qos }}</span>
                <el-link :href="accountDetail" target="_blank">
                  <i class="el-icon-link"></i>
                </el-link>
              </div>
              <div class="btn-wrap">
                <el-button type="primary" size="small" plain @click="transfer('QOS')">转账</el-button>
                <el-button type="primary" size="small" plain @click="approve('QOS')">预授权</el-button>
              </div>
              <el-divider width="80%"></el-divider>
            </div>
          </div>

          <div v-for="qcp in qcps" :key="qcp">
            <div class="text-wrap">
              <div class="text-title">{{ qcp.coin_name }}</div>
              <div class="link-wrap">
                <span class="number-style">{{ qcp.amount }}</span>
                <el-link :href="accountDetail" target="_blank">
                  <i class="el-icon-link"></i>
                </el-link>
              </div>
              <div class="btn-wrap">
                <el-button type="primary" size="small" plain @click="transfer([qcp.coin_name])">转账</el-button>
                <el-button type="primary" size="small" plain @click="approve([qcp.coin_name])">预授权</el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="我的委托" name="delegation">
          <div v-for="(delegation, index) in delegations" :key="index">
            <div class="div-contents">
              <div class="logo-div">
                <el-image class="logo-image" :src="delegation.logo"></el-image>
              </div>
              <div class="text-detail">
                <div class="div-contents">
                  <span>{{ delegation.moniker }}</span>
                  <el-link :href="delegation.validatorUrl" target="_blank">
                    <i class="el-icon-link"></i>
                  </el-link>
                </div>
                <div class="div-contents">
                  <span>
                    {{ delegation.validator_address }}
                  </span>
                </div>
              </div>
            </div>

            <div class="text-row">
              <span>委托金额：{{ delegation.delegate_amount }}</span>
            </div>
            <div class="btn-operate">
              <el-button
                type="primary"
                size="mini"
                plain
                @click="delegateorunbond('delegate', qos.toString(), delegation)"
              >追加</el-button>
              <el-button
                type="primary"
                size="mini"
                plain
                @click="delegateorunbond('unbond', qos.toString(), delegation)"
              >撤回</el-button>
            </div>

            <div class="text-row">
              <span>复投方式：{{ delegation.is_compound ? "已复投" : "未复投" }}</span>
            </div>
            <div class="btn-operate">
              <el-button
                type="primary"
                size="mini"
                plain
                @click="modifyCompound(delegation.is_compound, qos.toString(), delegation)"
              >更改</el-button>
            </div>

            <el-divider class="line-divider"></el-divider>
          </div>

          <div class="text-wrap">
            <el-button icon="el-icon-plus" circle @click="createDelegation" title="新增委托"></el-button>
          </div>
        </el-tab-pane>
        <el-tab-pane label="我的授权" name="approve" class="tab-info">暂不支持该功能！</el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script>
import { rpc, qoschain } from '@/utils/rpc'
import { mapState } from 'vuex'
import store from '@/store'
import { numFor4Decimal } from '@/utils/index'
import ClipboardJS from 'clipboard'

export default {
  data () {
    const index = store.getters.accounts.findIndex(
      x => x.address === store.getters.currentAccount.address
    )
    return {
      activeName:
        this.$route.params.activeName == null
          ? 'balance'
          : this.$route.params.activeName,
      currentAccount: store.getters.accounts[index],
      userName: store.getters.currentAccount.name,
      address: store.getters.currentAccount.address,
      addressDisplay: store.getters.currentAccount.address.substring(0, 15) + '......' + store.getters.currentAccount.address.slice(-12),
      qos: 0,
      qcps: [],
      delegations: [],
      clipboard: new ClipboardJS('.btn'),
      accountDetail: qoschain + '/account?addr=' + store.getters.currentAccount.address
    }
  },
  computed: {
    ...mapState({
      // currentAccount: store.getters.currentAccount
    })
  },
  created () {},
  mounted () {
    // console.log('store.getters.currentAccount:', store.getters.currentAccount)
    // 打开页面默认加载我的资产导航栏
    this.getAccount(this.$data.address)
    this.getDelegations(this.$data.address)

    let _this = this
    this.clipboard.on('success', function (e) {
      // console.info('Action:', e.action)
      // console.info('Text:', e.text)
      // console.info('Trigger:', e.trigger)
      e.clearSelection()
      _this.$message({
        showClose: true,
        message: '复制成功',
        type: 'info',
        center: true,
        duration: 500
      })
    })
  },
  beforeDestroy () {
    this.clipboard.destroy()
  },
  methods: {
    getAccount (address) {
      const account = rpc.recoveryAccountByPrivateKey(
        this.currentAccount.privateKey
      )
      const res = account.queryAccount(address)
      res
        .then(result => {
          if (result.status === 200) {
            this.$data.qos = numFor4Decimal(result.data.value.qos)
            this.$data.qcps = result.data.value.qcps
          } else {
            this.$message({
              showClose: true,
              message: '账户信息查询失败,请重试!',
              type: 'warning'
            })
          }
        })
        .catch(error => {
          console.log('您访问的信息不存在!  error:', error)
        })
    },
    getDelegations (address) {
      // 刷新委托信息
      this.delegations = []
      const account = rpc.recoveryAccountByPrivateKey(
        this.currentAccount.privateKey
      )
      const res = account.queryDelagationAll(address)
      res
        .then(async result => {
          if (result.status === 200) {
            for (var i = 0; i < result.data.length; i++) {
              await this.getValidator(result.data, i)
            }
          } else {
            this.$message({
              showClose: true,
              message: '委托信息查询失败,请重试!',
              type: 'warning'
            })
          }
        })
        .catch(error => {
          console.log('您访问的信息不存在!  error:', error)
        })
    },
    getValidator (delegation, i) {
      const account = rpc.recoveryAccountByPrivateKey(
        this.currentAccount.privateKey
      )
      const res = account.queryValidatorOne(delegation[i].validator_address)
      res
        .then(result => {
          if (result.status === 200) {
            this.delegations.push({
              logo: result.data.description.logo,
              moniker: result.data.description.moniker,
              validator_address: delegation[i].validator_address,
              delegate_amount: numFor4Decimal(delegation[i].delegate_amount),
              is_compound: delegation[i].is_compound,
              validatorUrl: qoschain + '/validators/detail?addr=' + delegation[i].validator_address + '&validators=' + result.data.description.moniker
            })
          } else {
            this.$message({
              showClose: true,
              message: '委托信息查询失败,请重试!',
              type: 'warning'
            })
          }
        })
        .catch(error => {
          console.log('您访问的信息不存在!  error:', error)
        })
    },
    handleClick (tab, event) {
      if (tab.name === 'delegation') {
        this.getDelegations(this.$data.address)
      } else if (tab.name === 'balance') {
        this.getAccount(this.$data.address)
      } else {
        console.log('other tab !')
      }
    },
    showAccountList () {
      // console.log("showAccountList!");
      this.$router.push({ name: 'accountlist' })
    },
    transfer (coinName) {
      if (!coinName) {
        coinName = 'QOS'
      }
      this.$router.push({ name: 'transfer', params: { coin: coinName } })
    },
    approve (coinType) {
      if (!coinType) {
        coinType = 'QOS'
      }
      this.$message({
        showClose: true,
        message: '暂不支持该功能!',
        type: 'warning'
      })
    },
    createDelegation (qos) {
      this.$router.push({
        name: 'validatorlist'
      })
    },
    delegateorunbond (operation, qos, delegation) {
      this.$router.push({
        name: 'delegateorunbond',
        params: { amount: qos, operation: operation, delegation: delegation }
      })
    },
    modifyCompound (isCompound, qos, delegation) {
      this.$router.push({
        name: 'modifycompound',
        params: {
          amount: qos,
          iscompound: isCompound,
          delegation: delegation
        }
      })
    },
    accNameModify () {
      this.$router.push({
        name: 'accountmodify',
        params: {
          name: this.userName
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import "~style/common.scss";
.homepage-wrap {
  @include common-container;
  box-sizing: border-box;
}
span {
  word-break: break-all;
  word-wrap: break-word;
}
.span_account {
  font-size: 16px;
  width: 280px;
  display: block;
  text-overflow: ellipsis !important;
  overflow: hidden !important;
  white-space: nowrap;
  float: left;
}
.el-icon-document-copy {
  font-size: 22px;
  // margin-top: 20px;
  cursor: pointer;
}
.el-icon-more {
  cursor: pointer;
}
.home-top-info {
  background: rgba(50, 115, 200, 1);
  height: 125px;
  color: #ffffff;
  // border-radius: 6px;
  padding: 0 8px;
}
.text-wrap {
  line-height: 1.5;
  text-align: center;
}
.text-title {
  font-size: 24px;
  font-weight: 300;
}
.btn-wrap {
  margin-top: 10px;
}
.link-wrap {
  cursor: pointer;
}
.number-style {
  font-size: 30px;
}
.logo-div{
  width: 100px;
  height: 100px;
  position: relative;
}
.logo-image {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
}
.text-detail {
  width: 230px;
}
.div-contents {
  display: flex;
  margin: 10px 5px;
}
.text-row {
  float: left;
  margin: 10px 10px;
  width: 200px;
}
.btn-operate {
  float: right;
  margin: 0px 5px;
  height: 30px;
}
.line-divider {
  margin-top: 80px;
}
.tab-info{
  text-align: center;
}
.contents-head{
  display: flex;
}
.div-left{
  margin-top: 20px;
  width: 95%;
  font-size: 20px;
  font-weight: 100
}
.div-right{
  margin-top: 20px;
  font-size: 20px;
  font-weight: 100
}
</style>
