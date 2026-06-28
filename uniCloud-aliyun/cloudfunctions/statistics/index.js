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
	if (auth.role !== 'admin' && auth.role !== 'coach') {
		return {
			code: -1,
			message: '权限不足'
		}
	}
	
	switch(action) {
		case 'getOverview':
			return await getOverview(db, data)
		case 'getAttendance':
			return await getAttendance(db, data)
		default:
			return {
				code: -1,
				message: '未知操作'
			}
	}
}

async function getOverview(db, data) {
	try {
		// 1. 获取学生总数
		const totalStudents = await db.collection('students').count()
		
		// 2. 获取课程总数
		const totalCourses = await db.collection('courses').count()
		
		// 3. 计算总课时（所有学生的剩余课时总和，包括私教课时）
		const studentsRes = await db.collection('students').field({ remaining_hours: true, remaining_private_hours: true }).get()
		let totalHours = 0
		for (const student of studentsRes.data) {
			totalHours += (student.remaining_hours || 0) + (student.remaining_private_hours || 0)
		}
		
		return {
			code: 0,
			message: '获取成功',
			data: {
				total_students: totalStudents.total,
				total_courses: totalCourses.total,
				total_hours: totalHours
			}
		}
	} catch (e) {
		return {
			code: -1,
			message: e.message || '获取失败'
		}
	}
}

async function getAttendance(db, data) {
	const { student_id, start_date, end_date } = data
	
	try {
		let query = db.collection('class_records').where({
			type: 'consume'
		})
		
		if (student_id) {
			query = query.where({
				student_id
			})
		}
		
		if (start_date && end_date) {
			query = query.where({
				create_time: db.command.gte(new Date(start_date)).and(db.command.lte(new Date(end_date)))
			})
		}
		
		const res = await query.orderBy('create_time', 'desc').limit(100).get()
		
		// 按日期分组统计
		const attendanceData = {}
		
		for (const record of res.data) {
			const date = new Date(record.create_time).toISOString().split('T')[0]
			
			if (!attendanceData[date]) {
				attendanceData[date] = {
					date,
					count: 0,
					hours: 0
				}
			}
			
			attendanceData[date].count++
			attendanceData[date].hours += Math.abs(record.hours || 0)
		}
		
		const sortedData = Object.values(attendanceData).sort((a, b) => {
			return new Date(a.date) - new Date(b.date)
		})
		
		return {
			code: 0,
			message: '获取成功',
			data: sortedData
		}
	} catch (e) {
		return {
			code: -1,
			message: e.message || '获取失败'
		}
	}
}
