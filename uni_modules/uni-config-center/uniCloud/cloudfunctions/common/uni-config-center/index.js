const fs = require('fs')
const path = require('path')

class ConfigCenter {
  constructor() {
    this.configs = {}
  }

  getConfig(pluginName) {
    if (this.configs[pluginName]) {
      return this.configs[pluginName]
    }

    const configPath = path.join(__dirname, pluginName, 'config.json')
    
    try {
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
        this.configs[pluginName] = config
        return config
      }
      return null
    } catch (e) {
      console.error(`读取 ${pluginName} 配置失败:`, e)
      return null
    }
  }
}

let instance = null

module.exports = {
  createInstance() {
    if (!instance) {
      instance = new ConfigCenter()
    }
    return instance
  }
}
