// 微信小程序配置
// 敏感信息通过环境变量配置，请勿在此填写真实值
module.exports = {
	appid: process.env.WX_APPID || 'your-wx-appid',
	appSecret: process.env.WX_APP_SECRET || 'your-wx-app-secret',
	tokenSecret: process.env.TOKEN_SECRET || 'please-change-this-token-secret',
	tokenExpiresIn: 7200
}
