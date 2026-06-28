import { callCloudFunction } from './cloud.js'

export const authAPI = {
	login(code) {
		return callCloudFunction('auth', {
			action: 'login',
			data: { code }
		})
	},

	guestLogin() {
		return callCloudFunction('auth', {
			action: 'guestLogin',
			data: {}
		})
	},
	
	coachLogin(username, password) {
		return callCloudFunction('auth', {
			action: 'coachLogin',
			data: { username, password }
		})
	},
	
	adminLogin(username, password) {
		return callCloudFunction('auth', {
			action: 'adminLogin',
			data: { username, password }
		})
	},
	
	bindStudent(data) {
		return callCloudFunction('auth', {
			action: 'bindStudent',
			data
		})
	},
	
	getUserInfo() {
		return callCloudFunction('auth', {
			action: 'getUserInfo',
			data: {}
		})
	},

	deleteAccount() {
		return callCloudFunction('auth', {
			action: 'deleteAccount',
			data: {}
		})
	}
}

export const studentAPI = {
	getList(params) {
		return callCloudFunction('student', {
			action: 'getList',
			data: params
		})
	},
	
	getDetail(id) {
		return callCloudFunction('student', {
			action: 'getDetail',
			data: { id }
		})
	},
	
	create(data) {
		return callCloudFunction('student', {
			action: 'create',
			data
		})
	},
	
	update(id, data) {
		return callCloudFunction('student', {
			action: 'update',
			data: { id, ...data }
		})
	},
	
	delete(id) {
		return callCloudFunction('student', {
			action: 'delete',
			data: { id }
		})
	},
	
	searchByNameAndMobile(params) {
		return callCloudFunction('student', {
			action: 'searchByNameAndMobile',
			data: params
		})
	},
	
	bindToParent(params) {
		return callCloudFunction('student', {
			action: 'bindToParent',
			data: params
		})
	},
	
	getPackages(student_id) {
		return callCloudFunction('student', {
			action: 'getPackages',
			data: { student_id }
		})
	}
}

export const courseAPI = {
	getList(params) {
		return callCloudFunction('course', {
			action: 'getList',
			data: params
		})
	},
	
	getDetail(id) {
		return callCloudFunction('course', {
			action: 'getDetail',
			data: { id }
		})
	},
	
	create(data) {
		return callCloudFunction('course', {
			action: 'create',
			data
		})
	},
	
	update(id, data) {
		return callCloudFunction('course', {
			action: 'update',
			data: { id, ...data }
		})
	},
	
	delete(id) {
		return callCloudFunction('course', {
			action: 'delete',
			data: { id }
		})
	},
	
	completeCourse(id, data) {
		return callCloudFunction('course', {
			action: 'completeCourse',
			data: { id, ...data }
		})
	}
}

export const mediaAPI = {
	getList(course_id) {
		return callCloudFunction('media', {
			action: 'getList',
			data: { course_id }
		})
	},
	
	upload(course_id, files, descriptions) {
		return callCloudFunction('media', {
			action: 'upload',
			data: { course_id, files, descriptions }
		})
	},
	
	delete(id) {
		return callCloudFunction('media', {
			action: 'delete',
			data: { id }
		})
	}
}

export const hoursAPI = {
	getRecords(params) {
		return callCloudFunction('hours', {
			action: 'getRecords',
			data: params
		})
	},
	
	add(student_id, quantity, reason, payment_method, price, unit = 'lesson', options = {}) {
		return callCloudFunction('hours', {
			action: 'add',
			data: {
				student_id,
				hours: unit === 'lesson' || unit === 'private' ? quantity : 0,
				days: unit === 'day' ? quantity : 0,
				unit,
				reason,
				payment_method,
				price,
				is_unlimited: options.is_unlimited,
				expire_at: options.expire_at
			}
		})
	},
	
	consume(student_id, course_id, quantity, reason, unit = 'lesson') {
		return callCloudFunction('hours', {
			action: 'consume',
			data: {
				student_id,
				course_id,
				hours: unit === 'lesson' || unit === 'private' ? quantity : 0,
				days: unit === 'day' ? quantity : 0,
				unit,
				reason
			}
		})
	},
	
	undoConsume(recordId, reason) {
		return callCloudFunction('hours', {
			action: 'undoConsume',
			data: { recordId, reason }
		})
	},
	
	undoAdd(recordId, reason) {
		return callCloudFunction('hours', {
			action: 'undoAdd',
			data: { recordId, reason }
		})
	},
	
	getExpiringPackages() {
		return callCloudFunction('hours', {
			action: 'getExpiringPackages',
			data: {}
		})
	},
	
	deleteExpiredPackages(package_ids) {
		return callCloudFunction('hours', {
			action: 'deleteExpiredPackages',
			data: { package_ids }
		})
	}
}

export const statisticsAPI = {
	getOverview(start_date, end_date) {
		return callCloudFunction('statistics', {
			action: 'getOverview',
			data: { start_date, end_date }
		})
	},
	
	getAttendance(student_id, start_date, end_date) {
		return callCloudFunction('statistics', {
			action: 'getAttendance',
			data: { student_id, start_date, end_date }
		})
	}
}

export const notificationAPI = {
	getList(params) {
		return callCloudFunction('notification', {
			action: 'getList',
			data: params
		})
	},
	
	getSentList(params) {
		return callCloudFunction('notification', {
			action: 'getSentList',
			data: params
		})
	},
	
	markRead(id) {
		return callCloudFunction('notification', {
			action: 'markRead',
			data: { id }
		})
	},
	
	send(user_ids, title, content, type, related_id) {
		return callCloudFunction('notification', {
			action: 'send',
			data: { user_ids, title, content, type, related_id }
		})
	},
	
	update(id, title, content, type) {
		return callCloudFunction('notification', {
			action: 'update',
			data: { id, title, content, type }
		})
	},
	
	delete(id) {
		return callCloudFunction('notification', {
			action: 'delete',
			data: { id }
		})
	},
	
	checkHoursWarning(student_id) {
		return callCloudFunction('notification', {
			action: 'checkHoursWarning',
			data: { student_id }
		})
	}
}

export const coachAPI = {
	getList() {
		return callCloudFunction('coach', {
			action: 'getList',
			data: {}
		})
	},
	
	getDetail(id) {
		return callCloudFunction('coach', {
			action: 'getDetail',
			data: { id }
		})
	},
	
	create(data) {
		return callCloudFunction('coach', {
			action: 'create',
			data
		})
	},
	
	update(id, data) {
		return callCloudFunction('coach', {
			action: 'update',
			data: { id, ...data }
		})
	},
	
	delete(id) {
		return callCloudFunction('coach', {
			action: 'delete',
			data: { id }
		})
	},
	
	resetPassword(id, new_password) {
		return callCloudFunction('coach', {
			action: 'resetPassword',
			data: { id, new_password }
		})
	}
}

export const testDataAPI = {
	init() {
		return callCloudFunction('test-data', {
			action: 'initTestData',
			data: {}
		})
	},
	
	clear() {
		return callCloudFunction('test-data', {
			action: 'clearTestData',
			data: {}
		})
	}
}

export const fixDbAPI = {
	fix() {
		return callCloudFunction('fix-db', {
			data: {}
		})
	}
}
