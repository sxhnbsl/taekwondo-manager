# 微信登录配置说明

## 配置步骤

1. **获取微信小程序AppSecret**
   - 登录微信公众平台 (https://mp.weixin.qq.com/)
   - 进入"开发" -> "开发设置"
   - 找到"AppSecret"，点击"生成"按钮
   - 记录生成的AppSecret

2. **配置AppSecret**
   - 打开 `config.js` 文件
   - 将 `appSecret` 的值替换为你获取的真实AppSecret

```javascript
// 微信小程序配置
module.exports = {
	// 微信小程序appid
	appid: 'wxf5cc669a5e04df3c',
	// 微信小程序app secret（需要在微信公众平台获取）
	appSecret: 'your_app_secret' // 替换为真实的AppSecret
}
```

3. **上传云函数**
   - 在HBuilderX中，右键点击 `auth` 云函数目录
   - 选择"上传并部署" -> "云端安装依赖"

## 注意事项

- AppSecret是敏感信息，请勿在代码中硬编码或提交到版本控制系统
- 如果AppSecret泄露，可能导致小程序被恶意使用
- 建议定期更新AppSecret以保证安全性
- 确保小程序已在微信公众平台中设置了正确的服务器域名（包括 https://api.weixin.qq.com）

## 常见问题

1. **登录失败，提示"获取微信用户信息失败"**
   - 检查网络连接是否正常
   - 确认AppSecret是否正确
   - 确认小程序是否已发布或在开发者工具中添加了测试账号

2. **登录失败，提示"微信登录失败: invalid code"**
   - 检查code是否过期（code有效期为5分钟）
   - 确认小程序appid是否与微信公众平台一致

3. **登录成功但无法获取用户信息**
   - 确认小程序已获得用户授权
   - 检查云函数是否有足够的权限

## 技术说明

- 使用微信官方的code2Session接口获取用户openid
- 以openid作为用户的唯一标识
- 首次登录时自动创建用户记录
- 存储openid到用户表中，便于后续查询和验证
