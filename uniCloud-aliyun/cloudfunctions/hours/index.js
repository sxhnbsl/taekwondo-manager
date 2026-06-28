'use strict';

const { verifyToken } = require('./auth-utils')

exports.main = async (event, context) => {
	const { action, data, _token } = event
	const db = uniCloud.database()
	
	switch(action) {
		case 'getRecords':
			return await getRecords(db, data, _token)
		case 'add':
			return await addHours(db, data, _token)
		case 'consume':
			return await consumeHours(db, data, _token)
		case 'undoConsume':
			return await undoConsume(db, data, _token)
		case 'undoAdd':
			return await undoAdd(db, data, _token)
		case 'getExpiringPackages':
			return await getExpiringPackages(db, data, _token)
		case 'deleteExpiredPackages':
			return await deleteExpiredPackages(db, data, _token)
		default:
			return {
				code: -1,
				message: '未知操作'
			}
	}
}

async function checkAndUpdateExpiredPackages(db) {
	const now = new Date()
	console.log(`开始处理过期课时包，当前时间: ${now}`)
	
	// 查找所有过期的课时包
	const expiredPackages = await db.collection('hours_packages')
		.where({
			status: 'active',
			is_unlimited: false,
			expire_at: db.command.lt(now)
		})
		.get()
	
	const expiredPackageList = expiredPackages.data || []
	console.log(`找到 ${expiredPackageList.length} 个过期的课时包`)
	
	// 处理每个过期的课时包
	for (const pkg of expiredPackageList) {
		console.log(`处理课时包: ${pkg._id}, status: ${pkg.status}, expire_processed: ${pkg.expire_processed}, remaining: ${pkg.remaining}, expire_at: ${pkg.expire_at}`)
		
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
				try {
					// 开始事务
					const transaction = await db.startTransaction()
					console.log(`开始事务处理课时包: ${pkg._id}, 重试次数: ${retryCount + 1}`)
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
						
						// 更新课时包状态和剩余课时
						console.log(`更新课时包状态: ${pkg._id}, 扣减 ${expireDeduct} 课时`)
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
							console.log(`更新学生课时: ${latestPkg.student_id}, 扣减前: ${beforeHours}, 扣减后: ${afterHours}`)
							
							// 更新学生的课时信息
							await transaction.collection('students').doc(latestPkg.student_id).update({
								total_hours: afterHours,
								remaining_hours: afterHours,
								used_hours: afterUsedHours,
								update_time: now
							})
							
							// 添加过期扣减记录到class_records
							console.log(`添加过期扣减记录: ${latestPkg.student_id}, 扣减 ${expireDeduct} 课时`)
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
								await transaction.rollback()
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

async function applyConsumePackages(db, studentId, unit, quantity) {
	const command = db.command
	const packagesRes = await db.collection('hours_packages')
		.where({
			student_id: studentId,
			unit,
			status: 'active',
			remaining: command.gt(0)
		})
		.get()
	const packages = packagesRes.data || []
	packages.sort((a, b) => {
		const aUnlimited = !!a.is_unlimited
		const bUnlimited = !!b.is_unlimited
		if (aUnlimited !== bUnlimited) {
			return aUnlimited ? 1 : -1
		}
		const aTime = a.expire_at ? new Date(a.expire_at).getTime() : Number.MAX_SAFE_INTEGER
		const bTime = b.expire_at ? new Date(b.expire_at).getTime() : Number.MAX_SAFE_INTEGER
		return aTime - bTime
	})
	let remainingNeed = quantity
	const deducts = []
	for (const pkg of packages) {
		if (remainingNeed <= 0) break
		const available = pkg.remaining || 0
		if (available <= 0) continue
		const deduct = Math.min(available, remainingNeed)
		const nextRemaining = available - deduct
		const currentUsed = pkg.used || 0
		const newUsed = currentUsed + deduct
		const updateData = {
				remaining: nextRemaining,
				used: newUsed,
				update_time: new Date()
			}
			if (nextRemaining <= 0) {
				updateData.status = 'consumed'
			}
			await db.collection('hours_packages').doc(pkg._id).update(updateData)
		deducts.push({ package_id: pkg._id, quantity: deduct })
		remainingNeed -= deduct
	}
	return deducts
}

async function restorePackages(db, packageDeducts) {
	if (!Array.isArray(packageDeducts) || packageDeducts.length === 0) return
	for (const item of packageDeducts) {
		if (!item || !item.package_id || !item.quantity) continue
		
		// 先查询课时包当前状态
		const pkgRes = await db.collection('hours_packages').doc(item.package_id).get()
		let pkg = null
		if (pkgRes.data) {
			if (Array.isArray(pkgRes.data)) {
				pkg = pkgRes.data.length > 0 ? pkgRes.data[0] : null
			} else {
				pkg = pkgRes.data
			}
		}
		
		if (pkg) {
			const currentRemaining = pkg.remaining || 0
			const currentUsed = pkg.used || 0
			const newRemaining = currentRemaining + item.quantity
			const newUsed = Math.max(0, currentUsed - item.quantity)
			
			await db.collection('hours_packages').doc(item.package_id).update({
				remaining: newRemaining,
				used: newUsed,
				status: 'active',
				update_time: new Date()
			})
		}
	}
}

async function getRecords(db, data, token) {
	const { student_id, page = 1, pageSize = 20 } = data
	
	try {
		const auth = verifyToken(token)
		if (!auth) {
			return {
				code: -1,
				message: '未登录'
			}
		}
		if (auth.role === 'parent') {
			if (!student_id) {
				return {
					code: -1,
					message: '权限不足'
				}
			}
			const studentRes = await db.collection('students').doc(student_id).get()
			if (!studentRes.data) {
				return {
					code: -1,
					message: '学生不存在'
				}
			}
			let student = studentRes.data
			if (Array.isArray(student)) {
				student = student.length > 0 ? student[0] : null
			}
			if (!student) {
				return {
					code: -1,
					message: '学生不存在'
				}
			}
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
		
		let query = db.collection('class_records')
		
		if (student_id) {
			query = query.where({
				student_id
			})
		}
		
		// 家长端过滤掉已撤销的记录
		if (auth.role === 'parent') {
			query = query.where({
				status: db.command.neq('undone')
			})
		}
		
		const res = await query
			.skip((page - 1) * pageSize)
			.limit(pageSize)
			.orderBy('create_time', 'desc')
			.get()
		
		const totalRes = await query.count()
		
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

async function addHours(db, data, token) {
	const { student_id, hours, days, unit = 'lesson', reason, payment_method = 'cash', price = 0, is_unlimited, expire_at } = data
	
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
		const quantity = unit === 'day' ? parseInt(days || 0) : parseInt(hours || 0)
		if (!quantity || quantity <= 0) {
			return {
				code: -1,
				message: '数量必须大于0'
			}
		}
		const unlimited = is_unlimited === false ? false : true
		let expireDate = null
		if (!unlimited) {
			if (!expire_at) {
				return {
					code: -1,
					message: '到期日期不能为空'
				}
			}
			expireDate = new Date(expire_at.replace(/-/g, '/'))
			if (isNaN(expireDate.getTime())) {
				return {
					code: -1,
					message: '到期日期无效'
				}
			}
			// 验证到期日期不能早于当前时间
			const now = new Date()
			if (expireDate < now) {
				return {
					code: -1,
					message: '到期日期不能早于当前时间'
				}
			}
		}
		
		const studentRes = await db.collection('students').doc(student_id).get()
		if (!studentRes.data) {
			return {
				code: -1,
				message: '学生不存在'
			}
		}
		
		let student = null
		if (Array.isArray(studentRes.data)) {
			student = studentRes.data.length > 0 ? studentRes.data[0] : null
		} else {
			student = studentRes.data
		}
		
		if (!student) {
			return {
				code: -1,
				message: '学生不存在'
			}
		}
		
		const beforeHours = student.remaining_hours || 0
		const beforeDays = student.remaining_days || 0
		const beforePrivateHours = student.remaining_private_hours || 0
		const beforeUsedHours = student.used_hours || 0
		const beforeUsedDays = student.used_days || 0
		const beforeUsedPrivateHours = student.used_private_hours || 0
		const afterHours = unit === 'lesson' ? beforeHours + quantity : beforeHours
		const afterDays = unit === 'day' ? beforeDays + quantity : beforeDays
		const afterPrivateHours = unit === 'private' ? beforePrivateHours + quantity : beforePrivateHours
		
		const updateData = {
			update_time: new Date()
		}
		if (unit === 'lesson') {
			updateData.total_hours = afterHours
			updateData.used_hours = beforeUsedHours
			updateData.remaining_hours = afterHours
		} else if (unit === 'day') {
			updateData.total_days = afterDays
			updateData.used_days = beforeUsedDays
			updateData.remaining_days = afterDays
		} else if (unit === 'private') {
			updateData.total_private_hours = afterPrivateHours
			updateData.used_private_hours = beforeUsedPrivateHours
			updateData.remaining_private_hours = afterPrivateHours
		}
		await db.collection('students').doc(student_id).update(updateData)
		
		await db.collection('class_records').add({
			student_id,
			hours: unit === 'lesson' ? quantity : 0,
			days: unit === 'day' ? quantity : 0,
			private_hours: unit === 'private' ? quantity : 0,
			unit,
			type: 'add',
			reason: reason || '课时充值',
			before_hours: beforeHours,
			after_hours: afterHours,
			before_days: beforeDays,
			after_days: afterDays,
			before_private_hours: beforePrivateHours,
			after_private_hours: afterPrivateHours,
			operator_id: auth.uid,
			create_time: new Date()
		})
		
		await db.collection('hours_packages').add({
			student_id,
			unit,
			total: quantity,
			remaining: quantity,
			is_unlimited: unlimited,
			expire_at: unlimited ? null : expireDate,
			status: 'active',
			operator_id: auth.uid,
			create_time: new Date(),
			update_time: new Date()
		})
		
		if (price > 0 && unit === 'lesson') {
			await db.collection('purchase_records').add({
				student_id,
				hours: quantity,
				price,
				payment_method,
				status: 'paid',
				pay_time: new Date()
			})
		}
		
		return {
			code: 0,
			message: '添加成功',
			data: {
				remaining_hours: afterHours,
				remaining_days: afterDays
			}
		}
	} catch (e) {
		return {
			code: -1,
			message: e.message || '添加失败'
		}
	}
}

async function consumeHours(db, data, token) {
	const { student_id, course_id, hours = 1, days = 1, unit = 'lesson', reason } = data
	
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
		const studentRes = await db.collection('students').doc(student_id).get()
		if (!studentRes.data) {
			return {
				code: -1,
				message: '学生不存在'
			}
		}
		
		let student = null
		if (Array.isArray(studentRes.data)) {
			student = studentRes.data.length > 0 ? studentRes.data[0] : null
		} else {
			student = studentRes.data
		}
		
		if (!student) {
			return {
				code: -1,
				message: '学生不存在'
			}
		}
		
		const beforeHours = student.remaining_hours || 0
		const beforeDays = student.remaining_days || 0
		const beforePrivateHours = student.remaining_private_hours || 0
		const beforeUsedHours = student.used_hours || 0
		const beforeUsedDays = student.used_days || 0
		const beforeUsedPrivateHours = student.used_private_hours || 0
		const quantity = unit === 'day' ? parseInt(days || 0) : parseInt(hours || 0)
		if (!quantity || quantity <= 0) {
			return {
				code: -1,
				message: '数量必须大于0'
			}
		}
		
		if (unit === 'lesson' && beforeHours < quantity) {
			return {
				code: -1,
				message: '课时不足'
			}
		}
		if (unit === 'day' && beforeDays < quantity) {
			return {
				code: -1,
				message: '天数课时不足'
			}
		}
		if (unit === 'private' && beforePrivateHours < quantity) {
			return {
				code: -1,
				message: '私教课时不足'
			}
		}
		
		const afterHours = unit === 'lesson' ? beforeHours - quantity : beforeHours
		const afterDays = unit === 'day' ? beforeDays - quantity : beforeDays
		const afterPrivateHours = unit === 'private' ? beforePrivateHours - quantity : beforePrivateHours
		const afterUsedHours = unit === 'lesson' ? beforeUsedHours + quantity : beforeUsedHours
		const afterUsedDays = unit === 'day' ? beforeUsedDays + quantity : beforeUsedDays
		const afterUsedPrivateHours = unit === 'private' ? beforeUsedPrivateHours + quantity : beforeUsedPrivateHours
		
		const updateData = {
			update_time: new Date()
		}
		if (unit === 'lesson') {
			updateData.total_hours = afterHours
			updateData.used_hours = afterUsedHours
			updateData.remaining_hours = afterHours
		} else if (unit === 'day') {
			updateData.total_days = afterDays
			updateData.used_days = afterUsedDays
			updateData.remaining_days = afterDays
		} else if (unit === 'private') {
			updateData.total_private_hours = afterPrivateHours
			updateData.used_private_hours = afterUsedPrivateHours
			updateData.remaining_private_hours = afterPrivateHours
		}
		await db.collection('students').doc(student_id).update(updateData)
		
		const packageDeducts = await applyConsumePackages(db, student_id, unit, quantity)
		
		await db.collection('class_records').add({
			student_id,
			course_id,
			hours: unit === 'lesson' ? quantity : 0,
			days: unit === 'day' ? quantity : 0,
			private_hours: unit === 'private' ? quantity : 0,
			unit,
			type: 'consume',
			reason: reason || '上课消耗',
			before_hours: beforeHours,
			after_hours: afterHours,
			before_days: beforeDays,
			after_days: afterDays,
			before_private_hours: beforePrivateHours,
			after_private_hours: afterPrivateHours,
			package_deducts: packageDeducts,
			operator_id: auth.uid,
			create_time: new Date()
		})
		
		return {
			code: 0,
			message: '扣减成功',
			data: {
				remaining_hours: afterHours,
				remaining_days: afterDays
			}
		}
	} catch (e) {
		return {
			code: -1,
			message: e.message || '扣减失败'
		}
	}
}

async function undoConsume(db, data, token) {
	const { recordId, reason } = data
	
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
				message: '只有管理员可以撤销'
			}
		}
		
		// 查找扣减记录
		const recordRes = await db.collection('class_records').doc(recordId).get()
		if (!recordRes.data) {
			return {
				code: -1,
				message: '记录不存在'
			}
		}
		
		// 处理返回的数据，可能是数组或对象
		let record = recordRes.data
		if (Array.isArray(record)) {
			record = record.length > 0 ? record[0] : null
		}
		
		if (!record) {
			return {
				code: -1,
				message: '记录不存在'
			}
		}

		console.log('撤销操作 - 记录信息:', JSON.stringify(record))
		const recordType = record.type || record.change_type
		console.log('撤销操作 - 记录类型:', recordType)
		if (recordType !== 'consume') {
			return {
				code: -1,
				message: '只能撤销扣减记录'
			}
		}
		
		// 检查是否已撤销
		if (record.status === 'undone') {
			return {
				code: -1,
				message: '该记录已撤销'
			}
		}
		
		// 开始事务
		const transaction = await db.startTransaction()
		
		try {
			// 在事务中再次获取并检查记录状态，防止并发更新
			const txRecordRes = await transaction.collection('class_records').doc(recordId).get()
			let txRecord = txRecordRes.data
			if (Array.isArray(txRecord)) {
				txRecord = txRecord.length > 0 ? txRecord[0] : null
			}
			
			if (!txRecord) {
				await transaction.rollback()
				return {
					code: -1,
					message: '记录不存在'
				}
			}
			
			// 在事务中再次检查状态，确保没有被其他请求撤销
			if (txRecord.status === 'undone') {
				await transaction.rollback()
				return {
					code: -1,
					message: '该记录已撤销'
				}
			}
			
			// 获取当前学生信息
			const studentRes = await transaction.collection('students').doc(record.student_id).get()
			if (!studentRes.data) {
				await transaction.rollback()
				return {
					code: -1,
					message: '学生不存在'
				}
			}
			
			// 处理返回的数据，可能是数组或对象
			let student = studentRes.data
			if (Array.isArray(student)) {
				student = student.length > 0 ? student[0] : null
			}
			
			if (!student) {
				await transaction.rollback()
				return {
					code: -1,
					message: '学生不存在'
				}
			}
			
			const unit = record.unit || 'lesson'
			const currentUsedHours = student.used_hours || 0
			const currentUsedDays = student.used_days || 0
			const currentUsedPrivateHours = student.used_private_hours || 0
			const hoursToRestore = record.hours || 0
			const daysToRestore = record.days || 0
			const privateHoursToRestore = record.private_hours || 0
			const newUsedHours = unit === 'lesson' ? Math.max(0, currentUsedHours - hoursToRestore) : currentUsedHours
			const newRemainingHours = unit === 'lesson' ? (student.remaining_hours || 0) + hoursToRestore : (student.remaining_hours || 0)
			const newUsedDays = unit === 'day' ? Math.max(0, currentUsedDays - daysToRestore) : currentUsedDays
			const newRemainingDays = unit === 'day' ? (student.remaining_days || 0) + daysToRestore : (student.remaining_days || 0)
			const newUsedPrivateHours = unit === 'private' ? Math.max(0, currentUsedPrivateHours - privateHoursToRestore) : currentUsedPrivateHours
			const newRemainingPrivateHours = unit === 'private' ? (student.remaining_private_hours || 0) + privateHoursToRestore : (student.remaining_private_hours || 0)
			
			const updateData = {
				update_time: new Date()
			}
			if (unit === 'lesson') {
				updateData.total_hours = newRemainingHours
				updateData.used_hours = newUsedHours
				updateData.remaining_hours = newRemainingHours
			} else if (unit === 'day') {
				updateData.total_days = newRemainingDays
				updateData.used_days = newUsedDays
				updateData.remaining_days = newRemainingDays
			} else if (unit === 'private') {
				updateData.total_private_hours = newRemainingPrivateHours
				updateData.used_private_hours = newUsedPrivateHours
				updateData.remaining_private_hours = newRemainingPrivateHours
			}
			await transaction.collection('students').doc(record.student_id).update(updateData)
			
			if (Array.isArray(record.package_deducts) && record.package_deducts.length > 0) {
				for (const item of record.package_deducts) {
					if (!item || !item.package_id || !item.quantity) continue
					
					// 先查询课时包的结构
						const pkgRes = await transaction.collection('hours_packages').doc(item.package_id).get()
						let pkg = pkgRes.data
						if (Array.isArray(pkg)) {
							pkg = pkg.length > 0 ? pkg[0] : null
						}
						
						if (pkg) {
						if (pkg.remaining !== undefined) {
							// 新结构：使用 remaining 字段
							const currentUsed = pkg.used || 0
							const newUsed = Math.max(0, currentUsed - item.quantity)
							await transaction.collection('hours_packages').doc(item.package_id).update({
								remaining: db.command.inc(item.quantity),
								used: newUsed,
								status: 'active',
								update_time: new Date()
							})
						} else if (pkg.remaining_hours !== undefined) {
							// 旧结构：使用 remaining_hours 字段
							const currentUsedHours = pkg.used_hours || 0
							const newUsedHours = Math.max(0, currentUsedHours - item.quantity)
							await transaction.collection('hours_packages').doc(item.package_id).update({
								remaining_hours: db.command.inc(item.quantity),
								used_hours: newUsedHours,
								update_time: new Date()
							})
						}
					}
				}
			}
			
			// 标记记录为已撤销，而不是删除，以便管理员端查看
				await transaction.collection('class_records').doc(recordId).update({
					status: 'undone',
					undo_reason: reason,
					undo_time: new Date()
				})
			
			// 提交事务
			await transaction.commit()
			
			return {
				code: 0,
				message: '撤销成功'
			}
		} catch (e) {
			// 回滚事务
			await transaction.rollback()
			return {
				code: -1,
				message: e.message || '撤销失败'
			}
		}
	} catch (e) {
		return {
			code: -1,
			message: e.message || '操作失败'
		}
	}
}

async function getExpiringPackages(db, data, token) {
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
		
		const now = new Date()
		// 计算7天后的日期，用于查询即将到期的课时包
		const sevenDaysLater = new Date()
		sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)
		
		// 查询即将到期的课时包（包括已过期和7天内到期的）
		const res = await db.collection('hours_packages')
			.where({
				status: db.command.in(['active', 'expired']),
				is_unlimited: false,
				expire_at: db.command.lt(sevenDaysLater)
			})
			.orderBy('expire_at', 'asc')
			.get()
		
		// 为每个课时包添加学生信息
		const packagesWithStudent = await Promise.all(res.data.map(async (pkg) => {
			const studentRes = await db.collection('students').doc(pkg.student_id).get()
			let student = null
			if (studentRes.data) {
				if (Array.isArray(studentRes.data)) {
					student = studentRes.data.length > 0 ? studentRes.data[0] : null
				} else {
					student = studentRes.data
				}
			}
			return {
				...pkg,
				student_name: student ? student.name : '未知学生',
				parent_mobile: student ? student.parent_mobile : ''
			}
		}))
		
		return {
			code: 0,
			message: '获取成功',
			data: {
				list: packagesWithStudent
			}
		}
	} catch (e) {
		return {
			code: -1,
			message: e.message || '获取失败'
		}
	}
}

async function deleteExpiredPackages(db, data, token) {
	const { package_ids } = data
	
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
				message: '只有管理员可以删除'
			}
		}
		
		if (!Array.isArray(package_ids) || package_ids.length === 0) {
			return {
				code: -1,
				message: '请选择要删除的课时包'
			}
		}
		
		// 批量删除过期课时包
		await db.collection('hours_packages').where({
			_id: db.command.in(package_ids)
		}).remove()
		
		return {
			code: 0,
			message: '删除成功',
			data: {
				deleted_count: package_ids.length
			}
		}
	} catch (e) {
		return {
			code: -1,
			message: e.message || '删除失败'
		}
	}
}

async function undoAdd(db, data, token) {
	const { recordId, reason } = data
	
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
				message: '只有管理员可以撤销'
			}
		}
		
		// 查找添加记录
		const recordRes = await db.collection('class_records').doc(recordId).get()
		if (!recordRes.data) {
			return {
				code: -1,
				message: '记录不存在'
			}
		}
		
		// 处理返回的数据，可能是数组或对象
		let record = recordRes.data
		if (Array.isArray(record)) {
			record = record.length > 0 ? record[0] : null
		}
		
		if (!record) {
			return {
				code: -1,
				message: '记录不存在'
			}
		}

		const recordType = record.type
		if (recordType !== 'add') {
			return {
				code: -1,
				message: '只能撤销添加记录'
			}
		}
		
		// 检查是否已撤销
		if (record.status === 'undone') {
			return {
				code: -1,
				message: '该记录已撤销'
			}
		}
		
		// 开始事务
		const transaction = await db.startTransaction()
		
		try {
			// 在事务中再次获取并检查记录状态，防止并发更新
			const txRecordRes = await transaction.collection('class_records').doc(recordId).get()
			let txRecord = txRecordRes.data
			if (Array.isArray(txRecord)) {
				txRecord = txRecord.length > 0 ? txRecord[0] : null
			}
			
			if (!txRecord) {
				await transaction.rollback()
				return {
					code: -1,
					message: '记录不存在'
				}
			}
			
			// 在事务中再次检查状态，确保没有被其他请求撤销
			if (txRecord.status === 'undone') {
				await transaction.rollback()
				return {
					code: -1,
					message: '该记录已撤销'
				}
			}
			
			// 获取当前学生信息
			const studentRes = await transaction.collection('students').doc(record.student_id).get()
			if (!studentRes.data) {
				await transaction.rollback()
				return {
					code: -1,
					message: '学生不存在'
				}
			}
			
			// 处理返回的数据，可能是数组或对象
			let student = studentRes.data
			if (Array.isArray(student)) {
				student = student.length > 0 ? student[0] : null
			}
			
			if (!student) {
				await transaction.rollback()
				return {
					code: -1,
					message: '学生不存在'
				}
			}
			
			const unit = record.unit || 'lesson'
			const currentUsedHours = student.used_hours || 0
			const currentUsedDays = student.used_days || 0
			const currentUsedPrivateHours = student.used_private_hours || 0
			const hoursToUndo = record.hours || 0
			const daysToUndo = record.days || 0
			const privateHoursToUndo = record.private_hours || 0
			const newUsedHours = unit === 'lesson' ? Math.max(0, currentUsedHours - hoursToUndo) : currentUsedHours
			const newRemainingHours = unit === 'lesson' ? Math.max(0, (student.remaining_hours || 0) - hoursToUndo) : (student.remaining_hours || 0)
			const newUsedDays = unit === 'day' ? Math.max(0, currentUsedDays - daysToUndo) : currentUsedDays
			const newRemainingDays = unit === 'day' ? Math.max(0, (student.remaining_days || 0) - daysToUndo) : (student.remaining_days || 0)
			const newUsedPrivateHours = unit === 'private' ? Math.max(0, currentUsedPrivateHours - privateHoursToUndo) : currentUsedPrivateHours
			const newRemainingPrivateHours = unit === 'private' ? Math.max(0, (student.remaining_private_hours || 0) - privateHoursToUndo) : (student.remaining_private_hours || 0)
			
			const updateData = {
				update_time: new Date()
			}
			if (unit === 'lesson') {
				updateData.total_hours = newRemainingHours
				updateData.used_hours = newUsedHours
				updateData.remaining_hours = newRemainingHours
			} else if (unit === 'day') {
				updateData.total_days = newRemainingDays
				updateData.used_days = newUsedDays
				updateData.remaining_days = newRemainingDays
			} else if (unit === 'private') {
				updateData.total_private_hours = newRemainingPrivateHours
				updateData.used_private_hours = newUsedPrivateHours
				updateData.remaining_private_hours = newRemainingPrivateHours
			}
			await transaction.collection('students').doc(record.student_id).update(updateData)
			
			// 查找并删除对应的课时包（在事务外查询，事务内删除）
			const packagesRes = await db.collection('hours_packages')
				.where({
					student_id: record.student_id,
					unit: unit,
					status: 'active',
					total: unit === 'lesson' ? hoursToUndo : (unit === 'day' ? daysToUndo : privateHoursToUndo)
				})
				.orderBy('create_time', 'desc')
				.get()
			
			const packages = packagesRes.data || []
			if (packages.length > 0) {
				// 在事务中删除最新创建的课时包（对应本次添加操作）
				await transaction.collection('hours_packages').doc(packages[0]._id).remove()
			}
			
			// 标记记录为已撤销，而不是删除，以便管理员端查看
			await transaction.collection('class_records').doc(recordId).update({
				status: 'undone',
				undo_reason: reason,
				undo_time: new Date()
			})
			
			// 提交事务
			await transaction.commit()
			
			return {
				code: 0,
				message: '撤销成功'
			}
		} catch (e) {
			// 回滚事务
			await transaction.rollback()
			return {
				code: -1,
				message: e.message || '撤销失败'
			}
		}
	} catch (e) {
		return {
			code: -1,
			message: e.message || '操作失败'
		}
	}
}
