const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'
const CHAINING_ERROR = 'Chaining cycle detected for promise #<Promise>'
const PASSING_VALUE_ERROR = `is not iterable (cannot read property Symbol(Symbol.iterator))`

const isMyPromise = x => x instanceof MyPromise

const resolvePromise = (innerPromise, x, resolve, reject) => {
  // 自己返回自己(循环调用)则报错
  if (innerPromise === x) { return reject(new TypeError(CHAINING_ERROR)) }
  // 是promise对象则向下传递
  if (isMyPromise(x)) { x.then(resolve, reject) }
  // 普通值直接resolve
  else { resolve(x) }
}

const rejectWhenTypeUnvalid = (reject, array) => {
  // 传入参数不存在或array.length不存在则报错
  if (!array || array.length === undefined) {
    return reject(new TypeError(`${array} ${PASSING_VALUE_ERROR}`))
  }
}

class MyPromise {
  constructor(executor) {
    try {
      executor(this.resolve, this.reject)
    } catch(e) {
      // 处理执行器错误
      this.reject(e)
    }
  }

  // promise 状态
  status = PENDING
  // 成功后的值
  value = undefined
  // 失败后的原因
  reason = undefined
  // 成功回调
  successCallback = []
  // 失败回调
  failCallback = []

  changeFromPending = (status, value) => {
    // 非pending状态不可向下执行
    if (this.status !== PENDING) { return }
    // 改变状态
    this.status = status
    // 保存传入的值
    const valueKey = status === FULFILLED ? 'value' : 'reason'
    this[valueKey] = value
    // 判断回调是否存在，存在即调用
    const callbackKey = status === FULFILLED ? 'successCallback' : 'failCallback'
    // 如果有回调存在，依次执行并删除（异步代码）
    while(this[callbackKey].length) { this[callbackKey].shift()() }
  }

  resolve = value => this.changeFromPending(FULFILLED, value)
  reject = reason => this.changeFromPending(REJECTED, reason)

  then(successCallback, failCallback) {
    // 返回Promise，实现链式调用
    const innerPromise = new MyPromise((resolve, reject) => {
      // 用异步代码，在所有同步代码执行结束后在执行（等待innerPromise生成后再执行）
      const asyncResolvePromise = x => setTimeout(() => {
        try {
          resolvePromise(innerPromise, x, resolve, reject)
        } catch(e) {
          reject(e)
        }
      }, 0)
      
      const success = () => {
        // 调用then方法可以不传参数，直到传递到有回调方法的then
        successCallback = successCallback || (value => value)
        asyncResolvePromise(successCallback(this.value))
      }
      const fail = () => {
        // 无失败回调则继续传递reason
        failCallback = failCallback || (reason => { throw reason })
        asyncResolvePromise(failCallback(this.reason))
      }

      if (this.status === FULFILLED) {
        success()
      } else if (this.status === REJECTED) {
        fail()
      } else {
        // pending，将成功/失败回调存储起来
        this.successCallback.push(success)
        this.failCallback.push(fail)
      }
    })
    return innerPromise
  }

  catch(failCallback) {
    return this.then(undefined, failCallback)
  }

  finally(callback) {
    // 执行指定的回调函数，并返回Promise
    const final = cb => MyPromise.resolve(callback()).then(cb)
    return this.then(
      value => final(() => value),
      reason => final(() => { throw reason })
    )
  }

  static all(array) {
    let result = []
    let index = 0

    return new MyPromise((resolve, reject) => {
      // 处理TypeError
      rejectWhenTypeUnvalid(reject, array)
      // 处理[]
      if (array.length === 0) { return resolve([]) }
      
      // 存值，并计数，直到计数器的值等于array.length
      const addData = (key, value) => {
        // 把值存入对应位置
        result[key] = value
        // 计数+1
        index++
        // 所有参数都执行完成后，resolve
        if (index === array.length) { resolve(result) }
      }

      for (let i in array) {
        const current = array[i]
        // 传入key值
        const addValue = value => addData(i, value)
        if (isMyPromise(current)) {
          // 执行完promise后，把返回的值保存
          current.then(addValue, reject)
        } else {
          // 直接存储
          addValue(current)
        }
      }
    })
  }

  static race(array) {
    return new MyPromise((resolve, reject) => {
      // 处理TypeError
      rejectWhenTypeUnvalid(reject, array)
      // 处理[]
      if (array.length === 0) { return }
      // 遍历array
      for (let i of array) {
        if (isMyPromise(i)) {
          // 如果传入promise，运行后向下传递
          i.then(resolve, reject)
        } else {
          // 直接向下传递
          return resolve(i)
        }
      }
    })
  }

  static resolve(value) {
    // 接收promise继续向下传递
    if (isMyPromise(value)) { return value }
    return new MyPromise(resolve => resolve(value))
  }

  static reject(reason) {
    return new MyPromise((_, reject) => reject(reason))
  }
}

module.exports = MyPromise