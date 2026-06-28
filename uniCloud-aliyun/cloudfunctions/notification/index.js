'use strict';

const { verifyToken } = require('./auth-utils')

exports.main = async (event, context) => {
	const { action, data, _token } = event
	const db = uniCloud.database()
	
	switch(action) {
		case 'getList':
			return await getList(db, data, _token)
		case 'getSentList':
			return await getSentList(db, data, _token)
		case 'markRead':
			return await markRead(db, data, _token)
		case 'send':
			return await send(db, data, _token)
		case 'update':
			return await update(db, data, _token)
		case 'delete':
			return await deleteNotification(db, data, _token)
		case 'checkHoursWarning':
			return await checkHoursWarning(db, data, _token)
		default:
			return {
				code: -1,
				message: '未知操作'
			}
	}
}

async function getList(db, data, token) {
	const { page = 1, pageSize = 20 } = data
	
	const auth = verifyToken(token)
	if (!auth) {
		return {
			code: -1,
			message: '未登录'
		}
	}
	const user_id = auth.uid
	
	try {
		const res = await db.collection('notifications')
			.where({
				user_id
			})
			.skip((page - 1) * pageSize)
			.limit(pageSize)
			.orderBy('create_time', 'desc')
			.get()
		
		const totalRes = await db.collection('notifications').where({
			user_id
		}).count()
		
		const unreadRes = await db.collection('notifications').where({
			user_id,
			is_read: false
		}).count()
		
		return {
			code: 0,
			message: '获取成功',
			data: {
				list: res.data,
				total: totalRes.total,
				unread_count: unreadRes.total
			}
		}
	} catch (e) {
		return {
			code: -1,
			message: e.message || '获取失败'
		}
	}
}

async function markRead(db, data, token) {
	const { id } = data
	
	try {
		const auth = verifyToken(token)
		if (!auth) {
			return {
				code: -1,
				message: '未登录'
			}
		}
		const res = await db.collection('notifications').doc(id).get()
		if (!res.data || res.data.length === 0) {
			return {
				code: -1,
				message: '通知不存在'
			}
		}
		const notification = res.data[0]
		if (notification.user_id !== auth.uid) {
			return {
				code: -1,
				message: '权限不足'
			}
		}
		await db.collection('notifications').doc(id).update({
			is_read: true,
			read_time: new Date()
		})
		
		return {
			code: 0,
			message: '标记成功'
		}
	} catch (e) {
		return {
			code: -1,
			message: e.message || '标记失败'
		}
	}
}

async function send(db, data, token) {
	const { user_ids, title, content, type, related_id } = data
	
	try {
		const auth = verifyToken(token)
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
		if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
			return {
				code: -1,
				message: '接收人列表不能为空'
			}
		}
		
		if (!title || !content) {
			return {
				code: -1,
				message: '消息标题和内容不能为空'
			}
		}
		
		const validUserIds = user_ids.filter(id => id && id !== '')
		
		if (validUserIds.length === 0) {
			return {
				code: -1,
				message: '未找到有效的接收人'
			}
		}
		
		for (const user_id of validUserIds) {
			await db.collection('notifications').add({
				user_id,
				title,
				content,
				type,
				related_id,
				create_time: new Date()
			})
		}
		
		return {
			code: 0,
			message: '发送成功'
		}
	} catch (e) {
		console.error('发送消息失败:', e)
		return {
			code: -1,
			message: e.message || '发送失败'
		}
	}
}

async function getSentList(db, data, token) {
	const { page = 1, pageSize = 20 } = data
	
	try {
		const auth = verifyToken(token)
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
		const res = await db.collection('notifications')
			.skip((page - 1) * pageSize)
			.limit(pageSize)
			.orderBy('create_time', 'desc')
			.get()
		
		const totalRes = await db.collection('notifications').count()
		
		return {
			code: 0,
			message: '获取成功',
			data: {
				list: res.data,
				total: totalRes.total
			}
		}
	} catch (e) {
		return {
			code: -1,
			message: e.message || '获取失败'
		}
	}
}

async function update(db, data, token) {
	const { id, title, content, type } = data
	
	try {
		const auth = verifyToken(token)
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
		const updateData = {
			update_time: new Date()
		}
		
		if (title) updateData.title = title
		if (content) updateData.content = content
		if (type) updateData.type = type
		
		await db.collection('notifications').doc(id).update(updateData)
		
		return {
			code: 0,
			message: '更新成功'
		}
	} catch (e) {
		console.error('更新消息失败:', e)
		return {
			code: -1,
			message: e.message || '更新失败'
		}
	}
}

async function deleteNotification(db, data, token) {
	const { id } = data
	
	try {
		const auth = verifyToken(token)
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
		await db.collection('notifications').doc(id).remove()
		
		return {
			code: 0,
			message: '删除成功'
		}
	} catch (e) {
		console.error('删除消息失败:', e)
		return {
			code: -1,
			message: e.message || '删除失败'
		}
	}
}

async function checkHoursWarning(db, data, token) {
	const { student_id } = data
	
	try {
		const auth = verifyToken(token)
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
		if (!student_id) {
			return {
				code: -1,
				message: '学生ID不能为空'
			}
		}
		
		const studentRes = await db.collection('students').doc(student_id).get()
		
		if (!studentRes.data || studentRes.data.length === 0) {
			return {
				code: -1,
				message: '学生不存在'
			}
		}
		
		const student = studentRes.data[0]
		const remainingHours = student.remaining_hours || 0
		
		const warnings = []
		
		if (remainingHours <= 5 && remainingHours > 0) {
			warnings.push({
				threshold: 5,
				title: `课时不足提醒 - ${student.name}`,
				content: `${student.name}的剩余课时仅剩${remainingHours}课时，请及时续费，以免影响正常上课。`,
				type: 'hours_warning'
			})
		} else if (remainingHours <= 10 && remainingHours > 5) {
			warnings.push({
				threshold: 10,
				title: `课时预警提醒 - ${student.name}`,
				content: `${student.name}的剩余课时仅剩${remainingHours}课时，建议提前续费，确保课程顺利进行。`,
				type: 'hours_warning'
			})
		}
		
		if (warnings.length > 0) {
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
			
			for (const warning of warnings) {
				for (const recipient of recipients) {
					const existingRes = await db.collection('notifications')
						.where({
							user_id: recipient,
							title: warning.title,
							type: warning.type,
							create_time: db.command.gte(new Date(Date.now() - 24 * 60 * 60 * 1000))
						})
						.get()
					
					if (!existingRes.data || existingRes.data.length === 0) {
						await db.collection('notifications').add({
							user_id: recipient,
							title: warning.title,
							content: warning.content,
							type: warning.type,
							related_id: student_id,
							create_time: new Date()
						})
					}
				}
			}
			
			return {
				code: 0,
				message: '检查完成',
				data: {
					remaining_hours: remainingHours,
					warnings: warnings,
					recipients: recipients
				}
			}
		} else {
			return {
				code: 0,
				message: '无需提醒',
				data: {
					remaining_hours: remainingHours,
					warnings: []
				}
			}
		}
	} catch (e) {
		console.error('检查课时提醒失败:', e)
		return {
			code: -1,
			message: e.message || '检查失败'
		}
	}
}
