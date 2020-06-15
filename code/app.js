const fp = require('lodash/fp')
const { Maybe, Container } = require('./support')

// provided data & function
const cars = [
  { name: 'Ferrari FF', horsepower: 660, dollar_value: 700000, in_stock: true },
  { name: 'Spyker C12 Zagato', horsepower: 650, dollar_value: 648000, in_stock: false },
  { name: 'Jaguar XKR-S', horsepower: 550, dollar_value: 132000, in_stock: false },
  { name: 'Audi R8', horsepower: 525, dollar_value: 114200, in_stock: false },
  { name: 'Aston Martin One-77', horsepower: 750, dollar_value: 1850000, in_stock: true },
  { name: 'Pagani Huayra', horsepower: 700, dollar_value: 1300000, in_stock: false },
]
let _average = function (xs) {
  return fp.reduce(fp.add, 0, xs) / xs.length
}
let _underscore = fp.replace(/\W+/g, '_')
let maybe = Maybe.of([5, 6, 1])
let xs = Container.of(['do', 'ray', 'me', 'fa', 'so', 'la', 'ti', 'do'])
let safeProp = fp.curry(function(x,o) {
  return Maybe.of(o[x])
})
let user = { id: 2, name: 'Albert' }

// 一、Promise
Promise
  .resolve('hello')
  .then(res => res + 'lagou')
  .then(res => {
    const str = res + 'I love you'
    console.log(str)
  })

// 二、Compose
// 1. fp.flowRight 重新实现 isLastInStock
const isLastInStock = cars =>
  fp.flowRight(fp.prop('in_stock'), fp.last)(cars)

// 2. 获取第一个 car 的 name
const getFirstCarName = cars =>
  fp.flowRight(fp.prop('name'), fp.first)(cars)

// 3. 重构 averageDollarValue, 使用函数组合方式实现
const averageDollarValue = cars =>
  fp.flowRight(_average, fp.map(car => car.dollar_value))(cars)

// 4. 写一个sanitizeNames函数，返回一个下划线连接的小写字符串
const sanitizeNames = strArr =>
  fp.map(fp.flowRight(_underscore, fp.toLower), strArr)

// 三、Functor
// 1. 使用fp.add(a,y)和fp.map(f,x)创建一个能让functor里的值每个增加1的函数 ex1
let ex1 = () => maybe.map(x => fp.map(fp.add(1), x))

// 2. 实现一个函数ex2，能够使用fp.first获取列表的第一个元素
let ex2 = () => xs.map(fp.first)._value

// 3. 实现一个函数ex3，使用safeProp和fp.first找到user的名字和首字母
let ex3 = () => {
  const username = safeProp('name', user)._value
  return { username, firstLetter: username[0] }
}

// 4. 使用Maybe重写ex4，不要有if语句
let ex4 = n => Maybe.of(n).map(parseInt)._value