import axios from 'axios'
axios.defaults.timeout = 5000
axios.defaults.headers.post['Content-Type'] = 'application/x-www=form-urlencoded'
// 用promise封装请求方法 方便调用的时候使用then回调函数
export default {
  fetchGet (url, params) {
    return new Promise((resolve, reject) => {
      axios.get(url, {params}).then(res => {
        resolve(res.data) // 回调函数在异步操作成功时调用，并将异步操作的结果，作为参数传递出去(return回去)
      }).catch(error => {
        reject(error)
      })
    })
  },
  fetchPost (url, params) {
    return new Promise((resolve, reject) => {
      axios.post(url, params).then(res => {
        // r ==> resolve是由promise这个提供不是axios所以是（并将异步操作的结果，作为参数传递出去）传递给promise的
        // 一直误会成是由axios提供的resolve 然后传递是传递给axios axios应该return回去 实际不是的
        resolve(res.data)
      }).catch(error => {
        reject(error)
      })
    })
  }
}
