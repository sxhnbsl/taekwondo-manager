'use strict';

const { verifyToken } = require('./auth-utils')

exports.main = async (event, context) => {
	const { action, data, _token } = event
	const db = uniCloud.database()
	
	switch(action) {
		case 'getList':
			return await getList(db, data, _token)
		case 'getDetail':
			return await getDetail(db, data, _token)
		case 'getPackages':
			return await getPackages(db, data, _token)
		case 'create':
			return await create(db, data, _token)
		case 'update':
			return await update(db, data, _token)
		case 'delete':
			return await deleteStudent(db, data, _token)
		case 'searchByNameAndMobile':
			return await searchByNameAndMobile(db, data, _token)
		case 'bindToParent':
			return await bindToParent(db, data, _token)
		default:
			return {
				code: -1,
				message: '未知操作'
			}
	}
}

async function checkAndUpdateExpiredPackages(db) {
	const now = new Date()
	
	// 查找所有过期的课时包
	const expiredPackages = await db.collection('hours_packages')
		.where({
			status: 'active',
			is_unlimited: false,
			expire_at: db.command.lt(now)
		})
		.get()
	
	const expiredPackageList = expiredPackages.data || []
	
	// 处理每个过期的课时包
	for (const pkg of expiredPackageList) {
		// 跳过已经处理过的课时包（包括状态为expired或expire_processed为true的）
		if (pkg.status === 'expired' || pkg.expire_processed === true) {
			console.log(`跳过已处理的课时包: ${pkg._id}, status: ${pkg.status}, expire_processed: ${pkg.expire_processed}`)
			continue
		}
		
		// 先检查学生是否存在
		const studentRes = await db.collection('students').doc(pkg.student_id).get()
		let student = null
		if (studentRes.data) {
			if (Array.isArray(studentRes.data)) {
				student = studentRes.data.length > 0 ? studentRes.data[0] : null
			} else {
				student = studentRes.data
			}
		}
		
		if (!student) {
			console.warn(`学生不存在: ${pkg.student_id}, 跳过处理`)
			// 即使学生不存在，也要将课时包标记为已处理
			await db.collection('hours_packages').doc(pkg._id).update({
				status: 'expired',
				expire_processed: true,
				update_time: now
			})
			continue
		}
		
		if (pkg.remaining > 0) {
			// 计算过期扣减的课时数
			const expireDeduct = pkg.remaining
			
			// 添加重试机制
			const maxRetries = 3
			let retryCount = 0
			let success = false
			
			while (retryCount < maxRetries && !success) {
				console.log(`开始事务处理课时包: ${pkg._id}, 重试次数: ${retryCount + 1}`)
				try {
					// 开始事务
					const transaction = await db.startTransaction()
					let transactionRolledBack = false
					
					try {
						// 先查询课时包的最新状态，确保在事务内获取最新数据
						const latestPkgRes = await transaction.collection('hours_packages').doc(pkg._id).get()
						let latestPkg = null
						if (latestPkgRes.data) {
							if (Array.isArray(latestPkgRes.data)) {
								latestPkg = latestPkgRes.data.length > 0 ? latestPkgRes.data[0] : null
							} else {
								latestPkg = latestPkgRes.data
							}
						}
						
						// 如果课时包已经被处理过，跳过这个事务
						if (!latestPkg || latestPkg.status === 'expired' || latestPkg.expire_processed === true) {
							console.log(`课时包已被其他事务处理，跳过: ${pkg._id}`)
							await transaction.commit()
							success = true
							continue
						}
						
						console.log(`更新课时包状态: ${pkg._id}, 扣减 ${expireDeduct} 课时`)
						// 更新课时包状态和剩余课时
						const currentUsed = latestPkg.used || 0
						const newUsed = currentUsed + expireDeduct
						await transaction.collection('hours_packages').doc(pkg._id).update({
							status: 'expired',
							remaining: 0,
							used: newUsed,
							expire_processed: true,
							update_time: now
						})
						
						// 获取学生当前课时信息
						const studentRes = await transaction.collection('students').doc(latestPkg.student_id).get()
						let student = null
						if (studentRes.data) {
							if (Array.isArray(studentRes.data)) {
								student = studentRes.data.length > 0 ? studentRes.data[0] : null
							} else {
								student = studentRes.data
							}
						}
						
						if (student) {
							const beforeHours = student.remaining_hours || 0
							const beforeUsedHours = student.used_hours || 0
							const afterHours = beforeHours - expireDeduct
							const afterUsedHours = beforeUsedHours + expireDeduct
							
							// 更新学生的课时信息
							await transaction.collection('students').doc(latestPkg.student_id).update({
								total_hours: afterHours,
								remaining_hours: afterHours,
								used_hours: afterUsedHours,
								update_time: now
							})
							
							// 添加过期扣减记录到class_records
							await transaction.collection('class_records').add({
								student_id: latestPkg.student_id,
								hours: expireDeduct,
								days: 0,
								unit: 'lesson',
								type: 'expire',
								reason: '课时包过期自动扣减',
								before_hours: beforeHours,
								after_hours: afterHours,
								before_days: student.remaining_days || 0,
								after_days: student.remaining_days || 0,
								package_id: pkg._id,
								operator_id: 'system',
								create_time: now
							})
							console.log(`添加扣减记录成功: ${pkg._id}, 扣减 ${expireDeduct} 课时`)
						} else {
							console.warn(`学生不存在: ${latestPkg.student_id}, 回滚事务`)
							if (!transactionRolledBack) {
								try {
									await transaction.rollback()
								} catch (rollbackError) {
									console.warn(`事务回滚失败:`, rollbackError)
								}
								transactionRolledBack = true
							}
							throw new Error(`学生不存在: ${latestPkg.student_id}`)
						}
						
						// 提交事务
						console.log(`提交事务处理课时包: ${pkg._id}`)
						await transaction.commit()
						success = true
					} catch (e) {
						// 回滚事务
						if (!transactionRolledBack) {
							try {
								await transaction.rollback()
							} catch (rollbackError) {
								console.warn(`事务回滚失败:`, rollbackError)
							}
							transactionRolledBack = true
						}
						throw e
					}
				} catch (e) {
					retryCount++
					if (retryCount >= maxRetries) {
						console.error(`处理过期课时包失败，已重试 ${maxRetries} 次:`, e)
					} else {
						console.warn(`处理过期课时包失败，准备重试 (${retryCount}/${maxRetries}):`, e.message)
						// 等待一段时间后重试
						await new Promise(resolve => setTimeout(resolve, 100 * retryCount))
					}
				}
			}
		} else {
			// 如果剩余课时为0，只更新状态
			await db.collection('hours_packages').doc(pkg._id).update({
				status: 'expired',
				expire_processed: true,
				update_time: now
			})
		}
	}
}

async function getList(db, data, token) {
	const { keyword = '', ids, page = 1, pageSize = 20 } = data
	
	try {
		const auth = verifyToken(token)
		if (!auth) {
			return {
				code: -1,
				message: '未登录'
			}
		}
		
		// 先检查并更新过期的课时包 - 暂时注释掉以提高性能
		// await checkAndUpdateExpiredPackages(db)
		
		let query = db.collection('students')
		
		if (auth.role === 'parent') {
			query = query.where({
				parent_user_id: auth.uid
			})
		} else if (auth.role !== 'admin' && auth.role !== 'coach') {
			return {
				code: -1,
				message: '权限不足'
			}
		}
		
		if (ids && ids.length > 0) {
			query = query.where({
				_id: db.command.in(ids)
			})
		}
		
		if (keyword) {
			query = query.where({
				name: new RegExp(keyword, 'i')
			})
		}
		
		const countRes = await query.count()
		const total = countRes.total
		
		const listRes = await query
			.orderBy('create_time', 'desc')
			.skip((page - 1) * pageSize)
			.limit(pageSize)
			.get()
		
		// 直接从学生表读取课时数据（因为所有操作都同步更新了学生表）
		for (const student of listRes.data) {
			const remaining_hours = student.remaining_hours || 0
			const used_hours = student.used_hours || 0
			const remaining_days = student.remaining_days || 0
			const used_days = student.used_days || 0
			const remaining_private_hours = student.remaining_private_hours || 0
			const used_private_hours = student.used_private_hours || 0
			
			student.total_hours = remaining_hours
			student.remaining_hours = remaining_hours
			student.used_hours = used_hours
			student.total_days = remaining_days
			student.remaining_days = remaining_days
			student.used_days = used_days
			student.total_private_hours = remaining_private_hours
			student.remaining_private_hours = remaining_private_hours
			student.used_private_hours = used_private_hours
		}
		
		return {
			code: 0,
			message: '获取成功',
			data: {
				list: listRes.data,
				total,
				page,
				pageSize
			}
		}
	} catch (e) {
		return {
			code: -1,
			message: e.message || '获取失败'
		}
	}
}

async function getPackages(db, data, token) {
	const { student_id } = data
	
	try {
		const auth = verifyToken(token)
		if (!auth) {
			return {
				code: -1,
				message: '未登录'
			}
		}
		
		if (auth.role === 'parent') {
			const studentRes = await db.collection('students').doc(student_id).get()
			if (!studentRes.data || studentRes.data.length === 0) {
				return {
					code: -1,
					message: '学生不存在'
				}
			}
			const student = studentRes.data[0]
			if (student.parent_user_id !== auth.uid) {
				return {
					code: -1,
					message: '权限不足'
				}
			}
		} else if (auth.role !== 'admin' && auth.role !== 'coach') {
			return {
				code: -1,
				message: '权限不足'
			}
		}
		
		// 先检查并更新过期的课时包 - 暂时注释掉以提高性能
		// await checkAndUpdateExpiredPackages(db)
		
		const res = await db.collection('hours_packages')
			.where({ student_id })
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
		return {
			code: -1,
			message: e.message || '获取失败'
		}
	}
}

async function getDetail(db, data, token) {
	const { id } = data
	
	try {
		const auth = verifyToken(token)
		if (!auth) {
			return {
				code: -1,
				message: '未登录'
			}
		}
		
		// 先检查并更新过期的课时包 - 暂时注释掉以提高性能
		// await checkAndUpdateExpiredPackages(db)
		
		const res = await db.collection('students').doc(id).get()
		
		if (!res.data || res.data.length === 0) {
			return {
				code: -1,
				message: '学生不存在'
			}
		}
		
		const student = res.data[0]
		
		if (auth.role === 'parent' && student.parent_user_id !== auth.uid) {
			return {
				code: -1,
				message: '无权查看'
			}
		}
		
		// 从学生表直接读取课时数据（因为所有操作都同步更新了学生表）
		const remaining_hours = student.remaining_hours || 0
		const used_hours = student.used_hours || 0
		const remaining_days = student.remaining_days || 0
		const used_days = student.used_days || 0
		const remaining_private_hours = student.remaining_private_hours || 0
		const used_private_hours = student.used_private_hours || 0
		
		student.total_hours = remaining_hours
		student.remaining_hours = remaining_hours
		student.used_hours = used_hours
		student.total_days = remaining_days
		student.remaining_days = remaining_days
		student.used_days = used_days
		student.total_private_hours = remaining_private_hours
		student.remaining_private_hours = remaining_private_hours
		student.used_private_hours = used_private_hours
		
		return {
			code: 0,
			message: '获取成功',
			data: student
		}
	} catch (e) {
		return {
			code: -1,
			message: e.message || '获取失败'
		}
	}
}

async function create(db, data, token) {
	const { name, gender, birth_date, level, parent_mobile, parent_name, notes, initial_hours, initial_days, initial_private_hours, hours_is_unlimited, hours_expire_date, days_is_unlimited, days_expire_date } = data
	
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
		
		const res = await db.collection('students').add({
			name,
			gender,
			birth_date: birth_date ? new Date(birth_date) : null,
			level: level || '',
			parent_mobile,
			parent_name: parent_name || '',
			notes: notes || '',
			parent_user_id: '',
			create_time: new Date(),
			update_time: new Date()
		})
		
		const studentId = res.id
		
		console.log('创建学生成功，studentId:', studentId)
		console.log('initial_hours:', initial_hours, 'initial_days:', initial_days)
		console.log('hours_is_unlimited:', hours_is_unlimited, 'hours_expire_date:', hours_expire_date)
		console.log('days_is_unlimited:', days_is_unlimited, 'days_expire_date:', days_expire_date)
		
		if (studentId) {
			let totalHours = 0
			let totalDays = 0
			let totalPrivateHours = 0
			
			if (initial_hours && parseInt(initial_hours) > 0) {
				const hours = parseInt(initial_hours)
				totalHours = hours
				const isLimited = !hours_is_unlimited
				
				// 验证限时课时必须设置到期日期
				if (isLimited && !hours_expire_date) {
					return {
						code: -1,
						message: '限时课时必须设置到期日期'
					}
				}
				
				const endDate = isLimited && hours_expire_date ? new Date(hours_expire_date) : null
				console.log('创建课时包，课时数:', hours, '是否限时:', isLimited, '结束日期:', endDate)
				await db.collection('hours_packages').add({
					student_id: studentId,
					total: hours,
					remaining: hours,
					used: 0,
					unit: 'lesson',
					is_unlimited: hours_is_unlimited,
					expire_at: endDate,
					status: 'active',
					create_time: new Date(),
					update_time: new Date()
				})
			}
			
			if (initial_days && parseInt(initial_days) > 0) {
				const days = parseInt(initial_days)
				totalDays = days
				const isLimited = !days_is_unlimited
				
				// 验证限时课时必须设置到期日期
				if (isLimited && !days_expire_date) {
					return {
						code: -1,
						message: '限时天数必须设置到期日期'
					}
				}
				
				const endDate = isLimited && days_expire_date ? new Date(days_expire_date) : null
				console.log('创建天数课时包，天数:', days, '是否限时:', isLimited, '结束日期:', endDate)
				await db.collection('hours_packages').add({
					student_id: studentId,
					total: days,
					remaining: days,
					used: 0,
					unit: 'day',
					is_unlimited: days_is_unlimited,
					expire_at: endDate,
					status: 'active',
					create_time: new Date(),
					update_time: new Date()
				})
			}
			
			if (initial_private_hours && parseInt(initial_private_hours) > 0) {
				const privateHours = parseInt(initial_private_hours)
				totalPrivateHours = privateHours
				console.log('创建私教课时包，课时数:', privateHours)
				await db.collection('hours_packages').add({
					student_id: studentId,
					total: privateHours,
					remaining: privateHours,
					used: 0,
					unit: 'private',
					is_unlimited: true, // 私教课时默认不限时
					expire_at: null,
					status: 'active',
					create_time: new Date(),
					update_time: new Date()
				})
			}
			
			// 更新学生表的课时统计字段
			if (totalHours > 0 || totalDays > 0 || totalPrivateHours > 0) {
				const updateData = {
					total_hours: totalHours,
					remaining_hours: totalHours,
					used_hours: 0,
					total_days: totalDays,
					remaining_days: totalDays,
					used_days: 0,
					update_time: new Date()
				}
				
				// 添加私教课时统计字段
				if (totalPrivateHours > 0) {
					updateData.total_private_hours = totalPrivateHours
					updateData.remaining_private_hours = totalPrivateHours
					updateData.used_private_hours = 0
				}
				
				await db.collection('students').doc(studentId).update(updateData)
				console.log('更新学生课时统计，总课时:', totalHours, '总天数:', totalDays, '总私教课时:', totalPrivateHours)
			}
		}
		
		return {
			code: 0,
			message: '创建成功',
			data: {
				id: studentId
			}
		}
	} catch (e) {
		return {
			code: -1,
			message: e.message || '创建失败'
		}
	}
}

async function update(db, data, token) {
	const { id, name, gender, birth_date, level, parent_mobile, parent_name, notes } = data
	
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
		
		await db.collection('students').doc(id).update({
			name,
			gender,
			birth_date: birth_date ? new Date(birth_date) : null,
			level: level || '',
			parent_mobile,
			parent_name: parent_name || '',
			notes: notes || '',
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

async function deleteStudent(db, data, token) {
	const { id } = data
	
	try {
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
		
		await db.collection('students').doc(id).remove()
		
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

async function searchByNameAndMobile(db, data, token) {
	const { name, parent_mobile, mobile } = data
	
	try {
		const auth = verifyToken(token)
		if (!auth) {
			return {
				code: -1,
				message: '未登录'
			}
		}
		
		let query = db.collection('students')
		
		if (auth.role === 'parent') {
			const mobileValue = parent_mobile || mobile
			if (mobileValue) {
				query = query.where({
					parent_mobile: mobileValue
				})
			}
		} else if (auth.role === 'admin' || auth.role === 'coach') {
			const conditions = {}
			
			if (name) {
				conditions.name = new RegExp(name, 'i')
			}
			
			const mobileValue = parent_mobile || mobile
			if (mobileValue) {
				conditions.parent_mobile = mobileValue
			}
			
			if (Object.keys(conditions).length > 0) {
				query = query.where(conditions)
			}
		} else {
			return {
				code: -1,
				message: '权限不足'
			}
		}
		
		const res = await query.limit(20).get()
		
		// 为每个学生计算课时信息
		const studentsWithHours = await Promise.all(res.data.map(async (student) => {
			// 查询该学生的课时包（不限制状态，调试用）
			const hoursRes = await db.collection('hours_packages').where({
				student_id: student._id
			}).get()
			
			// 计算剩余课时和已用课时
			let lessonRemaining = 0
			let lessonUsed = 0
			let dayRemaining = 0
			let dayUsed = 0
			let privateRemaining = 0
			let privateUsed = 0
			
			hoursRes.data.forEach(pkg => {
				// 处理新结构的课时包
				if (pkg.remaining_hours !== undefined) {
					if (pkg.is_limited) {
						// 天数课时
						dayRemaining += pkg.remaining_hours || 0
						dayUsed += pkg.used_hours || 0
					} else {
						// 节数课时
						lessonRemaining += pkg.remaining_hours || 0
						lessonUsed += pkg.used_hours || 0
					}
				} else {
					// 处理旧结构的课时包
					if (pkg.unit === 'day') {
						// 天数课时
						dayRemaining += pkg.remaining || 0
						dayUsed += (pkg.total || 0) - (pkg.remaining || 0)
					} else if (pkg.unit === 'private') {
						// 私教课时
						privateRemaining += pkg.remaining || 0
						privateUsed += (pkg.total || 0) - (pkg.remaining || 0)
					} else {
						// 节数课时
						lessonRemaining += pkg.remaining || 0
						lessonUsed += (pkg.total || 0) - (pkg.remaining || 0)
					}
				}
			})
			
			return {
				...student,
				hours_info: {
					lesson: {
						remaining: lessonRemaining,
						used: lessonUsed
					},
					day: {
						remaining: dayRemaining,
						used: dayUsed
					},
					private: {
						remaining: privateRemaining,
						used: privateUsed
					}
				}
			}
		}))
		
		return {
			code: 0,
			message: '搜索成功',
			data: {
				list: studentsWithHours
			}
		}
	} catch (e) {
		return {
			code: -1,
			message: e.message || '搜索失败'
		}
	}
}

async function bindToParent(db, data, token) {
	const { student_id, parent_user_id } = data
	
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
				message: '只有家长可以绑定'
			}
		}
		
		const studentRes = await db.collection('students').doc(student_id).get()
		if (!studentRes.data || studentRes.data.length === 0) {
			return {
				code: -1,
				message: '学生不存在'
			}
		}
		
		await db.collection('students').doc(student_id).update({
			parent_user_id: parent_user_id || auth.uid,
			update_time: new Date()
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
