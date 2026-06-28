'use strict';

const { verifyToken } = require('./auth-utils')

exports.main = async (event, context) => {
	const { action, data, _token } = event
	const db = uniCloud.database()
	const auth = verifyToken(_token)
	if (!auth) {
		return {
			code: -1,
			message: '未登录'
		}
	}
	
	switch(action) {
		case 'getList':
			return await getList(db, data, auth)
		case 'getDetail':
			return await getDetail(db, data, auth)
		case 'create':
			return await create(db, data, auth)
		case 'update':
			return await update(db, data, auth)
		case 'delete':
			return await deleteCourse(db, data, auth)
		case 'completeCourse':
			return await completeCourse(db, data, auth)
		default:
			return {
				code: -1,
				message: '未知操作'
			}
	}
}

async function applyConsumePackagesWithTx(transaction, db, studentId, unit, quantity) {
	const command = db.command
	const packagesRes = await transaction.collection('hours_packages')
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
		const updateData = {
			remaining: nextRemaining,
			update_time: new Date()
		}
		if (nextRemaining <= 0) {
			updateData.status = 'consumed'
		}
		await transaction.collection('hours_packages').doc(pkg._id).update(updateData)
		deducts.push({ package_id: pkg._id, quantity: deduct })
		remainingNeed -= deduct
	}
	return deducts
}

async function getList(db, data, auth) {
	const { student_id, student_ids, date, status, page = 1, pageSize = 20 } = data
	
	try {
		let query = db.collection('courses')
		
		const whereConditions = {}
		
		if (auth.role === 'parent') {
			const studentsRes = await db.collection('students').where({
				parent_user_id: auth.uid
			}).field({ _id: true }).get()
			const allowedStudentIds = studentsRes.data.map(item => item._id)
			if (allowedStudentIds.length === 0) {
				return {
					code: 0,
					data: { list: [], total: 0 }
				}
			}
			if (student_ids && Array.isArray(student_ids) && student_ids.length > 0) {
				const filtered = student_ids.filter(id => allowedStudentIds.includes(id))
				if (filtered.length === 0) {
					return {
						code: 0,
						data: { list: [], total: 0 }
					}
				}
				whereConditions.student_ids = db.command.in(filtered)
			} else if (student_id) {
				if (!allowedStudentIds.includes(student_id)) {
					return {
						code: -1,
						message: '权限不足'
					}
				}
				whereConditions.student_ids = db.command.in([student_id])
			} else {
				whereConditions.student_ids = db.command.in(allowedStudentIds)
			}
		} else if (auth.role !== 'admin' && auth.role !== 'coach') {
			return {
				code: -1,
				message: '权限不足'
			}
		}
		
		if (auth.role !== 'parent') {
			if (student_ids && Array.isArray(student_ids) && student_ids.length > 0) {
				whereConditions.student_ids = db.command.in(student_ids)
			} else if (student_id) {
				whereConditions.student_ids = db.command.in([student_id])
			}
		}
		
		if (date) {
			whereConditions.date = date
		}
		
		if (status) {
			whereConditions.status = status
		}
		
		if (Object.keys(whereConditions).length > 0) {
			query = query.where(whereConditions)
		}
		
		const result = await query
			.orderBy('date', 'desc')
			.orderBy('start_time', 'desc')
			.skip((page - 1) * pageSize)
			.limit(pageSize)
			.get()
		
		return {
			code: 0,
			data: {
				list: result.data,
				total: result.data.length
			}
		}
	} catch (e) {
		console.error('获取课程列表失败:', e)
		return {
			code: -1,
			message: e.message || '获取课程列表失败'
		}
	}
}

async function getDetail(db, data, auth) {
	const { id } = data
	
	if (!id) {
		return {
			code: -1,
			message: '课程ID不能为空'
		}
	}
	
	try {
		const result = await db.collection('courses').doc(id).get()
		
		if (!result.data || result.data.length === 0) {
			return {
				code: -1,
				message: '课程不存在'
			}
		}
		
		const course = result.data[0]
		if (auth.role === 'parent') {
			const studentsRes = await db.collection('students').where({
				parent_user_id: auth.uid
			}).field({ _id: true }).get()
			const allowedStudentIds = studentsRes.data.map(item => item._id)
			const hasAccess = Array.isArray(course.student_ids) && course.student_ids.some(studentId => allowedStudentIds.includes(studentId))
			if (!hasAccess) {
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
		
		return {
			code: 0,
			data: course
		}
	} catch (e) {
		console.error('获取课程详情失败:', e)
		return {
			code: -1,
			message: e.message || '获取课程详情失败'
		}
	}
}

async function create(db, data, auth) {
	const { date, start_time, end_time, student_ids, coach_id, course_type, course_name, notes } = data
	
	if (auth.role !== 'admin' && auth.role !== 'coach') {
		return {
			code: -1,
			message: '权限不足'
		}
	}
	if (!date || !start_time || !end_time) {
		return {
			code: -1,
			message: '日期和时间不能为空'
		}
	}
	
	if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
		return {
			code: -1,
			message: '请选择学生'
		}
	}
	
	try {
		const result = await db.collection('courses').add({
			date,
			start_time,
			end_time,
			student_ids,
			coach_id: auth.uid,
			course_type: course_type || 'default',
			course_name: course_name || '课程',
			notes: notes || '',
			status: 'ongoing',
			media: [],
			create_time: new Date(),
			update_time: new Date()
		})
		
		return {
			code: 0,
			message: '创建成功',
			data: {
				id: result.id
			}
		}
	} catch (e) {
		console.error('创建课程失败:', e)
		return {
			code: -1,
			message: e.message || '创建课程失败'
		}
	}
}

async function update(db, data, auth) {
	const { id, date, start_time, end_time, student_ids, coach_id, course_type, course_name, notes } = data
	
	if (auth.role !== 'admin' && auth.role !== 'coach') {
		return {
			code: -1,
			message: '权限不足'
		}
	}
	if (!id) {
		return {
			code: -1,
			message: '课程ID不能为空'
		}
	}
	
	try {
		const updateData = {
			update_time: new Date()
		}
		
		if (date !== undefined) updateData.date = date
		if (start_time !== undefined) updateData.start_time = start_time
		if (end_time !== undefined) updateData.end_time = end_time
		if (student_ids !== undefined) updateData.student_ids = student_ids
		if (coach_id !== undefined) updateData.coach_id = coach_id
		if (course_type !== undefined) updateData.course_type = course_type
		if (course_name !== undefined) updateData.course_name = course_name
		if (notes !== undefined) updateData.notes = notes
		
		await db.collection('courses').doc(id).update(updateData)
		
		return {
			code: 0,
			message: '更新成功'
		}
	} catch (e) {
		console.error('更新课程失败:', e)
		return {
			code: -1,
			message: e.message || '更新课程失败'
		}
	}
}

async function deleteCourse(db, data, auth) {
	const { id } = data
	
	if (auth.role !== 'admin') {
		return {
			code: -1,
			message: '权限不足'
		}
	}
	if (!id) {
		return {
			code: -1,
			message: '课程ID不能为空'
		}
	}
	
	const courseRes = await db.collection('courses').doc(id).get()
	console.log('查询课程结果:', courseRes)
	
	let course = null
	
	if (courseRes.data) {
		if (Array.isArray(courseRes.data)) {
			course = courseRes.data.length > 0 ? courseRes.data[0] : null
		} else {
			course = courseRes.data
		}
	}
	
	if (!course) {
		return {
			code: -1,
			message: '课程不存在'
		}
	}
	
	console.log('课程详情:', course)
	
	let recordsToUndo = []
	if (course.status === 'completed' && course.student_ids && Array.isArray(course.student_ids)) {
		console.log('课程已完成，查询需要撤销的扣减记录')
		
		// 批量查询所有学生的扣减记录
		const command = db.command
		const recordRes = await db.collection('class_records').where({
			student_id: command.in(course.student_ids),
			course_id: id,
			type: 'consume'
		}).get()
		
		if (recordRes.data && recordRes.data.length > 0) {
			recordsToUndo = recordRes.data.filter(record => record.status !== 'undone')
		}
		
		console.log('找到需要撤销的记录:', recordsToUndo)
	}
	
	const transaction = await db.startTransaction()
	
	try {
		// 在事务中再次检查课程是否存在，防止并发删除
		const txCourseRes = await transaction.collection('courses').doc(id).get()
		let txCourse = null
		if (txCourseRes.data) {
			if (Array.isArray(txCourseRes.data)) {
				txCourse = txCourseRes.data.length > 0 ? txCourseRes.data[0] : null
			} else {
				txCourse = txCourseRes.data
			}
		}
		
		if (!txCourse) {
			await transaction.rollback()
			return {
				code: -1,
				message: '课程不存在或已被删除'
			}
		}
		
		for (const record of recordsToUndo) {
			console.log('撤销扣减记录:', record._id)
			
			const studentRes = await transaction.collection('students').doc(record.student_id).get()
			if (!studentRes.data || (Array.isArray(studentRes.data) && studentRes.data.length === 0)) {
				console.log('学生不存在，跳过:', record.student_id)
				continue
			}
			
			let student = null
			if (Array.isArray(studentRes.data)) {
				student = studentRes.data.length > 0 ? studentRes.data[0] : null
			} else {
				student = studentRes.data
			}
			
			if (!student) {
				console.log('学生数据为空，跳过:', record.student_id)
				continue
			}
			
			console.log('返还课时给学生:', record.student_id, student.name)
			
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
					updateData.used_hours = newUsedHours
					updateData.remaining_hours = newRemainingHours
				} else if (unit === 'day') {
					updateData.used_days = newUsedDays
					updateData.remaining_days = newRemainingDays
				} else if (unit === 'private') {
					updateData.used_private_hours = newUsedPrivateHours
					updateData.remaining_private_hours = newRemainingPrivateHours
				}
				await transaction.collection('students').doc(record.student_id).update(updateData)
			
			if (Array.isArray(record.package_deducts) && record.package_deducts.length > 0) {
				for (const item of record.package_deducts) {
					if (!item || !item.package_id || !item.quantity) continue
					
					// 先查询课时包的结构
					const pkgRes = await transaction.collection('hours_packages').doc(item.package_id).get()
					let pkg = null
					if (pkgRes.data) {
						if (Array.isArray(pkgRes.data)) {
							pkg = pkgRes.data.length > 0 ? pkgRes.data[0] : null
						} else {
							pkg = pkgRes.data
						}
					}
					
					if (pkg) {
						if (pkg.remaining !== undefined) {
							// 新结构：使用 remaining 字段
							await transaction.collection('hours_packages').doc(item.package_id).update({
								remaining: db.command.inc(item.quantity),
								status: 'active',
								update_time: new Date()
							})
						} else if (pkg.remaining_hours !== undefined) {
							// 旧结构：使用 remaining_hours 字段
							await transaction.collection('hours_packages').doc(item.package_id).update({
								remaining_hours: db.command.inc(item.quantity),
								used_hours: db.command.inc(-item.quantity),
								update_time: new Date()
							})
						}
					}
				}
			}
			
			// 直接删除课时记录，而不是标记为已撤销
					await transaction.collection('class_records').doc(record._id).remove()
		}
		
		await transaction.collection('courses').doc(id).remove()
		
		await transaction.commit()
		
		return {
			code: 0,
			message: '删除成功'
		}
	} catch (e) {
		console.error('删除课程失败:', e)
		await transaction.rollback()
		return {
			code: -1,
			message: e.message || '删除失败'
		}
	}
}

async function completeCourse(db, data, auth) {
	const { id, media, attended_students = [], deduct_units = [] } = data
	
	if (auth.role !== 'admin' && auth.role !== 'coach') {
		return {
			code: -1,
			message: '权限不足'
		}
	}
	if (!id) {
		return {
			code: -1,
			message: '课程ID不能为空'
		}
	}
	
	if (!Array.isArray(attended_students)) {
		return {
			code: -1,
			message: '学生列表格式错误'
		}
	}
	
	console.log('接收到的学生ID列表:', attended_students)
	
	// 先在事务外查询课程信息
	const courseRes = await db.collection('courses').doc(id).get()
	let course = null
	if (courseRes.data) {
		if (Array.isArray(courseRes.data)) {
			course = courseRes.data.length > 0 ? courseRes.data[0] : null
		} else {
			course = courseRes.data
		}
	}
	
	if (!course) {
		return {
			code: -1,
			message: '课程不存在'
		}
	}
	
	// 检查课程是否已完成
	if (course.status === 'completed') {
		return {
			code: -1,
			message: '课程已完成'
		}
	}
	
	// 先在事务外批量查询所有学生的信息
		const studentsMap = {}
		if (attended_students.length > 0) {
			const command = db.command
			const studentsRes = await db.collection('students')
				.where({
					_id: command.in(attended_students)
				})
				.get()
			
			if (studentsRes.data && Array.isArray(studentsRes.data)) {
				studentsRes.data.forEach(student => {
					studentsMap[student._id] = student
				})
			}
		}
	
	// 先在事务外查询所有课时包信息
	const packagesMap = {}
	const unitMap = {}
	if (Array.isArray(deduct_units)) {
		deduct_units.forEach(item => {
			if (item && item.student_id && item.unit) {
				unitMap[item.student_id] = item.unit
			}
		})
	}
	
	if (attended_students.length > 0) {
		const command = db.command
		// 查询所有课时包，包括不同结构的
		const packagesRes = await db.collection('hours_packages')
			.where({
				student_id: command.in(attended_students)
			})
			.get()
		
		if (packagesRes.data && Array.isArray(packagesRes.data)) {
			packagesRes.data.forEach(pkg => {
				if (!packagesMap[pkg.student_id]) {
					packagesMap[pkg.student_id] = []
				}
				packagesMap[pkg.student_id].push(pkg)
			})
		}
	}
	
	// 启动事务
	const transaction = await db.startTransaction()
	
	try {
		// 更新课程状态
		await transaction.collection('courses').doc(id).update({
			status: 'completed',
			media: media || [],
			update_time: new Date()
		})
		
		if (attended_students.length > 0) {
			console.log('开始扣减课时，学生数量:', attended_students.length)
			
			for (const studentId of attended_students) {
				if (!studentId) {
					console.log('跳过空的学生ID')
					continue
				}
				
				console.log('处理学生:', studentId)
				
				const student = studentsMap[studentId]
				if (!student) {
					console.log('学生不存在，跳过:', studentId)
					continue
				}
				
				const unit = unitMap[studentId] || 'lesson'
				
				// 检查课时包是否有足够的课时
				const packages = packagesMap[studentId] || []
				let hasEnoughHours = false
				
				for (const pkg of packages) {
					if (pkg.unit) {
						// 新结构：使用 unit 和 remaining
						if (pkg.unit === unit && (pkg.remaining || 0) > 0) {
							hasEnoughHours = true
							break
						}
					} else if (pkg.is_limited !== undefined) {
						// 旧结构：使用 is_limited 和 remaining_hours
						if ((unit === 'lesson' && !pkg.is_limited && (pkg.remaining_hours || 0) > 0) ||
						    (unit === 'day' && pkg.is_limited && (pkg.remaining_hours || 0) > 0)) {
							hasEnoughHours = true
							break
						}
					}
				}
				
				if (!hasEnoughHours) {
						await transaction.rollback()
						return {
							code: -1,
							message: `学生${student.name}${unit === 'lesson' ? '课时' : unit === 'day' ? '天数课时' : '私教课时'}不足`
						}
					}
				
				// 处理课时包扣减
				let filteredPackages = packagesMap[studentId] || []
				// 过滤出适合当前unit的课时包
				filteredPackages = filteredPackages.filter(pkg => {
					if (pkg.unit) {
						return pkg.unit === unit
					} else if (pkg.is_limited !== undefined) {
						return (unit === 'lesson' && !pkg.is_limited) || (unit === 'day' && pkg.is_limited)
					}
					return false
				})
				
				// 排序
				filteredPackages.sort((a, b) => {
					const aUnlimited = !!a.is_unlimited || (!a.is_limited && a.is_limited !== undefined)
					const bUnlimited = !!b.is_unlimited || (!b.is_limited && b.is_limited !== undefined)
					if (aUnlimited !== bUnlimited) {
						return aUnlimited ? 1 : -1
					}
					const aTime = a.expire_at || (a.end_date ? new Date(a.end_date).getTime() : Number.MAX_SAFE_INTEGER)
					const bTime = b.expire_at || (b.end_date ? new Date(b.end_date).getTime() : Number.MAX_SAFE_INTEGER)
					return aTime - bTime
				})
				
				let remainingNeed = 1
				const deducts = []
				let totalBefore = 0
				let totalAfter = 0
				
				// 计算扣减前的总课时
				filteredPackages.forEach(pkg => {
					if (pkg.remaining !== undefined) {
						totalBefore += pkg.remaining || 0
					} else if (pkg.remaining_hours !== undefined) {
						totalBefore += pkg.remaining_hours || 0
					}
				})
				
				for (const pkg of filteredPackages) {
					if (remainingNeed <= 0) break
					
					let available = 0
					let updateData = {}
					
					if (pkg.remaining !== undefined) {
						// 新结构
						available = pkg.remaining || 0
						if (available <= 0) continue
						const deduct = Math.min(available, remainingNeed)
						const nextRemaining = available - deduct
						updateData = {
							remaining: nextRemaining,
							update_time: new Date()
						}
						if (nextRemaining <= 0) {
							updateData.status = 'consumed'
						}
						await transaction.collection('hours_packages').doc(pkg._id).update(updateData)
						deducts.push({ package_id: pkg._id, quantity: deduct })
						remainingNeed -= deduct
						totalAfter += nextRemaining
					} else if (pkg.remaining_hours !== undefined) {
						// 旧结构
						available = pkg.remaining_hours || 0
						if (available <= 0) continue
						const deduct = Math.min(available, remainingNeed)
						const nextRemaining = available - deduct
						updateData = {
							remaining_hours: nextRemaining,
							used_hours: (pkg.used_hours || 0) + deduct,
							update_time: new Date()
						}
						await transaction.collection('hours_packages').doc(pkg._id).update(updateData)
						deducts.push({ package_id: pkg._id, quantity: deduct })
						remainingNeed -= deduct
						totalAfter += nextRemaining
					}
				}
				
				// 计算学生表的课时变化
					const beforeHours = student.remaining_hours || 0
					const beforeDays = student.remaining_days || 0
					const beforePrivateHours = student.remaining_private_hours || 0
					const newRemainingHours = unit === 'lesson' ? Math.max(0, beforeHours - 1) : beforeHours
					const newUsedHours = unit === 'lesson' ? (student.used_hours || 0) + 1 : (student.used_hours || 0)
					const newRemainingDays = unit === 'day' ? Math.max(0, beforeDays - 1) : beforeDays
					const newUsedDays = unit === 'day' ? (student.used_days || 0) + 1 : (student.used_days || 0)
					const newRemainingPrivateHours = unit === 'private' ? Math.max(0, beforePrivateHours - 1) : beforePrivateHours
					const newUsedPrivateHours = unit === 'private' ? (student.used_private_hours || 0) + 1 : (student.used_private_hours || 0)
					
					// 更新学生表
					const updateData = {
						update_time: new Date()
					}
					if (unit === 'lesson') {
						updateData.remaining_hours = newRemainingHours
						updateData.used_hours = newUsedHours
					} else if (unit === 'day') {
						updateData.remaining_days = newRemainingDays
						updateData.used_days = newUsedDays
					} else if (unit === 'private') {
						updateData.remaining_private_hours = newRemainingPrivateHours
						updateData.used_private_hours = newUsedPrivateHours
					}
					await transaction.collection('students').doc(studentId).update(updateData)
					
					await transaction.collection('class_records').add({
						student_id: studentId,
						course_id: id,
						hours: unit === 'lesson' ? 1 : 0,
						days: unit === 'day' ? 1 : 0,
						private_hours: unit === 'private' ? 1 : 0,
						unit,
						type: 'consume',
						reason: '课程消耗',
						before_hours: beforeHours,
						after_hours: newRemainingHours,
						before_days: beforeDays,
						after_days: newRemainingDays,
						before_private_hours: beforePrivateHours,
						after_private_hours: newRemainingPrivateHours,
						package_deducts: deducts,
						operator_id: auth.uid,
						create_time: new Date()
					})
				
				console.log('扣减成功，学生:', studentId)
			}
		}
		
		await transaction.commit()
		
		return {
			code: 0,
			message: '课程完成成功'
		}
	} catch (e) {
		console.error('完成课程失败:', e)
		await transaction.rollback()
		return {
			code: -1,
			message: e.message || '完成课程失败'
		}
	}
}
