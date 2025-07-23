// Configuration
const defaults = {
  primaryColor: '#5511EE',
  starColor: '#EEAAFF',
  starSize: 8,
  starCount: 200,
  starAlpha: 0.7
}

// Elements mapping
const elements = {
  primaryColor: ['primaryColor', 'primaryColorPreview'],
  starColor: ['starColor', 'starColorPreview'],
  starSize: ['starSize', 'starSizeValue'],
  starCount: ['starCount', 'starCountValue'],
  starAlpha: ['starAlpha', 'starAlphaValue'],
  reset: ['resetBtn']
}

const getElements = () => {
  const el = {}
  Object.entries(elements).forEach(([key, ids]) => {
    el[key] = ids.map(id => document.getElementById(id))
  })
  return el
}

// Debounce utility
const debounce = (func, wait) => {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Storage utilities
const setStorage = (key, value) => chrome.storage.sync.set({ [key]: value })
const debouncedSet = (key, wait = 200) => debounce((value) => setStorage(key, value), wait)

// Event handlers
const createHandlers = (el) => ({
  color: (key) => {
    const [input, preview] = el[key]
    input.addEventListener('input', () => {
      const color = input.value
      preview.style.background = color
      debouncedSet(key, 300)(color)
    })
  },
  
  slider: (key) => {
    const [slider, value] = el[key]
    slider.addEventListener('input', () => {
      const val = slider.value
      value.textContent = key === 'starAlpha' ? val + '%' : val
      const storageValue = key === 'starAlpha' ? val / 100 : parseInt(val)
      debouncedSet(key)(storageValue)
    })
  },
  
  reset: () => {
    el.reset[0].addEventListener('click', () => {
      // Reset UI
      Object.entries(elements).forEach(([key, ids]) => {
        if (key === 'reset') return
        
        const [input, display] = el[key]
        const defaultValue = defaults[key]
        const strategy = getUpdateStrategy(key)
        strategy(input, display, defaultValue)
      })
      
      // Reset storage
      chrome.storage.sync.set(defaults)
    })
  }
})

// Update strategies
const updateStrategies = {
  Color: (input, display, value) => {
    input.value = value
    display.style.background = value
  },
  starAlpha: (input, display, value) => {
    const percent = Math.round(value * 100)
    input.value = percent
    display.textContent = percent + '%'
  },
  default: (input, display, value) => {
    input.value = value
    display.textContent = value
  }
}

const getUpdateStrategy = (key) => {
  if (key.includes('Color')) return updateStrategies.Color
  if (key === 'starAlpha') return updateStrategies.starAlpha
  return updateStrategies.default
}

// Load configuration
const loadConfig = (el) => {
  chrome.storage.sync.get(Object.keys(defaults), result => {
    Object.entries(defaults).forEach(([key, defaultValue]) => {
      const [input, display] = el[key]
      const value = result[key] || defaultValue
      const strategy = getUpdateStrategy(key)
      strategy(input, display, value)
    })
  })
}

// Initialize
const init = () => {
  const el = getElements()
  const handlers = createHandlers(el)
  
  // Setup handlers
  handlers.color('primaryColor')
  handlers.color('starColor')
  handlers.slider('starSize')
  handlers.slider('starCount')
  handlers.slider('starAlpha')
  handlers.reset()
  
  // Load saved config
  loadConfig(el)
}

// Start
init() 