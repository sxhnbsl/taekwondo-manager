'use strict';

exports.main = async (event, context) => {
	const db = uniCloud.database()
	
	try {
		// 查询所有课时包
		const packagesRes = await db.collection('hours_packages').get()
		
		// 查询所有课时记录
		const recordsRes = await db.collection('class_records').get()
		
		// 查询所有学生
		const studentsRes = await db.collection('students').get()
		
		return {
			code: 0,
			message: '查询成功',
			data: {
				packages: packagesRes.data,
				records: recordsRes.data,
				students: studentsRes.data
			}
		}
	} catch (e) {
		return {
			code: -1,
			message: e.message || '查询失败'
		}
	}
}
