const dishes = {
  breakfast: [
    { id: 'b001', name: '皮蛋瘦肉粥', cuisine: '粤式' },
    { id: 'b002', name: '豆浆油条', cuisine: '中式' },
    { id: 'b003', name: '鸡蛋三明治', cuisine: '简餐' },
    { id: 'b004', name: '牛奶燕麦', cuisine: '轻食' },
    { id: 'b005', name: '肠粉', cuisine: '粤式' },
    { id: 'b006', name: '云吞面', cuisine: '粤式' },
    { id: 'b007', name: '鸡蛋灌饼', cuisine: '中式' },
    { id: 'b008', name: '小笼包', cuisine: '江浙' },
    { id: 'b009', name: '煎蛋吐司', cuisine: '简餐' },
    { id: 'b010', name: '粢饭团', cuisine: '江浙' }
  ],
  meat: [
    { id: 'm001', name: '番茄牛腩', cuisine: '家常菜' },
    { id: 'm002', name: '可乐鸡翅', cuisine: '家常菜' },
    { id: 'm003', name: '鱼香肉丝', cuisine: '川菜' },
    { id: 'm004', name: '清蒸鲈鱼', cuisine: '粤菜' },
    { id: 'm005', name: '黑椒牛柳', cuisine: '家常菜' },
    { id: 'm006', name: '辣椒炒肉', cuisine: '湘菜' },
    { id: 'm007', name: '葱油鸡', cuisine: '粤菜' },
    { id: 'm008', name: '糖醋排骨', cuisine: '江浙' },
    { id: 'm009', name: '宫保鸡丁', cuisine: '川菜' },
    { id: 'm010', name: '香煎三文鱼', cuisine: '轻食' },
    { id: 'm011', name: '土豆炖牛肉', cuisine: '东北菜' },
    { id: 'm012', name: '白灼虾', cuisine: '粤菜' },
    { id: 'm013', name: '卤肉饭', cuisine: '台式' },
    { id: 'm014', name: '孜然羊肉', cuisine: '西北菜' }
  ],
  vegetable: [
    { id: 'v001', name: '蒜蓉生菜', cuisine: '粤菜' },
    { id: 'v002', name: '手撕包菜', cuisine: '湘菜' },
    { id: 'v003', name: '香菇油菜', cuisine: '家常菜' },
    { id: 'v004', name: '番茄炒蛋', cuisine: '家常菜' },
    { id: 'v005', name: '清炒西兰花', cuisine: '轻食' },
    { id: 'v006', name: '干煸四季豆', cuisine: '川菜' },
    { id: 'v007', name: '酸辣土豆丝', cuisine: '家常菜' },
    { id: 'v008', name: '蚝油杏鲍菇', cuisine: '家常菜' },
    { id: 'v009', name: '蒜蓉空心菜', cuisine: '粤菜' },
    { id: 'v010', name: '凉拌黄瓜', cuisine: '凉菜' },
    { id: 'v011', name: '上汤娃娃菜', cuisine: '粤菜' },
    { id: 'v012', name: '麻婆豆腐', cuisine: '川菜' },
    { id: 'v013', name: '地三鲜', cuisine: '东北菜' },
    { id: 'v014', name: '荷塘小炒', cuisine: '粤菜' }
  ]
}

const STORAGE_KEY = 'mealRandomHistoryV5'
const questionMap = {
  breakfast: '早餐吃什么？',
  lunch: '中午吃什么？',
  dinner: '今晚吃什么？'
}
const mealNameMap = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐'
}

const colors = ['#ffad66', '#fff0c4', '#7fd49d', '#ffd1a3', '#ff8a4c', '#fff6dd', '#56bf84', '#ffc37b']
const ringState = {
  breakfastCuisine: 0,
  breakfast: 0,
  cuisine: 0,
  meat: 0,
  vegetable: 0
}

let currentMeal = 'dinner'
let isSpinning = false
let lastSelectedIds = []
let lastSpinMeta = null

const wheel = document.querySelector('#wheel')
wheel.setAttribute('tabindex', '0')
wheel.setAttribute('role', 'button')
wheel.setAttribute('aria-label', '点击开抽')
const questionText = document.querySelector('#questionText')
const resultBox = document.querySelector('#resultBox')
const clearHistoryBtn = document.querySelector('#clearHistoryBtn')
const historyList = document.querySelector('#historyList')
const mealButtons = document.querySelectorAll('.meal-btn')

function getTodayText() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function readHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (error) {
    console.warn('读取历史记录失败，已重置', error)
    return []
  }
}

function saveHistory(history) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

function getRecentHistory() {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  return readHistory().filter(item => {
    const itemDate = new Date(item.date)
    return itemDate >= sevenDaysAgo
  })
}

function getRecentDishIds() {
  return getRecentHistory().flatMap(item => item.dishes.map(dish => dish.id))
}

function getRandomDish(list, usedIds) {
  const availableList = list.filter(item => !usedIds.includes(item.id))
  const finalList = availableList.length > 0 ? availableList : list
  const randomIndex = Math.floor(Math.random() * finalList.length)
  return finalList[randomIndex]
}

function uniqueCuisineItems(list) {
  return [...new Set(list.map(item => item.cuisine))].map(name => ({ id: `c-${name}`, name }))
}

function generateMeal(mealType) {
  const usedIds = getRecentDishIds()

  if (mealType === 'breakfast') {
    const breakfast = getRandomDish(dishes.breakfast, usedIds)
    return [breakfast]
  }

  const meat = getRandomDish(dishes.meat, usedIds)
  const nextUsedIds = [...usedIds, meat.id]
  const vegetable = getRandomDish(dishes.vegetable, nextUsedIds)
  return [meat, vegetable]
}

function makeConic(list) {
  const step = 360 / list.length
  return `conic-gradient(${list.map((_, index) => {
    const start = (index * step).toFixed(2)
    const end = ((index + 1) * step).toFixed(2)
    return `${colors[index % colors.length]} ${start}deg ${end}deg`
  }).join(', ')})`
}

function getRingRadius(type) {
  if (type === 'breakfastCuisine') return 173
  if (type === 'breakfast') return 108
  if (type === 'cuisine') return 177
  if (type === 'meat') return 127
  return 76
}

function getRingMask(type) {
  if (type === 'breakfastCuisine') return 'radial-gradient(circle, transparent 0 66%, #000 67% 100%)'
  if (type === 'breakfast') return 'radial-gradient(circle, transparent 0 32%, #000 33% 65%, transparent 66% 100%)'
  if (type === 'cuisine') return 'radial-gradient(circle, transparent 0 74%, #000 75% 100%)'
  if (type === 'meat') return 'radial-gradient(circle, transparent 0 52%, #000 53% 73%, transparent 74% 100%)'
  return 'radial-gradient(circle, transparent 0 30%, #000 31% 51%, transparent 52% 100%)'
}

function getSegmentCenterAngle(list, itemId) {
  const index = Math.max(0, list.findIndex(item => item.id === itemId))
  return index * (360 / list.length) + (180 / list.length)
}

function createRing(type, list, title, selectedIds) {
  const layer = document.createElement('div')
  layer.className = 'ring-layer'
  layer.dataset.ring = type
  layer.style.transform = `rotate(${ringState[type]}deg)`

  const bg = document.createElement('div')
  bg.className = 'ring-bg'
  bg.style.background = makeConic(list)
  bg.style.webkitMask = getRingMask(type)
  bg.style.mask = getRingMask(type)
  layer.appendChild(bg)

  const radius = getRingRadius(type)
  const step = 360 / list.length

  list.forEach((item, index) => {
    const angle = index * step + step / 2
    const label = document.createElement('div')
    label.className = `ring-label ${type}${selectedIds.includes(item.id) ? ' selected' : ''}`
    label.textContent = item.name

    const x = Math.sin(angle * Math.PI / 180) * radius
    const y = -Math.cos(angle * Math.PI / 180) * radius
    const readableRotate = angle > 90 && angle < 270 ? angle + 180 : angle
    label.style.transform = `translate(${x}px, ${y}px) rotate(${readableRotate}deg)`
    layer.appendChild(label)
  })

  const titleNode = document.createElement('div')
  titleNode.className = `ring-title ${type}`
  titleNode.textContent = title
  layer.appendChild(titleNode)

  return layer
}

function getCurrentCuisineList() {
  if (currentMeal === 'breakfast') return uniqueCuisineItems(dishes.breakfast)
  return uniqueCuisineItems([...dishes.meat, ...dishes.vegetable])
}

function renderWheel(selectedIds = lastSelectedIds) {
  wheel.innerHTML = ''

  if (currentMeal === 'breakfast') {
    wheel.appendChild(createRing('breakfastCuisine', uniqueCuisineItems(dishes.breakfast), '类型圈', selectedIds))
    wheel.appendChild(createRing('breakfast', dishes.breakfast, '早餐圈', selectedIds))
  } else {
    wheel.appendChild(createRing('cuisine', getCurrentCuisineList(), '菜系圈', selectedIds))
    wheel.appendChild(createRing('meat', dishes.meat, '荤菜圈', selectedIds))
    wheel.appendChild(createRing('vegetable', dishes.vegetable, '素菜圈', selectedIds))
  }

  const center = document.createElement('div')
  center.className = 'wheel-center'
  center.innerHTML = isSpinning ? '转动中<br><span>3s</span>' : '点击<br>开抽'
  wheel.appendChild(center)
}

function renderPendingResult(mealType) {
  resultBox.classList.remove('empty')
  if (mealType === 'breakfast') {
    resultBox.innerHTML = `
      <div class="pending-line">早餐圈正在转动...</div>
      <p class="result-note">停稳后早餐会跳出来。</p>
    `
    return
  }
  resultBox.innerHTML = `
    <div class="pending-line">菜系圈、荤菜圈、素菜圈正在一起转...</div>
    <p class="result-note">停稳后荤菜、素菜会依次跳出来。</p>
  `
}

function renderResult(mealType, selectedDishes) {
  resultBox.classList.remove('empty')

  if (mealType === 'breakfast') {
    const dish = selectedDishes[0]
    resultBox.innerHTML = `
      <div class="dish-reveal breakfast-reveal">
        <div class="dish-line"><span class="dish-tag">早餐</span>${dish.name}</div>
        <p>菜系/类型：${dish.cuisine}</p>
      </div>
      <p class="result-note">早餐只抽一个，7 天内尽量不重复。</p>
    `
    return
  }

  const [meat, vegetable] = selectedDishes
  resultBox.innerHTML = `
    <div class="dish-reveal reveal-one">
      <div class="dish-line"><span class="dish-tag">荤菜</span>${meat.name}</div>
      <p>菜系/类型：${meat.cuisine}</p>
    </div>
    <div class="dish-reveal reveal-two">
      <div class="dish-line"><span class="dish-tag green">素菜</span>${vegetable.name}</div>
      <p>菜系/类型：${vegetable.cuisine}</p>
    </div>
    <p class="result-note">结果按停稳后跳出的菜名为准。</p>
  `
}

function addHistory(mealType, selectedDishes) {
  const history = getRecentHistory()
  const record = {
    date: getTodayText(),
    mealType,
    dishes: selectedDishes
  }

  const filtered = history.filter(item => !(item.date === record.date && item.mealType === record.mealType))
  saveHistory([record, ...filtered])
}

function renderHistory() {
  const history = getRecentHistory()
  saveHistory(history)

  if (history.length === 0) {
    historyList.innerHTML = `<div class="history-item"><span class="history-date">暂无记录</span><span class="history-dishes">先抽一次吧</span></div>`
    return
  }

  historyList.innerHTML = history.map(item => {
    const dishNames = item.dishes.map(dish => dish.name).join(' + ')
    return `
      <div class="history-item">
        <span class="history-date">${item.date} · ${mealNameMap[item.mealType]}</span>
        <span class="history-dishes">${dishNames}</span>
      </div>
    `
  }).join('')
}

function getRingTarget(type, list, itemId, turns, direction = 1) {
  const targetAngle = getSegmentCenterAngle(list, itemId)
  const current = ringState[type]
  const normalizedCurrent = ((current % 360) + 360) % 360
  const desired = ((-targetAngle % 360) + 360) % 360

  if (direction > 0) {
    const deltaClockwise = ((desired - normalizedCurrent) % 360 + 360) % 360
    return current + turns * 360 + deltaClockwise
  }

  const deltaCounterClockwise = ((normalizedCurrent - desired) % 360 + 360) % 360
  return current - turns * 360 - deltaCounterClockwise
}

function applyRingRotation(type, targetDeg) {
  const node = wheel.querySelector(`[data-ring="${type}"]`)
  if (!node) return
  node.style.transform = `rotate(${targetDeg}deg)`
}

function spinWheel(selectedDishes, callback) {
  if (isSpinning) return
  isSpinning = true
  wheel.classList.add('is-spinning')
  renderPendingResult(currentMeal)

  // 关键修复：先按“当前角度”渲染转盘，再在下一帧修改 transform。
  // 这样浏览器能捕捉到起点和终点，transition 才会真正播放。
  renderWheel([])

  const targets = {}
  if (currentMeal === 'breakfast') {
    const breakfast = selectedDishes[0]
    const cuisineList = uniqueCuisineItems(dishes.breakfast)
    targets.breakfastCuisine = getRingTarget('breakfastCuisine', cuisineList, `c-${breakfast.cuisine}`, 5 + Math.floor(Math.random() * 3), 1)
    targets.breakfast = getRingTarget('breakfast', dishes.breakfast, breakfast.id, 6 + Math.floor(Math.random() * 3), -1)
  } else {
    const [meat, vegetable] = selectedDishes
    const cuisineList = getCurrentCuisineList()
    const selectedCuisine = Math.random() > 0.5 ? meat.cuisine : vegetable.cuisine
    targets.cuisine = getRingTarget('cuisine', cuisineList, `c-${selectedCuisine}`, 5 + Math.floor(Math.random() * 3), 1)
    targets.meat = getRingTarget('meat', dishes.meat, meat.id, 6 + Math.floor(Math.random() * 3), -1)
    targets.vegetable = getRingTarget('vegetable', dishes.vegetable, vegetable.id, 7 + Math.floor(Math.random() * 3), 1)
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      Object.entries(targets).forEach(([type, targetDeg]) => {
        applyRingRotation(type, targetDeg)
        ringState[type] = targetDeg
      })
    })
  })

  window.setTimeout(() => {
    isSpinning = false
    lastSelectedIds = selectedDishes.map(item => item.id)
    if (currentMeal === 'breakfast') {
      lastSelectedIds.push(`c-${selectedDishes[0].cuisine}`)
    } else {
      const [meat, vegetable] = selectedDishes
      lastSelectedIds.push(`c-${meat.cuisine}`, `c-${vegetable.cuisine}`)
    }
    renderWheel(lastSelectedIds)
    wheel.classList.remove('is-spinning')
    callback()
  }, 3200)
}

function drawMeal() {
  const selectedDishes = generateMeal(currentMeal)
  spinWheel(selectedDishes, () => {
    renderResult(currentMeal, selectedDishes)
    addHistory(currentMeal, selectedDishes)
    renderHistory()
  })
}

mealButtons.forEach(button => {
  button.addEventListener('click', () => {
    currentMeal = button.dataset.meal
    lastSelectedIds = []
    lastSpinMeta = null
    questionText.textContent = questionMap[currentMeal]
    mealButtons.forEach(item => item.classList.remove('active'))
    button.classList.add('active')
    renderWheel()
  })
})

wheel.addEventListener('click', drawMeal)
wheel.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    drawMeal()
  }
})
clearHistoryBtn.addEventListener('click', () => {
  const confirmed = window.confirm('确定要清空最近 7 天记录吗？')
  if (!confirmed) return
  localStorage.removeItem(STORAGE_KEY)
  resultBox.className = 'result-box empty'
  resultBox.textContent = '记录已清空，点击转盘中心可以重新开始随机。'
  lastSelectedIds = []
  renderWheel()
  renderHistory()
})

renderWheel()
renderHistory()
