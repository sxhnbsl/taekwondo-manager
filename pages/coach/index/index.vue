<template>
	<view class="container">
		<view class="header">
			<view class="header-top">
				<view class="welcome">欢迎，{{ userInfo?.nickname || '用户' }}</view>
				<view class="date">{{ currentDate }}</view>
			</view>
			<view class="header-tips">
				<text class="tips-icon">💡</text>
				<text class="tips-text">今日暂无课程，点击"创建课程"开始安排</text>
			</view>
		</view>
		
		<view class="stats-grid">
			<view class="stat-card" @click="goToStudentList">
				<view class="stat-icon" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);">
					<image src="/static/images/icon-students.png" class="icon" mode="aspectFit"></image>
				</view>
				<view class="stat-info">
					<view class="stat-value">{{ stats.total_students }}</view>
					<view class="stat-label">学生总数</view>
				</view>
				<view class="stat-arrow">→</view>
			</view>
			
			<view class="stat-card" @click="goToClassList">
				<view class="stat-icon" style="background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);">
					<image src="/static/images/your-icon.png" class="icon" mode="aspectFit"></image>
				</view>
				<view class="stat-info">
					<view class="stat-value">{{ stats.total_courses }}</view>
					<view class="stat-label">课程总数</view>
				</view>
				<view class="stat-arrow">→</view>
			</view>
			
			<view class="stat-card warning-card" @click="goToHoursWarning">
				<view class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
					<text class="warning-icon">⚠️</text>
				</view>
				<view class="stat-info">
					<view class="stat-value">{{ lowHoursCount }}</view>
					<view class="stat-label">课时预警</view>
				</view>
				<view class="stat-arrow">→</view>
			</view>
			
			<view class="stat-card" @click="goToHoursManage">
				<view class="stat-icon" style="background: linear-gradient(135deg, #45b7d1 0%, #2980b9 100%);">
					<image src="/static/images/icon-hours.png" class="icon" mode="aspectFit"></image>
				</view>
				<view class="stat-info">
					<view class="stat-value">{{ stats.total_hours }}</view>
					<view class="stat-label">总课时</view>
				</view>
				<view class="stat-arrow">→</view>
			</view>
		</view>
		
		<view class="quick-actions">
			<view class="section-title">
				<text class="title-text">快捷操作</text>
				<image src="/static/images/icon-home.png" class="title-icon" mode="aspectFit"></image>
			</view>
			<view class="action-grid">
				<view class="action-item" @click="goToStudentList">
					<view class="action-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
						<image src="/static/images/icon-add-student.png" class="action-icon-img" mode="aspectFit"></image>
					</view>
					<view class="action-label">添加学生</view>
				</view>
				<view class="action-item" @click="goToClassCreate">
					<view class="action-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
						<image src="/static/images/icon-create-course.png" class="action-icon-img" mode="aspectFit"></image>
					</view>
					<view class="action-label">创建课程</view>
				</view>
				<view class="action-item" @click="goToHoursManage">
					<view class="action-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
						<image src="/static/images/icon-hours-manage.png" class="action-icon-img" mode="aspectFit"></image>
					</view>
					<view class="action-label">课时管理</view>
				</view>
				<view class="action-item" @click="goToClassList">
					<view class="action-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
						<image src="/static/images/icon-course-list.png" class="action-icon-img" mode="aspectFit"></image>
					</view>
					<view class="action-label">课程列表</view>
				</view>
				<view class="action-item" @click="goToNotificationList">
					<view class="action-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
						<image src="/static/images/icon-message.png" class="action-icon-img" mode="aspectFit"></image>
					</view>
					<view class="action-label">消息管理</view>
				</view>
				<view v-if="isAdmin" class="action-item" @click="goToCoachManage">
					<view class="action-icon" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);">
						<image src="/static/images/icon-coach-manage.png" class="action-icon-img" mode="aspectFit"></image>
					</view>
					<view class="action-label">教练管理</view>
				</view>
			</view>
		</view>
		
		<view class="today-courses">
			<view class="section-title">
				<text class="title-text">今日课程</text>
				<image src="/static/images/icon-today.png" class="title-icon" mode="aspectFit"></image>
			</view>
			<view v-if="todayCourses.length === 0" class="empty">
				<image src="/static/images/icon-course-list.png" class="empty-icon" mode="aspectFit"></image>
				<text class="empty-text">暂无今日课程</text>
				<text class="empty-tip">点击上方"创建课程"开始安排</text>
			</view>
			<view v-else class="course-list">
				<view 
					v-for="course in todayCourses" 
					:key="course._id" 
					class="course-item"
					@click="goToClassDetail(course._id)"
				>
					<view class="course-time">
						<text class="time">{{ course.start_time }}</text>
						<text class="separator">-</text>
						<text class="time">{{ course.end_time }}</text>
					</view>
					<view class="course-info">
						<view class="course-title">{{ course.title }}</view>
						<view class="course-meta">
							<text class="location">📍 {{ course.location }}</text>
							<text class="students">👥 {{ course.student_ids ? course.student_ids.length : 0 }}人</text>
						</view>
					</view>
					<view class="course-status" :class="course.status">
						{{ getStatusText(course.status) }}
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { statisticsAPI, courseAPI, studentAPI } from '@/utils/api.js'
import { formatDate, COURSE_STATUS } from '@/utils/common.js'
import { getShareConfig, getTimelineConfig } from '@/utils/share.js'

export default {
	data() {
		return {
			stats: {
				total_students: 0,
				total_courses: 0,
				total_hours: 0
			},
			todayCourses: [],
			students: [],
			loading: false,
			userInfo: null
		}
	},
	
	computed: {
		currentDate() {
			return formatDate(new Date(), 'YYYY-MM-DD')
		},
		isAdmin() {
			return this.userInfo && this.userInfo.role === 'admin'
		},
		isCoach() {
			return this.userInfo && this.userInfo.role === 'coach'
		},
		lowHoursCount() {
			return this.students.filter(s => s.remaining_hours <= 10).length
		}
	},
	
	onLoad() {
		this.userInfo = uni.getStorageSync('userInfo')
		if (!this.userInfo || (this.userInfo.role !== 'admin' && this.userInfo.role !== 'coach')) {
			uni.showToast({
				title: '无权限访问',
				icon: 'none'
			})
			setTimeout(() => {
				uni.redirectTo({
					url: '/pages/login/login'
				})
			}, 1500)
			return
		}
		this.loadData()
	},
	
	onShow() {
		if (this.isAdmin || this.isCoach) {
			this.loadData()
		}
	},
	
	onShareAppMessage() {
		return getShareConfig('/pages/coach/index/index', '欣兰体育 - 管理工作台')
	},
	
	onShareTimeline() {
		return getTimelineConfig('欣兰体育')
	},
	
	methods: {
		async loadData() {
			this.loading = true
			
			try {
				const [statsRes, coursesRes, studentsRes] = await Promise.all([
					statisticsAPI.getOverview(),
					courseAPI.getList({ 
						date: this.currentDate,
						page: 1,
						pageSize: 10
					}),
					studentAPI.getList({
						page: 1,
						pageSize: 100
					})
				])
				
				if (statsRes.code === 0) {
					this.stats = {
						total_students: statsRes.data.total_students || 0,
						total_courses: statsRes.data.total_courses || 0,
						total_hours: statsRes.data.total_hours || 0
					}
				}
				
				if (coursesRes.code === 0) {
					this.todayCourses = coursesRes.data.list || []
				}
				
				if (studentsRes.code === 0) {
					this.students = studentsRes.data.list || []
				}
			} catch (e) {
				console.error('加载数据失败:', e)
				uni.showToast({
					title: '数据加载失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},
		
		goToStudentList() {
			uni.navigateTo({
				url: '/pages/coach/student-list/student-list'
			})
		},
		
		goToClassList() {
			uni.navigateTo({
				url: '/pages/coach/class-list/class-list'
			})
		},
		
		goToTodayCourses() {
			uni.navigateTo({
				url: `/pages/coach/class-list/class-list?date=${this.currentDate}`
			})
		},
		
		goToClassCreate() {
			uni.navigateTo({
				url: '/pages/coach/class-create/class-create'
			})
		},
		
		goToHoursWarning() {
			uni.navigateTo({
				url: '/pages/coach/hours-warning/hours-warning'
			})
		},
		
		goToClassDetail(id) {
			uni.navigateTo({
				url: `/pages/coach/class-detail/class-detail?id=${id}`
			})
		},
		
		goToHoursManage() {
			uni.navigateTo({
				url: '/pages/coach/hours-manage/hours-manage'
			})
		},
		
		goToCoachManage() {
			uni.navigateTo({
				url: '/pages/coach/coach-manage/coach-manage'
			})
		},
		
		goToNotificationList() {
			uni.navigateTo({
				url: '/pages/coach/notification-list/notification-list'
			})
		},
		
		getStatusText(status) {
			const statusMap = {
				[COURSE_STATUS.PLANNED]: '计划中',
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
	background: #fafafa;
}

.header {
	background: #ffffff;
	padding: 40rpx 32rpx 30rpx;
	border-bottom: 1rpx solid #efefef;
}

.header-top {
	margin-bottom: 16rpx;
}

.welcome {
	font-size: 36rpx;
	font-weight: 600;
	color: #262626;
	margin-bottom: 8rpx;
}

.date {
	font-size: 26rpx;
	color: #8e8e8e;
}

.header-tips {
	background: #f5f5f5;
	border-radius: 10rpx;
	padding: 16rpx 20rpx;
	display: flex;
	align-items: center;
	gap: 10rpx;
	margin-top: 20rpx;
}

.tips-icon {
	font-size: 26rpx;
}

.tips-text {
	flex: 1;
	font-size: 24rpx;
	color: #8e8e8e;
}

.stats-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 16rpx;
	padding: 20rpx;
}

.stat-card {
	background: #ffffff;
	border-radius: 16rpx;
	padding: 24rpx;
	display: flex;
	align-items: center;
	border: 1rpx solid #efefef;
	transition: all 0.2s ease;
}

.stat-card:active {
	background: #f9f9f9;
}

.stat-icon {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 16rpx;
	background: #f5f5f5;
}

.stat-icon .icon {
	width: 40rpx;
	height: 40rpx;
}

.stat-info {
	flex: 1;
}

.stat-value {
	font-size: 36rpx;
	font-weight: 600;
	color: #262626;
	margin-bottom: 6rpx;
}

.stat-label {
	font-size: 24rpx;
	color: #8e8e8e;
}

.stat-arrow {
	font-size: 28rpx;
	color: #dbdbdb;
}

.warning-card {
	border: 2rpx solid #ff4d4f;
	background: linear-gradient(135deg, #fff1f0 0%, #fffbeb 100%);
	position: relative;
}

.warning-icon {
	font-size: 40rpx;
}

.quick-actions {
	padding: 20rpx;
}

.section-title {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 16rpx;
}

.title-text {
	font-size: 28rpx;
	font-weight: 600;
	color: #262626;
}

.title-icon {
	width: 28rpx;
	height: 28rpx;
	opacity: 0.6;
}

.action-grid {
	display: grid;
	grid-template-columns: repeat(5, 1fr);
	gap: 16rpx;
}

.action-item {
	background: #ffffff;
	border-radius: 16rpx;
	padding: 24rpx 16rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	border: 1rpx solid #efefef;
	transition: all 0.2s ease;
}

.action-item:active {
	background: #f9f9f9;
}

.action-icon {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 12rpx;
	background: #f5f5f5;
}

.action-icon-img {
	width: 40rpx;
	height: 40rpx;
}

.test-icon {
	font-size: 32rpx;
}

.action-label {
	font-size: 22rpx;
	color: #262626;
}

.today-courses {
	padding: 20rpx;
	padding-bottom: 40rpx;
}

.empty {
	background: #ffffff;
	border-radius: 16rpx;
	padding: 60rpx 40rpx;
	text-align: center;
	border: 1rpx solid #efefef;
}

.empty-icon {
	width: 80rpx;
	height: 80rpx;
	margin-bottom: 16rpx;
	opacity: 0.5;
}

.empty-text {
	display: block;
	font-size: 26rpx;
	color: #8e8e8e;
	margin-bottom: 8rpx;
}

.empty-tip {
	display: block;
	font-size: 22rpx;
	color: #c7c7c7;
}

.course-list {
	background: #ffffff;
	border-radius: 16rpx;
	padding: 16rpx;
	border: 1rpx solid #efefef;
}

.course-item {
	display: flex;
	align-items: center;
	padding: 20rpx 16rpx;
	border-bottom: 1rpx solid #efefef;
	transition: background 0.2s ease;
}

.course-item:active {
	background: #f9f9f9;
}

.course-item:last-child {
	border-bottom: none;
}

.course-time {
	width: 120rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	background: #fafafa;
	border-radius: 10rpx;
	padding: 14rpx 10rpx;
}

.course-time .time {
	font-size: 24rpx;
	color: #262626;
	font-weight: 600;
}

.course-time .separator {
	font-size: 18rpx;
	color: #8e8e8e;
	margin: 2rpx 0;
}

.course-info {
	flex: 1;
	margin-left: 16rpx;
}

.course-title {
	font-size: 28rpx;
	font-weight: 600;
	color: #262626;
	margin-bottom: 10rpx;
}

.course-meta {
	display: flex;
	flex-direction: column;
	gap: 4rpx;
}

.course-meta .location,
.course-meta .students {
	font-size: 22rpx;
	color: #8e8e8e;
}

.course-status {
	padding: 8rpx 16rpx;
	border-radius: 16rpx;
	font-size: 22rpx;
	font-weight: 500;
	white-space: nowrap;
}

.course-status.planned {
	background: #f0f0f0;
	color: #8e8e8e;
}

.course-status.ongoing {
	background: #fff8e1;
	color: #f9a825;
}

.course-status.completed {
	background: #e8f5e9;
	color: #4caf50;
}

.course-status.cancelled {
	background: #ffebee;
	color: #ef5350;
}
</style>
