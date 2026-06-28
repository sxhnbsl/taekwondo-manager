<template>
	<view class="container">
		<view class="header">
			<text class="title">课程详情</text>
		</view>
		
		<view class="course-info-card">
			<view class="info-item">
				<text class="label">课程标题</text>
				<text class="value">{{ course.title }}</text>
			</view>
			<view class="info-item">
				<text class="label">上课日期</text>
				<text class="value">{{ course.date }}</text>
			</view>
			<view class="info-item">
				<text class="label">上课时间</text>
				<text class="value">{{ course.start_time }} - {{ course.end_time }}</text>
			</view>
			<view class="info-item">
				<text class="label">上课地点</text>
				<text class="value">{{ course.location || '未设置' }}</text>
			</view>
			<view class="info-item">
				<text class="label">课程内容</text>
				<text class="value">{{ course.content || '暂无内容' }}</text>
			</view>
			<view class="info-item">
				<text class="label">课程状态</text>
				<text class="value status" :class="course.status">{{ getStatusText(course.status) }}</text>
			</view>
		</view>
		
		<view class="students-section">
			<view class="section-header">
				<text class="section-title">上课学生 ({{ students.length }}人)</text>
			</view>
			
			<view v-if="students.length === 0" class="empty">
				<text>暂无学生</text>
			</view>
			
			<view v-else class="student-list">
				<view 
					v-for="student in students" 
					:key="student._id"
					class="student-item"
				>
					<view class="student-info">
						<view class="avatar">{{ student.name.charAt(0) }}</view>
						<view class="detail">
							<text class="name">{{ student.name }}</text>
							<text class="hours">剩余 {{ student.remaining_hours }} 课时</text>
						<text class="hours">剩余 {{ student.remaining_days || 0 }} 天</text>
						<text class="hours">剩余 {{ student.remaining_private_hours || 0 }} 私教课</text>
						</view>
					</view>
					<view class="attendance">
						<text class="status-text attended">已签到</text>
					</view>
				</view>
			</view>
		</view>
		
		<view class="media-section" v-if="course.status === 'ongoing'">
			<view class="section-header">
				<text class="section-title">课程照片</text>
				<button class="upload-btn" @click="chooseMedia">
					<text class="icon">📷</text>
					<text>上传</text>
				</button>
			</view>
			
			<view v-if="mediaList.length === 0" class="empty">
				<text>暂无照片</text>
			</view>
			
			<view v-else class="media-grid">
				<view 
					v-for="(item, index) in mediaList" 
					:key="index"
					class="media-item"
					@click="previewMedia(item, index)"
				>
					<image :src="item.url" mode="aspectFill" class="media-image"></image>
					<view class="delete-btn" @click.stop="deleteMedia(index)">
						<text>×</text>
					</view>
				</view>
			</view>
		</view>
		
		<view class="media-section" v-if="course.status === 'completed'">
			<view class="section-header">
				<text class="section-title">课程照片</text>
			</view>
			
			<view v-if="(course.media || []).length === 0" class="empty">
				<text>暂无照片</text>
			</view>
			
			<view v-else class="media-grid">
				<view 
					v-for="(item, index) in course.media" 
					:key="index"
					class="media-item"
					@click="previewMedia(item, index)"
				>
					<image :src="item.url" mode="aspectFill" class="media-image"></image>
				</view>
			</view>
		</view>
		
		<view class="actions" v-if="course.status === 'ongoing'">
			<button class="action-btn complete" @click="completeCourse" :loading="loading">
				完成课程（自动扣课）
			</button>
		</view>
		
		<view v-if="showDeductType" class="modal-overlay" @click="closeDeductType">
			<view class="modal-content" @click.stop>
				<view class="modal-title">选择扣课类型</view>
				<view v-for="student in deductChoiceStudents" :key="student._id" class="deduct-item">
					<view class="deduct-info">
						<text class="deduct-name">{{ student.name }}</text>
						<text class="deduct-desc">剩余 {{ student.remaining_hours || 0 }} 课时 / {{ student.remaining_days || 0 }} 天 / {{ student.remaining_private_hours || 0 }} 私教课</text>
					</view>
					<view class="unit-tabs">
						<view class="unit-tab" :class="{ active: deductSelections[student._id] === 'lesson' }" @click="setDeductSelection(student._id, 'lesson')">节数</view>
						<view class="unit-tab" :class="{ active: deductSelections[student._id] === 'day' }" @click="setDeductSelection(student._id, 'day')">天数</view>
						<view class="unit-tab" :class="{ active: deductSelections[student._id] === 'private' }" @click="setDeductSelection(student._id, 'private')">私教</view>
					</view>
				</view>
				<view class="modal-actions">
					<button class="btn cancel" @click="closeDeductType" :disabled="isSubmitting">取消</button>
					<button class="btn confirm" @click="confirmDeductType" :loading="isSubmitting" :disabled="isSubmitting">确定</button>
				</view>
			</view>
		</view>
		
		<view class="actions" v-if="course.status === 'completed'">
			<button class="action-btn edit" @click="goToEdit">编辑课程</button>
			<button v-if="isAdmin" class="action-btn delete" @click="confirmDelete">删除课程</button>
		</view>
	</view>
</template>

<script>
import { courseAPI, studentAPI } from '@/utils/api.js'
import { COURSE_STATUS } from '@/utils/common.js'
import { getShareConfig, getTimelineConfig } from '@/utils/share.js'

export default {
	data() {
		return {
			courseId: '',
			course: {},
			students: [],
			mediaList: [],
			loading: false,
			isSubmitting: false,
			showDeductType: false,
			deductSelections: {},
			userInfo: null
		}
	},
	
	onLoad(options) {
		this.userInfo = uni.getStorageSync('userInfo')
		if (options.id) {
			this.courseId = options.id
			this.loadCourseDetail()
		}
	},
	
	onShow() {
		if (this.courseId) {
			this.loadCourseDetail()
		}
	},

	onShareAppMessage() {
		const title = this.course.course_name ? `欣兰体育 - ${this.course.course_name}` : '欣兰体育 - 课程详情'
		return getShareConfig(`/pages/coach/class-detail/class-detail?id=${this.courseId}`, title)
	},
	
	onShareTimeline() {
		const title = this.course.course_name ? `欣兰体育 - ${this.course.course_name}` : '欣兰体育'
		return getTimelineConfig(title)
	},

	computed: {
		isAdmin() {
			return this.userInfo && this.userInfo.role === 'admin'
		},
		isCoach() {
			return this.userInfo && this.userInfo.role === 'coach'
		},
		
		deductChoiceStudents() {
			return this.students.filter(student => {
				const hasLesson = (student.remaining_hours || 0) > 0
				const hasDay = (student.remaining_days || 0) > 0
				return hasLesson && hasDay
			})
		}
	},
	
	methods: {
		async loadCourseDetail() {
			try {
				const res = await courseAPI.getDetail(this.courseId)
				this.course = res.data
				this.mediaList = this.course.media || []
				
				if (this.course.student_ids && this.course.student_ids.length > 0) {
					await this.loadStudents(this.course.student_ids)
				}
			} catch (e) {
				console.error('加载课程详情失败:', e)
			}
		},
		
		async loadStudents(studentIds) {
			try {
				const res = await studentAPI.getList({
					ids: studentIds,
					page: 1,
					pageSize: 100
				})
				this.students = res.data.list
			} catch (e) {
				console.error('加载学生信息失败:', e)
			}
		},
		
		chooseMedia() {
			uni.navigateTo({
				url: `/pages/coach/media-upload/media-upload?courseId=${this.courseId}`
			})
		},
		
		uploadFile(filePath) {
			return new Promise((resolve, reject) => {
				const cloudPath = 'media/' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
				
				uniCloud.uploadFile({
					filePath: filePath,
					cloudPath: cloudPath,
					success: resolve,
					fail: reject
				})
			})
		},
		
		deleteMedia(index) {
			uni.showModal({
				title: '确认删除',
				content: '确定要删除这个文件吗？',
				success: (res) => {
					if (res.confirm) {
						this.mediaList.splice(index, 1)
					}
				}
			})
		},
		
		previewMedia(item, index) {
			if (item.type === 'image') {
				const urls = this.mediaList.length > 0 
					? this.mediaList.filter(m => m.type === 'image').map(m => m.url)
					: (this.course.media || []).filter(m => m.type === 'image').map(m => m.url)
				const current = urls.indexOf(item.url)
				uni.previewImage({
					urls: urls,
					current: current >= 0 ? current : 0
				})
			}
		},
		
		async completeCourse() {
			if (this.students.length === 0) {
				uni.showModal({
					title: '提示',
					content: '没有学生，确定要完成课程吗？',
					success: async (res) => {
						if (res.confirm) {
							await this.doCompleteCourse()
						}
					}
				})
			} else {
				// 检查是否有学生只有私教课时
				const privateOnlyStudents = this.students.filter(student => {
					const hasLesson = (student.remaining_hours || 0) > 0
					const hasDay = (student.remaining_days || 0) > 0
					const hasPrivate = (student.remaining_private_hours || 0) > 0
					return hasPrivate && !hasLesson && !hasDay
				})
				
				if (privateOnlyStudents.length > 0) {
					const names = privateOnlyStudents.map(s => s.name).join('、')
					uni.showToast({
						title: `${names}只有私教课时，无法完成大课`,
						icon: 'none'
					})
					return
				}
				
				const { needChoice, selections } = this.buildDeductSelections()
				this.deductSelections = selections
				if (needChoice) {
					this.showDeductType = true
					return
				}
				uni.showModal({
					title: '确认完成',
					content: `将为 ${this.students.length} 位学生扣减课时，确定继续吗？`,
					success: async (res) => {
						if (res.confirm) {
							await this.doCompleteCourse()
						}
					}
				})
			}
		},
		
		async doCompleteCourse() {
		if (this.isSubmitting) {
			return
		}
		
		this.isSubmitting = true
		this.loading = true
		
		try {
			// 重新加载课程详情，确保mediaList是最新的
			await this.loadCourseDetail()
			
			const studentIds = this.students.filter(student => {
					const hasLesson = (student.remaining_hours || 0) > 0
					const hasDay = (student.remaining_days || 0) > 0
					return hasLesson || hasDay
				}).map(student => student._id)
				const { selections } = this.buildDeductSelections()
				const deductUnits = studentIds.map(id => ({
					student_id: id,
					unit: this.deductSelections[id] || selections[id] || 'lesson'
				}))
			
			await courseAPI.completeCourse(this.courseId, {
				media: this.mediaList,
				attended_students: studentIds,
				deduct_units: deductUnits
			})
				
				uni.showToast({
					title: '课程已完成，已扣减课时',
					icon: 'success'
				})
				
				setTimeout(() => {
					this.loadCourseDetail()
				}, 1500)
			} catch (e) {
				console.error('完成课程失败:', e)
				uni.showToast({
					title: e.message || '完成课程失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
				this.isSubmitting = false
			}
		},

		buildDeductSelections() {
			const selections = {}
			let needChoice = false
			this.students.forEach(student => {
				const hasLesson = (student.remaining_hours || 0) > 0
				const hasDay = (student.remaining_days || 0) > 0
				const hasPrivate = (student.remaining_private_hours || 0) > 0
				
				if (hasLesson && hasDay) {
					// 有多种课时，默认选天数
					selections[student._id] = selections[student._id] || 'day'
					needChoice = true
				} else if (hasDay) {
					selections[student._id] = 'day'
				} else if (hasLesson) {
					selections[student._id] = 'lesson'
				} else if (hasPrivate) {
					// 只有私教课时，提示课程不足
					uni.showToast({
						title: `${student.name}只有私教课时，无法完成大课`,
						icon: 'none'
					})
				}
			})
			return { selections, needChoice }
		},

		setDeductSelection(studentId, unit) {
			const student = this.students.find(item => item._id === studentId)
			if (!student) return
			
			// 检查课时是否足够
			if (unit === 'day' && (student.remaining_days || 0) <= 0) {
				uni.showToast({
					title: '天数课时不足',
					icon: 'none'
				})
				return
			}
			if (unit === 'lesson' && (student.remaining_hours || 0) <= 0) {
				uni.showToast({
					title: '课时不足',
					icon: 'none'
				})
				return
			}
			if (unit === 'private' && (student.remaining_private_hours || 0) <= 0) {
				uni.showToast({
					title: '私教课时不足',
					icon: 'none'
				})
				return
			}
			
			this.$set ? this.$set(this.deductSelections, studentId, unit) : (this.deductSelections[studentId] = unit)
		},

		closeDeductType() {
			this.showDeductType = false
		},

		async confirmDeductType() {
			this.showDeductType = false
			await this.doCompleteCourse()
		},
		
		goToEdit() {
			uni.navigateTo({
				url: `/pages/coach/class-edit/class-edit?id=${this.courseId}`
			})
		},
		
		confirmDelete() {
			let confirmContent = '确定要删除这门课程吗？'
			
			if (this.course.status === 'completed' && this.students.length > 0) {
				const studentNames = this.students.map(s => s.name).join('、')
				confirmContent = `确定要删除这门课程吗？\n\n将把课时返还给：${studentNames}`
			}
			
			uni.showModal({
				title: '确认删除',
				content: confirmContent,
				confirmText: '确定',
				cancelText: '取消',
				success: async (res) => {
					if (res.confirm) {
						await this.deleteCourse()
					}
				}
			})
		},
		
		async deleteCourse() {
			if (this.isSubmitting) {
				return
			}
			
			this.isSubmitting = true
			
			try {
				// 显示加载动画
				uni.showLoading({
					title: '正在返还课时...',
					mask: true
				})
				
				await courseAPI.delete(this.courseId)
				
				// 隐藏加载动画
				uni.hideLoading()
				
				uni.showToast({
					title: '删除成功',
					icon: 'success'
				})
				
				setTimeout(() => {
					uni.navigateBack()
				}, 1500)
			} catch (e) {
				// 隐藏加载动画
				uni.hideLoading()
				console.error('删除课程失败:', e)
				uni.showToast({
					title: e.message || '删除课程失败',
					icon: 'none'
				})
			} finally {
				this.isSubmitting = false
			}
		},
		
		getStatusText(status) {
			const statusMap = {
				[COURSE_STATUS.PLANNED]: '待上课',
				[COURSE_STATUS.ONGOING]: '进行中',
				[COURSE_STATUS.COMPLETED]: '已完成',
				[COURSE_STATUS.CANCELLED]: '已取消'
			}
			return statusMap[status] || status
		}
	}
}
</script>

<style scoped>
.container {
	min-height: 100vh;
	background: #f8f8f8;
}

.header {
	background: #ffffff;
	padding: 30rpx 40rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
}

.course-info-card {
	background: #ffffff;
	margin: 20rpx;
	border-radius: 16rpx;
	padding: 30rpx;
}

.info-item {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
}

.info-item:last-child {
	border-bottom: none;
}

.info-item .label {
	font-size: 28rpx;
	color: #999;
	width: 160rpx;
}

.info-item .value {
	font-size: 28rpx;
	color: #333;
	flex: 1;
	text-align: right;
}

.info-item .value.status {
	padding: 8rpx 16rpx;
	border-radius: 8rpx;
	font-size: 24rpx;
}

.info-item .value.status.planned {
	background: #fff7e6;
	color: #ff9500;
}

.info-item .value.status.ongoing {
	background: #e6f7ff;
	color: #1890ff;
}

.info-item .value.status.completed {
	background: #e6f7ff;
	color: #1890ff;
}

.students-section {
	background: #ffffff;
	margin: 20rpx;
	border-radius: 16rpx;
	padding: 30rpx;
}

.media-section {
	background: #ffffff;
	margin: 20rpx;
	border-radius: 16rpx;
	padding: 30rpx;
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 30rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.upload-btn {
	display: flex;
	align-items: center;
	gap: 8rpx;
	height: 64rpx;
	padding: 0 30rpx;
	border: none;
	border-radius: 32rpx;
	font-size: 26rpx;
	background: #3cc51f;
	color: #ffffff;
}

.upload-btn::after {
	border: none;
}

.upload-btn .icon {
	font-size: 32rpx;
}

.empty {
	text-align: center;
	padding: 60rpx;
	color: #999;
	font-size: 28rpx;
}

.student-list {
	border-top: 1rpx solid #f0f0f0;
}

.student-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 24rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
}

.student-item:last-child {
	border-bottom: none;
}

.student-info {
	display: flex;
	align-items: center;
}

.student-info .avatar {
	width: 80rpx;
	height: 80rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 32rpx;
	color: #ffffff;
	margin-right: 20rpx;
}

.student-info .detail {
	display: flex;
	flex-direction: column;
}

.student-info .name {
	font-size: 30rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 8rpx;
}

.student-info .hours {
	font-size: 24rpx;
	color: #999;
}

.attendance .status-text {
	font-size: 26rpx;
	color: #999;
}

.attendance .status-text.attended {
	color: #3cc51f;
	font-weight: bold;
}

.media-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 20rpx;
}

.media-item {
	position: relative;
	width: 100%;
	padding-top: 100%;
	border-radius: 12rpx;
	overflow: hidden;
	background: #f5f5f5;
}

.media-image {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
}

.delete-btn {
	position: absolute;
	top: 8rpx;
	right: 8rpx;
	width: 40rpx;
	height: 40rpx;
	background: rgba(0, 0, 0, 0.5);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #ffffff;
	font-size: 32rpx;
	line-height: 1;
}

.actions {
	display: flex;
	gap: 20rpx;
	padding: 40rpx;
}

.actions .action-btn {
	flex: 1;
	height: 88rpx;
	border: none;
	border-radius: 12rpx;
	font-size: 32rpx;
	font-weight: bold;
}

.actions .action-btn::after {
	border: none;
}

.actions .action-btn.complete {
	background: #3cc51f;
	color: #ffffff;
}

.actions .action-btn.edit {
	background: #e6f7e6;
	color: #3cc51f;
}

.actions .action-btn.delete {
	background: #ffe6e6;
	color: #ff6b6b;
}
.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 999;
}
.modal-content {
	background: #fff;
	border-radius: 20rpx;
	padding: 40rpx;
	width: 600rpx;
	max-height: 80vh;
	overflow: auto;
}
.modal-title {
	font-size: 34rpx;
	font-weight: bold;
	color: #333;
	text-align: center;
	margin-bottom: 30rpx;
}
.deduct-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
}
.deduct-info {
	display: flex;
	flex-direction: column;
}
.deduct-name {
	font-size: 28rpx;
	color: #333;
	margin-bottom: 6rpx;
}
.deduct-desc {
	font-size: 24rpx;
	color: #999;
}
.unit-tabs {
	display: flex;
	background: #f5f5f5;
	border-radius: 12rpx;
	padding: 6rpx;
	width: 280rpx;
}
.unit-tab {
	flex: 1;
	text-align: center;
	padding: 10rpx 0;
	font-size: 24rpx;
	color: #8e8e8e;
	border-radius: 10rpx;
}
.unit-tab.active {
	background: #ffffff;
	color: #262626;
	font-weight: 600;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}
.modal-actions {
	display: flex;
	gap: 20rpx;
	margin-top: 30rpx;
}
.modal-actions .btn {
	flex: 1;
	height: 80rpx;
	border-radius: 12rpx;
	border: none;
	font-size: 28rpx;
}
.modal-actions .btn.cancel {
	background: #f0f0f0;
	color: #666;
}
.modal-actions .btn.confirm {
	background: #3cc51f;
	color: #ffffff;
}
</style>
