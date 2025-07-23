// Configuration
const createConfig = () => ({
  primaryColor: '#5511EE',
  starColor: '#EEAAFF',
  starSize: 8,
  starCount: 200,
  starAlpha: 0.7
})

// Star management
const createStar = () => ({
  x: 0, y: 0, z: 0.2 + Math.random() * 0.8
})

const placeStar = (star, width, height, buffer = 100) => {
  star.x = Math.random() * (width + buffer * 2) - buffer
  star.y = Math.random() * (height + buffer * 2) - buffer
}

const resetStar = (star, width, height, buffer = 100) => {
  star.z = 0.2 + Math.random() * 0.8
  placeStar(star, width, height, buffer)
}

// Physics
const updateVelocity = (velocity) => {
  velocity.tx *= 0.96
  velocity.ty *= 0.96
  velocity.x += (velocity.tx - velocity.x) * 0.8
  velocity.y += (velocity.ty - velocity.y) * 0.8
}

const updateStar = (star, velocity, width, height, buffer = 100) => {
  star.x += velocity.x * star.z
  star.y += velocity.y * star.z
  star.x += (star.x - width / 2) * velocity.z * star.z
  star.y += (star.y - height / 2) * velocity.z * star.z
  star.z += velocity.z

  if (star.x < -buffer || star.x > width + buffer || star.y < -buffer || star.y > height + buffer) {
    resetStar(star, width, height, buffer)
  }
}

// Rendering
const drawStar = (ctx, star, velocity, config) => {
  ctx.beginPath()
  ctx.lineCap = 'round'
  ctx.lineWidth = config.starSize * star.z
  ctx.globalAlpha = config.starAlpha
  ctx.strokeStyle = config.starColor

  const tailX = velocity.x * 2 || 0.5
  const tailY = velocity.y * 2 || 0.5

  ctx.moveTo(star.x, star.y)
  ctx.lineTo(star.x + tailX, star.y + tailY)
  ctx.stroke()
}

const drawBackground = (ctx, color, width, height) => {
  ctx.fillStyle = color
  ctx.fillRect(0, 0, width, height)
}

// Input handling
const createInputHandler = (velocity, scale) => {
  let pointerX, pointerY, touchInput = false
  
  return {
    handleMove: (x, y) => {
      if (typeof pointerX === 'number' && typeof pointerY === 'number') {
        const ox = x - pointerX
        const oy = y - pointerY
        velocity.tx += (ox / 8) * scale * (touchInput ? 1 : -1)
        velocity.ty += (oy / 8) * scale * (touchInput ? 1 : -1)
      }
      pointerX = x
      pointerY = y
    },
    setTouch: (isTouch) => { touchInput = isTouch },
    reset: () => { pointerX = pointerY = null }
  }
}

// Storage
const loadConfig = (config) => {
  chrome.storage.sync.get(['primaryColor', 'starColor', 'starSize', 'starCount', 'starAlpha'], result => {
    Object.assign(config, result)
  })
}

const setupStorageListener = (config) => {
  chrome.storage.onChanged.addListener((changes) => {
    Object.keys(changes).forEach(key => {
      config[key] = changes[key].newValue
    })
  })
}

// Main app
const createApp = () => {
  const config = createConfig()
  const canvas = document.querySelector('canvas')
  const ctx = canvas.getContext('2d')
  
  let scale = 1, width, height
  let velocity = { x: 0, y: 0, tx: 0, ty: 0, z: 0.0005 }
  let stars = []
  let inputHandler = null
  
  const resize = () => {
    scale = window.devicePixelRatio || 1
    width = window.innerWidth * scale
    height = window.innerHeight * scale
    canvas.width = width
    canvas.height = height
    
    // Recreate stars with new dimensions
    stars = Array.from({ length: config.starCount }, createStar)
    stars.forEach(star => placeStar(star, width, height))
  }
  
  const update = () => {
    updateVelocity(velocity)
    stars.forEach(star => updateStar(star, velocity, width, height))
  }
  
  const render = () => {
    drawBackground(ctx, config.primaryColor, width, height)
    stars.forEach(star => drawStar(ctx, star, velocity, config))
  }
  
  const step = () => {
    update()
    render()
    requestAnimationFrame(step)
  }
  
  const setupEvents = () => {
    inputHandler = createInputHandler(velocity, scale)
    
    canvas.onmousemove = e => {
      inputHandler.setTouch(false)
      inputHandler.handleMove(e.clientX * scale, e.clientY * scale)
    }
    
    canvas.ontouchmove = e => {
      inputHandler.setTouch(true)
      inputHandler.handleMove(e.touches[0].clientX * scale, e.touches[0].clientY * scale)
      e.preventDefault()
    }
    
    canvas.ontouchend = inputHandler.reset
    document.onmouseleave = inputHandler.reset
    window.onresize = resize
  }
  
  // Initialize
  loadConfig(config)
  setupStorageListener(config)
  setupEvents()
  resize()
  step()
  
  return { config, stars }
}

// Start
createApp() 