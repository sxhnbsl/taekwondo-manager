'use strict';

const crypto = require('crypto')
const { verifyToken } = require('./auth-utils')

exports.main = async (event, context) => {
	const { action, data, _token } = event
	const token = _token || context.token
	const db = uniCloud.database()
	const auth = verifyToken(token)
	if (!auth) {
		return {
			code: -1,
			message: '未登录'
		}
	}
	if (auth.role !== 'admin') {
		return {
			code: -1,
			message: '权限不足'
		}
	}
	
	switch(action) {
		case 'getList':
			return await getList(db, auth)
		case 'getDetail':
			return await getDetail(db, data, auth)
		case 'create':
			return await create(db, data, auth)
		case 'update':
			return await update(db, data, auth)
		case 'delete':
			return await deleteCoach(db, data, auth)
		case 'resetPassword':
			return await resetPassword(db, data, auth)
		default:
			return {
				code: -1,
				message: '未知操作'
			}
	}
}

async function getList(db, auth) {
	try {
		const command = db.command
		const res = await db.collection('uni-id-users')
			.where({
				role: command.in(['coach', 'admin']),
				_id: command.neq(auth.uid)
			})
			.field({
				_id: true,
				username: true,
				nickname: true,
				status: true,
				role: true,
				remark: true,
				create_time: true
			})
			.orderBy('create_time', 'desc')
			.get()
		
		return {
			code: 0,
			message: '获取成功',
			data: {
				list: res.data
			}
		}
	} catch (e) {
		console.error('getList error:', e)
		return {
			code: -1,
			message: e.message || '获取失败'
		}
	}
}

async function getDetail(db, data, auth) {
	const { id } = data
	
	try {
		const res = await db.collection('uni-id-users').doc(id).get()
		
		if (res.data.length === 0) {
			return {
				code: -1,
				message: '用户不存在'
			}
		}
		
		const user = res.data[0]
		
		// 只返回 coach 或 admin 角色的用户
		if (user.role !== 'coach' && user.role !== 'admin') {
			return {
				code: -1,
				message: '该用户不是教练或管理员'
			}
		}
		
		return {
			code: 0,
			message: '获取成功',
			data: {
				_id: user._id,
				username: user.username,
				nickname: user.nickname,
				status: user.status,
				role: user.role,
				remark: user.remark,
				create_time: user.create_time
			}
		}
	} catch (e) {
		return {
			code: -1,
			message: e.message || '获取失败'
		}
	}
}

async function create(db, data, auth) {
	const { username, nickname, password, role = 'coach', status = 'active', remark } = data

	try {
		const existRes = await db.collection('uni-id-users').where({
			username
		}).get()

		if (existRes.data.length > 0) {
			return {
				code: -1,
				message: '用户名已存在'
			}
		}

		const passwordHash = crypto.createHash('sha256').update(password).digest('hex')

		const createRes = await db.collection('uni-id-users').add({
			username,
			password: passwordHash,
			nickname,
			role,
			status,
			remark,
			create_time: new Date()
		})

		return {
			code: 0,
			message: '创建成功',
			data: {
				id: createRes.id
			}
		}
	} catch (e) {
		console.error('create error:', e)
		return {
			code: -1,
			message: e.message || '创建失败'
		}
	}
}

async function update(db, data, auth) {
	const { id, nickname, status, remark } = data

	try {
		await db.collection('uni-id-users').doc(id).update({
			nickname,
			status,
			remark,
			update_time: new Date()
		})

		return {
			code: 0,
			message: '更新成功'
		}
	} catch (e) {
		return {
			code: -1,
			message: e.message || '更新失败'
		}
	}
}

async function deleteCoach(db, data, auth) {
	const { id } = data
	
	try {
		const userRes = await db.collection('uni-id-users').doc(id).get()
		if (userRes.data.length === 0) {
			return {
				code: -1,
				message: '用户不存在'
			}
		}
		
		const user = userRes.data[0]
		
		if (user.role !== 'coach' && user.role !== 'admin') {
			return {
				code: -1,
				message: '只能删除教练和管理员账号'
			}
		}
		
		await db.collection('uni-id-users').doc(id).remove()
		
		return {
			code: 0,
			message: '删除成功'
		}
	} catch (e) {
		return {
			code: -1,
			message: e.message || '删除失败'
		}
	}
}

async function resetPassword(db, data, auth) {
	const { id, new_password } = data
	
	try {
		if (!new_password) {
			return {
				code: -1,
				message: '新密码不能为空'
			}
		}
		
		const passwordHash = crypto.createHash('sha256').update(new_password).digest('hex')
		
		await db.collection('uni-id-users').doc(id).update({
			password: passwordHash
		})
		
		return {
			code: 0,
			message: '密码重置成功'
		}
	} catch (e) {
		console.error('resetPassword error:', e)
		return {
			code: -1,
			message: e.message || '重置失败'
		}
	}
}
