export const USER_ROLES = {
	PARENT: 'parent',
	ADMIN: 'admin',
	COACH: 'coach'
}

export const COURSE_STATUS = {
	PLANNED: 'planned',
	ONGOING: 'ongoing',
	COMPLETED: 'completed',
	CANCELLED: 'cancelled'
}

export const STUDENT_STATUS = {
	ACTIVE: 'active',
	INACTIVE: 'inactive',
	GRADUATED: 'graduated'
}

export const LEVEL_OPTIONS = [
	// 初级（10级-1级）
	{ value: 'white', label: '白带（10级）' },
	{ value: 'white-yellow', label: '白黄带（9级）' },
	{ value: 'yellow', label: '黄带（8级）' },
	{ value: 'yellow-green', label: '黄绿带（7级）' },
	{ value: 'green', label: '绿带（6级）' },
	{ value: 'green-blue', label: '绿蓝带（5级）' },
	{ value: 'blue', label: '蓝带（4级）' },
	{ value: 'blue-red', label: '蓝红带（3级）' },
	{ value: 'red', label: '红带（2级）' },
	{ value: 'red-black', label: '红黑带（1级）' },
	// 黑带（1段-9段）
	{ value: 'black-1', label: '黑带（1段）' },
	{ value: 'black-2', label: '黑带（2段）' },
	{ value: 'black-3', label: '黑带（3段）' },
	{ value: 'black-4', label: '黑带（4段）' },
	{ value: 'black-5', label: '黑带（5段）' },
	{ value: 'black-6', label: '黑带（6段）' },
	{ value: 'black-7', label: '黑带（7段）' },
	{ value: 'black-8', label: '黑带（8段）' },
	{ value: 'black-9', label: '黑带（9段）' }
]

export const PAYMENT_METHODS = [
	{ value: 'wechat', label: '微信支付' },
	{ value: 'alipay', label: '支付宝' },
	{ value: 'cash', label: '现金' }
]

export const NOTIFICATION_TYPES = {
	CLASS_REMINDER: 'class_reminder',
	HOURS_WARNING: 'hours_warning',
	MEDIA_UPDATE: 'media_update'
}

export const STORAGE_KEYS = {
	TOKEN: 'token',
	USER_INFO: 'userInfo',
	STUDENT_IDS: 'studentIds'
}

export function formatDate(date, format = 'YYYY-MM-DD') {
	if (!date) return ''
	
	const d = new Date(date)
	const year = d.getFullYear()
	const month = String(d.getMonth() + 1).padStart(2, '0')
	const day = String(d.getDate()).padStart(2, '0')
	const hour = String(d.getHours()).padStart(2, '0')
	const minute = String(d.getMinutes()).padStart(2, '0')
	const second = String(d.getSeconds()).padStart(2, '0')
	
	switch(format) {
		case 'YYYY-MM-DD':
			return `${year}-${month}-${day}`
		case 'YYYY-MM-DD HH:mm':
			return `${year}-${month}-${day} ${hour}:${minute}`
		case 'YYYY-MM-DD HH:mm:ss':
			return `${year}-${month}-${day} ${hour}:${minute}:${second}`
		case 'HH:mm':
			return `${hour}:${minute}`
		case 'MM-DD HH:mm':
			return `${month}-${day} ${hour}:${minute}`
		case 'MM-DD':
			return `${month}-${day}`
		case 'YYYY年MM月DD日 HH:mm':
			return `${year}年${month}月${day}日 ${hour}:${minute}`
		default:
			return `${year}-${month}-${day}`
	}
}

export function formatFileSize(bytes) {
	if (bytes === 0) return '0 B'
	
	const k = 1024
	const sizes = ['B', 'KB', 'MB', 'GB']
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	
	return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export function formatDuration(seconds) {
	if (!seconds) return '0:00'
	
	const hours = Math.floor(seconds / 3600)
	const minutes = Math.floor((seconds % 3600) / 60)
	const secs = seconds % 60
	
	if (hours > 0) {
		return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
	}
	return `${minutes}:${String(secs).padStart(2, '0')}`
}

export function getLevelLabel(level) {
	const option = LEVEL_OPTIONS.find(opt => opt.value === level)
	return option ? option.label : level
}

export function debounce(func, wait) {
	let timeout
	return function(...args) {
		clearTimeout(timeout)
		timeout = setTimeout(() => {
			func.apply(this, args)
		}, wait)
	}
}

export function throttle(func, wait) {
	let previous = 0
	return function(...args) {
		const now = Date.now()
		if (now - previous > wait) {
			func.apply(this, args)
			previous = now
		}
	}
}

export function checkPermission(requiredRole) {
	const userInfo = uni.getStorageSync(STORAGE_KEYS.USER_INFO)
	if (!userInfo) {
		uni.showToast({
			title: '请先登录',
			icon: 'none'
		})
		setTimeout(() => {
			uni.navigateTo({
				url: '/pages/login/login'
			})
		}, 1500)
		return false
	}
	
	const userRole = userInfo.role
	if (requiredRole && userRole !== requiredRole) {
		uni.showToast({
			title: '无权限访问',
			icon: 'none'
		})
		return false
	}
	
	return true
}

export function isAdmin() {
	const userInfo = uni.getStorageSync(STORAGE_KEYS.USER_INFO)
	return userInfo && userInfo.role === USER_ROLES.ADMIN
}

export function isParent() {
	const userInfo = uni.getStorageSync(STORAGE_KEYS.USER_INFO)
	return userInfo && userInfo.role === USER_ROLES.PARENT
}
