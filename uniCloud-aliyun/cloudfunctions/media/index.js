'use strict';

const { verifyToken } = require('./auth-utils')

exports.main = async (event, context) => {
	const { action, data, _token } = event
	const db = uniCloud.database()
	
	switch(action) {
		case 'getList':
			return await getList(db, data, _token)
		case 'upload':
			return await upload(db, data, _token)
		case 'delete':
			return await deleteMedia(db, data, _token)
		default:
			return {
				code: -1,
				message: '未知操作'
			}
	}
}

async function getList(db, data, token) {
	const { course_id } = data
	
	try {
		const auth = verifyToken(token)
		if (!auth) {
			return {
				code: -1,
				message: '未登录'
			}
		}
		if (auth.role === 'parent') {
			const studentsRes = await db.collection('students').where({
				parent_user_id: auth.uid
			}).field({ _id: true }).get()
			const studentIds = studentsRes.data.map(item => item._id)
			if (studentIds.length === 0) {
				return {
					code: 0,
					message: '获取成功',
					data: { list: [] }
				}
			}
			const courseRes = await db.collection('courses').doc(course_id).get()
			if (!courseRes.data || courseRes.data.length === 0) {
				return {
					code: -1,
					message: '课程不存在'
				}
			}
			const course = courseRes.data[0]
			const hasAccess = Array.isArray(course.student_ids) && course.student_ids.some(id => studentIds.includes(id))
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
		const res = await db.collection('media')
			.where({
				course_id
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
		return {
			code: -1,
			message: e.message || '获取失败'
		}
	}
}

async function upload(db, data, token) {
	const { course_id, files, descriptions } = data
	
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
		
		const courseRes = await db.collection('courses').doc(course_id).get()
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
		
		const currentMedia = course.media || []
		const mediaList = []
		
		for (let i = 0; i < files.length; i++) {
			const file = files[i]
			const description = descriptions ? descriptions[i] : ''
			const type = file.type || 'image'
			
			const res = await db.collection('media').add({
				course_id,
				type,
				url: file.url,
				thumb_url: file.thumb_url || '',
				size: file.size || 0,
				duration: file.duration || 0,
				description,
				upload_by: auth.uid || 'coach-123',
				create_time: new Date()
			})
			
			const mediaItem = {
				id: res.id,
				url: file.url,
				type,
				description,
				thumb_url: file.thumb_url || '',
				size: file.size || 0,
				duration: file.duration || 0
			}
			
			mediaList.push(mediaItem)
			currentMedia.push(mediaItem)
		}
		
		await db.collection('courses').doc(course_id).update({
			media: currentMedia,
			media_count: db.command.inc(files.length),
			update_time: new Date()
		})
		
		return {
			code: 0,
			message: '上传成功',
			data: {
				list: mediaList
			}
		}
	} catch (e) {
		console.error('media云函数upload失败:', e)
		return {
			code: -1,
			message: e.message || '上传失败'
		}
	}
}

async function deleteMedia(db, data, token) {
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
		const mediaRes = await db.collection('media').doc(id).get()
		if (!mediaRes.data || (Array.isArray(mediaRes.data) && mediaRes.data.length === 0)) {
			return {
				code: -1,
				message: '媒体文件不存在'
			}
		}
		
		let media = null
		if (Array.isArray(mediaRes.data)) {
			media = mediaRes.data.length > 0 ? mediaRes.data[0] : null
		} else {
			media = mediaRes.data
		}
		
		if (!media) {
			return {
				code: -1,
				message: '媒体文件不存在'
			}
		}
		
		await db.collection('media').doc(id).remove()
		
		const courseRes = await db.collection('courses').doc(media.course_id).get()
		let course = null
		if (courseRes.data) {
			if (Array.isArray(courseRes.data)) {
				course = courseRes.data.length > 0 ? courseRes.data[0] : null
			} else {
				course = courseRes.data
			}
		}
		
		if (course && Array.isArray(course.media)) {
			const updatedMedia = course.media.filter(item => item.id !== id && item.url !== media.url)
			
			await db.collection('courses').doc(media.course_id).update({
				media: updatedMedia,
				media_count: db.command.inc(-1),
				update_time: new Date()
			})
		} else {
			await db.collection('courses').doc(media.course_id).update({
				media_count: db.command.inc(-1),
				update_time: new Date()
			})
		}
		
		return {
			code: 0,
			message: '删除成功'
		}
	} catch (e) {
		console.error('删除媒体文件失败:', e)
		return {
			code: -1,
			message: e.message || '删除失败'
		}
	}
}
