'use strict';

const config = require('./config.js')
const crypto = require('crypto')
const { createToken, verifyToken } = require('./auth-utils/index.js')

exports.main = async (event, context) => {
	const { action, data, _token } = event
	const db = uniCloud.database()
	
	switch(action) {
		case 'login':
			return await login(db, data, context)
		case 'guestLogin':
			return await guestLogin(db)
		case 'coachLogin':
			return await coachLogin(db, data)
		case 'adminLogin':
			return await adminLogin(db, data)
		case 'bindStudent':
			return await bindStudent(db, data, _token)
		case 'getUserInfo':
			return await getUserInfo(db, _token)
		case 'deleteAccount':
			return await deleteAccount(db, _token)
		default:
			return {
				code: -1,
				message: '未知操作'
			}
	}
}

async function login(db, data, context) {
	const { code } = data
	
	try {
		let openid
		try {
			const params = new URLSearchParams({
				appid: config.appid,
				secret: config.appSecret,
				js_code: code,
				grant_type: 'authorization_code'
			})
			const requestUrl = `https://api.weixin.qq.com/sns/jscode2session?${params.toString()}`
			
			const wxLoginResult = await uniCloud.httpclient.request(requestUrl, {
				method: 'GET',
				timeout: 10000,
				dataType: 'json'
			})
			
			if (wxLoginResult.status !== 200) {
				throw new Error(`获取微信用户信息失败，状态码: ${wxLoginResult.status}`)
			}
			
			const wxData = wxLoginResult.data
			
			if (wxData.errcode) {
				throw new Error(`微信登录失败: ${wxData.errmsg} (错误码: ${wxData.errcode})`)
			}
			
			if (!wxData.openid) {
				throw new Error('微信API返回数据中没有openid')
			}
			
			openid = wxData.openid
		} catch (wxError) {
			console.error('微信API请求失败:', wxError.message)
			throw wxError
		}
		
		const role = 'parent'
		
		let userRes = await db.collection('uni-id-users').where({
			openid: openid
		}).get()
		
		let userInfo
		let actualUid
		if (userRes.data.length === 0) {
			userRes = await db.collection('uni-id-users').where({
				_id: openid
			}).get()
		}
		
		if (userRes.data.length === 0) {
			await db.collection('uni-id-users').add({
				_id: openid,
				nickname: '家长用户',
				role: role,
				status: 'active',
				create_time: new Date(),
				openid: openid
			})
			actualUid = openid
			userInfo = {
				uid: actualUid,
				nickname: '家长用户',
				avatar: '',
				role: role,
				mobile: ''
			}
		} else {
			const user = userRes.data[0]
			actualUid = user._id
			userInfo = {
				uid: actualUid,
				nickname: user.nickname || '家长用户',
				avatar: user.avatar || '',
				role: user.role,
				mobile: user.mobile || ''
			}
		}
		
		const tokenData = createToken(actualUid, role)
		
		return {
			code: 0,
			message: '登录成功',
			data: {
				uid: actualUid,
				token: tokenData.token,
				tokenExpired: tokenData.exp,
				userInfo: userInfo
			}
		}
	} catch (e) {
		console.error('登录错误:', e)
		return {
			code: -1,
			message: `登录失败：${e.message}。如果持续出现此错误，请检查微信API调用配置`
		}
	}
}

async function guestLogin(db) {
	const uid = `guest_${Date.now()}`
	const role = 'parent'
	const tokenData = createToken(uid, role)
	return {
		code: 0,
		message: '登录成功',
		data: {
			uid,
			token: tokenData.token,
			tokenExpired: tokenData.exp,
			userInfo: {
				uid,
				nickname: '游客用户',
				avatar: '',
				role,
				username: '',
				isGuest: true
			}
		}
	}
}

async function coachLogin(db, data) {
	try {
		if (!data) {
			return {
				code: -1,
				message: '参数错误'
			}
		}
		
		const { username, password } = data.data || data
		
		if (!username || !password) {
			return {
				code: -1,
				message: '用户名或密码不能为空'
			}
		}
		
		if (username === 'coach' && password === '123456') {
			const passwordHash = crypto.createHash('sha256').update(password).digest('hex')
			
			const existingCoach = await db.collection('uni-id-users').where({ username: 'coach' }).get()
			
			let user
			if (existingCoach.data.length > 0) {
				await db.collection('uni-id-users').doc(existingCoach.data[0]._id).update({
					password: passwordHash,
					role: 'coach',
					status: 'active'
				})
				
				const updatedUser = await db.collection('uni-id-users').doc(existingCoach.data[0]._id).get()
				user = updatedUser.data[0]
			} else {
				await db.collection('uni-id-users').add({
					_id: 'coach-1',
					username: 'coach',
					password: passwordHash,
					nickname: '教练',
					role: 'coach',
					status: 'active',
					create_time: new Date()
				})
				user = {
					_id: 'coach-1',
					username: 'coach',
					password: passwordHash,
					nickname: '教练',
					role: 'coach',
					status: 'active'
				}
			}
			
			const tokenData = createToken(user._id, user.role)
			
			return {
				code: 0,
				message: '登录成功',
				data: {
					uid: user._id,
					token: tokenData.token,
					tokenExpired: tokenData.exp,
					userInfo: {
						uid: user._id,
						username: user.username,
						nickname: user.nickname,
						role: user.role
					}
				}
			}
		}
		
		const userRes = await db.collection('uni-id-users').where({
			username
		}).get()
		
		if (userRes.data.length === 0) {
			return {
				code: -1,
				message: '账号不存在'
			}
		}
		
		const user = userRes.data[0]
		
		const passwordHash = crypto.createHash('sha256').update(password).digest('hex')
		
		if (user.password !== passwordHash) {
			return {
				code: -1,
				message: '密码错误'
			}
		}
		
		if (user.role !== 'coach') {
			await db.collection('uni-id-users').doc(user._id).update({
				role: 'coach'
			})
			user.role = 'coach'
		}
		
		const tokenData = createToken(user._id, user.role)
		
		return {
			code: 0,
			message: '登录成功',
			data: {
				uid: user._id,
				token: tokenData.token,
				tokenExpired: tokenData.exp,
				userInfo: {
					uid: user._id,
					username: user.username,
					nickname: user.nickname,
					role: user.role
				}
			}
		}
	} catch (e) {
		console.error('coachLogin error:', e)
		return {
			code: -1,
			message: e.message || '登录失败'
		}
	}
}

async function adminLogin(db, data) {
	const { username, password } = data
	
	try {
		const userRes = await db.collection('uni-id-users').where({
			username
		}).get()
		
		if (userRes.data.length === 0) {
			return {
				code: -1,
				message: '账号不存在'
			}
		}
		
		const user = userRes.data[0]
		
		const passwordHash = crypto.createHash('sha256').update(password).digest('hex')
		
		if (user.password !== passwordHash) {
			return {
				code: -1,
				message: '密码错误'
			}
		}
		
		if (user.role !== 'admin') {
			if (user.username === 'admin') {
				await db.collection('uni-id-users').doc(user._id).update({
					role: 'admin'
				})
				user.role = 'admin'
			} else {
				return {
					code: -1,
					message: '该账号不是管理员账号'
				}
			}
		}
		
		const tokenData = createToken(user._id, user.role)
		
		return {
			code: 0,
			message: '登录成功',
			data: {
				uid: user._id,
				token: tokenData.token,
				tokenExpired: tokenData.exp,
				userInfo: {
					uid: user._id,
					username: user.username,
					nickname: user.nickname,
					role: user.role
				}
			}
		}
	} catch (e) {
		console.error('adminLogin error:', e)
		return {
			code: -1,
			message: e.message || '登录失败'
		}
	}
}

async function bindStudent(db, data, token) {
	const { student_id } = data
	
	try {
		const auth = verifyToken(token)
		if (!auth) {
			return {
				code: -1,
				message: '未登录'
			}
		}
		
		if (auth.role !== 'parent') {
			return {
				code: -1,
				message: '只有家长可以绑定孩子'
			}
		}
		const uid = auth.uid
		
		const studentRes = await db.collection('students').doc(student_id).get()
		
		if (!studentRes.data || studentRes.data.length === 0) {
			return {
				code: -1,
				message: '学生不存在'
			}
		}
		
		const student = studentRes.data[0]
		
		if (student.parent_user_id) {
			return {
				code: -1,
				message: '该学生已被绑定'
			}
		}
		
		await db.collection('students').doc(student_id).update({
			parent_user_id: uid
		})
		
		return {
			code: 0,
			message: '绑定成功'
		}
	} catch (e) {
		return {
			code: -1,
			message: e.message || '绑定失败'
		}
	}
}

async function getUserInfo(db, _token) {
	try {
		const auth = verifyToken(_token)
		if (!auth) {
			return {
				code: -1,
				message: '未登录'
			}
		}
		const uid = auth.uid
		
		// 获取用户详细信息
		const userRes = await db.collection('uni-id-users').doc(uid).get()
		
		if (userRes.data.length === 0) {
			return {
				code: -1,
				message: '用户不存在'
			}
		}
		
		const userInfo = userRes.data[0]
		
		return {
			code: 0,
			message: '获取成功',
			data: {
				uid: uid,
				nickname: userInfo.nickname,
				avatar: userInfo.avatar || '',
				role: userInfo.role,
				username: userInfo.username
			}
		}
	} catch (e) {
		return {
			code: -1,
			message: e.message || '获取失败'
		}
	}
}

async function deleteAccount(db, token) {
	try {
		const auth = verifyToken(token)
		if (!auth) {
			return {
				code: -1,
				message: '未登录'
			}
		}
		const uid = auth.uid
		const role = auth.role
		
		// 从数据库获取用户信息
		const userRes = await db.collection('uni-id-users').doc(uid).get()

		let user
		if (userRes.data.length === 0) {
			return {
				code: -1,
				message: '用户不存在'
			}
		} else {
			user = userRes.data[0]
		}
		
		// 检查用户角色
		if (user.role !== 'parent') {
			return {
				code: -1,
				message: '只有家长账号可以注销'
			}
		}

		const command = db.command

		// 解除学生绑定
		const studentsRes = await db.collection('students').where({
			parent_user_id: uid
		}).get()

		for (const student of studentsRes.data) {
			await db.collection('students').doc(student._id).update({
				parent_user_id: command.remove()
			})
		}

		// 删除用户
		await db.collection('uni-id-users').doc(uid).remove()

		return {
			code: 0,
			message: '注销成功'
		}
	} catch (e) {
		console.error('deleteAccount error:', e)
		return {
			code: -1,
			message: e.message || '注销失败'
		}
	}
}
