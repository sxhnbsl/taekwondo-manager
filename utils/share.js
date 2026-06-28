export const shareConfig = {
	title: '欣兰体育',
	imageUrl: '/static/images/logo-large.png'
}

export function getShareConfig(pagePath, customTitle) {
	const pages = uni.$scope?.pages || []
	const currentPage = pages[pages.length - 1]
	const fullPath = currentPage ? `/${currentPage.route}${currentPage.options ? '?' + Object.keys(currentPage.options).map(key => `${key}=${encodeURIComponent(currentPage.options[key])}`).join('&') : ''}` : pagePath
	
	// 生成包含重定向参数的登录页面路径
	const loginPath = `/pages/login/login?redirect=${encodeURIComponent(fullPath)}`
	
	return {
		title: customTitle || shareConfig.title,
		path: loginPath,
		imageUrl: shareConfig.imageUrl
	}
}

export function getTimelineConfig(customTitle) {
	return {
		title: customTitle || shareConfig.title,
		imageUrl: shareConfig.imageUrl
	}
}
