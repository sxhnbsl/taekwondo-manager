'use strict';

const { verifyToken } = require('./auth-utils')

exports.main = async (event, context) => {
	const { action = 'run', data = {}, _token } = event
	const db = uniCloud.database()
	if (_token) {
		const auth = verifyToken(_token)
		if (!auth) {
			return {
				code: -1,
				message: '未登录'
			}
		}
		if (auth.role !== 'admin' && auth.role !== 'coach') {
			return {
				code: -1,
				message: '权限不足'
			}
		}
	}
	
	switch (action) {
		case 'run':
			return await runExpiry(db, data)
		default:
			return {
				code: -1,
				message: '未知操作'
			}
	}
}

async function runExpiry(db, data) {
	const warningDays = parseInt(data.warningDays || 15)
	const now = new Date()
	const warningTime = new Date(now.getTime() + warningDays * 24 * 60 * 60 * 1000)
	const command = db.command
	
	const expiringRes = await db.collection('hours_packages')
		.where({
			status: 'active',
			is_unlimited: false,
			remaining: command.gt(0),
			expire_at: command.lte(warningTime)
		})
		.get()
	const packages = expiringRes.data || []
	
	let warningCount = 0
	let expiredCount = 0
	
	for (const pkg of packages) {
		if (!pkg.expire_at) continue
		const expireTime = new Date(pkg.expire_at).getTime()
		if (isNaN(expireTime)) continue
		if (expireTime <= now.getTime()) {
			const expiredResult = await expirePackage(db, pkg)
			if (expiredResult) {
				expiredCount += 1
			}
		} else {
			const warned = await warnPackage(db, pkg, now)
			if (warned) {
				warningCount += 1
			}
		}
	}
	
	return {
		code: 0,
		message: '执行完成',
		data: {
			warningCount,
			expiredCount
		}
	}
}

async function warnPackage(db, pkg, now) {
	const lastWarn = pkg.warned_at ? new Date(pkg.warned_at).getTime() : 0
	if (lastWarn && now.getTime() - lastWarn < 24 * 60 * 60 * 1000) {
		return false
	}
	const studentRes = await db.collection('students').doc(pkg.student_id).get()
	if (!studentRes.data || (Array.isArray(studentRes.data) && studentRes.data.length === 0)) {
		return false
	}
	const student = Array.isArray(studentRes.data) ? studentRes.data[0] : studentRes.data
	if (!student) return false
	const unitText = pkg.unit === 'day' ? '天数' : '课时'
	const expireDate = formatDate(pkg.expire_at)
	const title = `课时到期提醒 - ${student.name}`
	const content = `${student.name}的${unitText}课时包将在${expireDate}到期，请及时安排使用或续费。`
	await sendNotify(db, student, title, content, 'hours_expiry_warning', pkg._id)
	await db.collection('hours_packages').doc(pkg._id).update({
		warned_at: new Date(),
		update_time: new Date()
	})
	return true
}

async function expirePackage(db, pkg) {
	const transaction = await db.startTransaction()
	try {
		const studentRes = await transaction.collection('students').doc(pkg.student_id).get()
		if (!studentRes.data || (Array.isArray(studentRes.data) && studentRes.data.length === 0)) {
			await transaction.rollback()
			return false
		}
		const student = Array.isArray(studentRes.data) ? studentRes.data[0] : studentRes.data
		if (!student) {
			await transaction.rollback()
			return false
		}
		const unit = pkg.unit || 'lesson'
		const beforeHours = student.remaining_hours || 0
		const beforeDays = student.remaining_days || 0
		
		const deduct = pkg.remaining || 0
		const afterHours = unit === 'lesson' ? Math.max(0, beforeHours - deduct) : beforeHours
		const afterDays = unit === 'day' ? Math.max(0, beforeDays - deduct) : beforeDays
		
		const updateData = {
			update_time: new Date()
		}
		if (unit === 'lesson') {
			updateData.used_hours = (student.used_hours || 0) + deduct
			updateData.remaining_hours = afterHours
		} else {
			updateData.used_days = (student.used_days || 0) + deduct
			updateData.remaining_days = afterDays
		}
		await transaction.collection('students').doc(pkg.student_id).update(updateData)
		
		await transaction.collection('hours_packages').doc(pkg._id).update({
			remaining: 0,
			status: 'expired',
			update_time: new Date()
		})
		
		if (deduct > 0) {
			await transaction.collection('class_records').add({
				student_id: pkg.student_id,
				hours: unit === 'lesson' ? deduct : 0,
				days: unit === 'day' ? deduct : 0,
				unit,
				type: 'expire',
				reason: '课时到期扣除',
				before_hours: beforeHours,
				after_hours: afterHours,
				before_days: beforeDays,
				after_days: afterDays,
				package_deducts: [{ package_id: pkg._id, quantity: deduct }],
				operator_id: 'system',
				create_time: new Date()
			})
		}
		
		await transaction.commit()
		
		const unitText = unit === 'day' ? '天数' : '课时'
		const title = `课时到期扣除 - ${student.name}`
		const content = `${student.name}的${unitText}课时包已到期，自动扣除${deduct}${unitText}。`
		await sendNotify(db, student, title, content, 'hours_expired', pkg._id)
		return true
	} catch (e) {
		await transaction.rollback()
		return false
	}
}

async function sendNotify(db, student, title, content, type, related_id) {
	const recipients = []
	if (student.parent_user_id) {
		recipients.push(student.parent_user_id)
	}
	const coachRes = await db.collection('uni-id-users').where({
		role: 'coach'
	}).get()
	if (coachRes.data && coachRes.data.length > 0) {
		coachRes.data.forEach(coach => {
			if (coach._id && !recipients.includes(coach._id)) {
				recipients.push(coach._id)
			}
		})
	}
	const adminRes = await db.collection('uni-id-users').where({
		role: 'admin'
	}).get()
	if (adminRes.data && adminRes.data.length > 0) {
		adminRes.data.forEach(admin => {
			if (admin._id && !recipients.includes(admin._id)) {
				recipients.push(admin._id)
			}
		})
	}
	for (const recipient of recipients) {
		await db.collection('notifications').add({
			user_id: recipient,
			title,
			content,
			type,
			related_id,
			create_time: new Date()
		})
	}
}

function formatDate(dateValue) {
	const date = new Date(dateValue)
	if (isNaN(date.getTime())) return ''
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}
