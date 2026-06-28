<template>
	<view class="container">
		<view class="header">
			<text class="title">数据统计</text>
		</view>
		
		<view class="date-filter">
			<picker 
				mode="date" 
				:value="startDate" 
				@change="onStartDateChange"
			>
				<view class="picker">
					{{ startDate ? formatDate(startDate) : '开始日期' }}
				</view>
			</picker>
			<text class="separator">至</text>
			<picker 
				mode="date" 
				:value="endDate" 
				@change="onEndDateChange"
			>
				<view class="picker">
					{{ endDate ? formatDate(endDate) : '结束日期' }}
				</view>
			</picker>
		</view>
		
		<view class="stats-grid">
			<view class="stat-card">
				<view class="stat-icon" style="background: #ff6b6b;">
					<text class="icon">👥</text>
				</view>
				<view class="stat-info">
					<view class="stat-value">{{ stats.total_students }}</view>
					<view class="stat-label">总学生数</view>
				</view>
			</view>
			
			<view class="stat-card">
				<view class="stat-icon">
					<image src="/static/images/your-icon.png" class="icon-image" mode="aspectFit"></image>
				</view>
				<view class="stat-info">
					<view class="stat-value">{{ stats.total_courses }}</view>
					<view class="stat-label">总课程数</view>
				</view>
			</view>
			
			<view class="stat-card">
				<view class="stat-icon" style="background: #45b7d1;">
					<text class="icon">⏰</text>
				</view>
				<view class="stat-info">
					<view class="stat-value">{{ stats.total_hours }}</view>
					<view class="stat-label">总课时数</view>
				</view>
			</view>
			
			<view class="stat-card">
				<view class="stat-icon" style="background: #96ceb4;">
					<text class="icon">💰</text>
				</view>
				<view class="stat-info">
					<view class="stat-value">¥{{ stats.total_revenue }}</view>
					<view class="stat-label">总收入</view>
				</view>
			</view>
		</view>
		
		<view class="chart-section">
			<view class="section-title">课时趋势</view>
			<view class="chart-container">
				<view class="chart-bars">
					<view 
						v-for="(item, index) in chartData" 
						:key="index"
						class="chart-bar-item"
					>
						<view 
							class="chart-bar" 
							:style="{ height: getBarHeight(item.hours) }"
						></view>
						<view class="chart-label">{{ item.date }}</view>
						<view class="chart-value">{{ item.hours }}</view>
					</view>
				</view>
			</view>
		</view>
		
		<view class="list-section">
			<view class="section-title">学生课时排行</view>
			<view v-if="topStudents.length === 0" class="empty">
				<text>暂无数据</text>
			</view>
			<view v-else class="rank-list">
				<view 
					v-for="(student, index) in topStudents" 
					:key="student._id"
					class="rank-item"
				>
					<view class="rank-number" :class="`rank-${index + 1}`">
						{{ index + 1 }}
					</view>
					<view class="avatar-placeholder">{{ student.name.charAt(0) }}</view>
					<view class="rank-info">
						<view class="rank-name">{{ student.name }}</view>
						<view class="rank-level">{{ getLevelLabel(student.level) }}</view>
					</view>
					<view class="rank-hours">
						<text class="hours-value">{{ student.used_hours }}</text>
						<text class="hours-label">课时</text>
					</view>
				</view>
			</view>
		</view>
		
		<view class="list-section">
			<view class="section-title">近期课程</view>
			<view v-if="recentCourses.length === 0" class="empty">
				<text>暂无数据</text>
			</view>
			<view v-else class="course-list">
				<view 
					v-for="course in recentCourses" 
					:key="course._id"
					class="course-item"
				>
					<view class="course-date">
						<text class="day">{{ getDay(course.date) }}</text>
						<text class="month">{{ getMonth(course.date) }}</text>
					</view>
					<view class="course-content">
						<view class="course-title">{{ course.title }}</view>
						<view class="course-time">{{ course.start_time }} - {{ course.end_time }}</view>
						<view class="course-students">
							<text class="student-count">👥 {{ course.student_count }}人</text>
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
import { statisticsAPI } from '@/utils/api.js'
import { formatDate, getLevelLabel, COURSE_STATUS } from '@/utils/common.js'
import { getShareConfig, getTimelineConfig } from '@/utils/share.js'

export default {
	data() {
		return {
			startDate: '',
			endDate: '',
			stats: {
				total_students: 0,
				total_courses: 0,
				total_hours: 0,
				total_revenue: 0
			},
			chartData: [],
			topStudents: [],
			recentCourses: [],
			loading: false,
			userInfo: null
		}
	},
	
	computed: {
		isAdmin() {
			return this.userInfo && this.userInfo.role === 'admin'
		},
		isCoach() {
			return this.userInfo && this.userInfo.role === 'coach'
		}
	},
	
	onLoad() {
		this.userInfo = uni.getStorageSync('userInfo')
		
		// 检查是否为管理员或教练
		if (!this.isAdmin && !this.isCoach) {
			uni.showToast({
				title: '权限不足',
				icon: 'none'
			})
			setTimeout(() => {
				uni.navigateBack()
			}, 1500)
			return
		}
		
		this.loadStatistics()
	},
	
	onShareAppMessage() {
		return getShareConfig('/pages/coach/statistics/statistics', '欣兰体育 - 数据统计')
	},
	
	onShareTimeline() {
		return getTimelineConfig('欣兰体育')
	},
	
	methods: {
		initDateRange() {
			const now = new Date()
			const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
			
			this.endDate = this.formatDate(now)
			this.startDate = this.formatDate(thirtyDaysAgo)
		},
		
		async loadStatistics() {
			this.loading = true
			
			try {
				const res = await statisticsAPI.getOverview({
					start_date: this.startDate,
					end_date: this.endDate
				})
				
				this.stats = res.data.stats
				this.chartData = res.data.chart_data
				this.topStudents = res.data.top_students
				this.recentCourses = res.data.recent_courses
			} catch (e) {
				console.error('加载统计数据失败:', e)
			} finally {
				this.loading = false
			}
		},
		
		onStartDateChange(e) {
			this.startDate = e.detail.value
			this.loadStatistics()
		},
		
		onEndDateChange(e) {
			this.endDate = e.detail.value
			this.loadStatistics()
		},
		
		getBarHeight(hours) {
			const maxHours = Math.max(...this.chartData.map(item => item.hours))
			if (maxHours === 0) return '0%'
			return `${(hours / maxHours) * 100}%`
		},
		
		getDay(date) {
			const d = new Date(date)
			return String(d.getDate()).padStart(2, '0')
		},
		
		getMonth(date) {
			const d = new Date(date)
			const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
			return months[d.getMonth()]
		},
		
		getStatusText(status) {
			const statusMap = {
				[COURSE_STATUS.PLANNED]: '计划中',
				[COURSE_STATUS.ONGOING]: '进行中',
				[COURSE_STATUS.COMPLETED]: '已完成',
				[COURSE_STATUS.CANCELLED]: '已取消'
			}
			return statusMap[status] || status
		},
		
		formatDate,
		getLevelLabel
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

.date-filter {
	background: #ffffff;
	margin: 20rpx;
	border-radius: 16rpx;
	padding: 30rpx;
	display: flex;
	align-items: center;
	gap: 20rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.picker {
	flex: 1;
	height: 72rpx;
	background: #f5f5f5;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 26rpx;
	color: #333;
}

.separator {
	font-size: 28rpx;
	color: #999;
}

.stats-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 20rpx;
	padding: 0 20rpx;
	margin-bottom: 20rpx;
}

.stat-card {
	background: #ffffff;
	border-radius: 16rpx;
	padding: 30rpx;
	display: flex;
	align-items: center;
	gap: 20rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.stat-icon {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.stat-icon .icon {
				font-size: 40rpx;
			}

			.stat-icon .icon-image {
				width: 60rpx;
				height: 60rpx;
				object-fit: contain;
				z-index: 1;
				position: relative;
				display: block;
			}

.stat-info {
	flex: 1;
}

.stat-value {
	font-size: 40rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 8rpx;
}

.stat-label {
	font-size: 24rpx;
	color: #999;
}

.chart-section,
.list-section {
	background: #ffffff;
	margin: 20rpx;
	border-radius: 16rpx;
	padding: 30rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 30rpx;
}

.chart-container {
	padding: 20rpx 0;
}

.chart-bars {
	display: flex;
	align-items: flex-end;
	gap: 20rpx;
	height: 300rpx;
}

.chart-bar-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.chart-bar {
	width: 40rpx;
	background: linear-gradient(180deg, #3cc51f 0%, #2a9e16 100%);
	border-radius: 8rpx 8rpx 0 0;
	min-height: 4rpx;
}

.chart-label {
	margin-top: 10rpx;
	font-size: 20rpx;
	color: #999;
}

.chart-value {
	margin-top: 5rpx;
	font-size: 24rpx;
	color: #333;
	font-weight: bold;
}

.empty {
	text-align: center;
	padding: 60rpx 0;
	color: #999;
	font-size: 28rpx;
}

.rank-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.rank-item {
	display: flex;
	align-items: center;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
}

.rank-number {
	width: 60rpx;
	height: 60rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	font-weight: bold;
	margin-right: 20rpx;
}

.rank-number.rank-1 {
	background: #ffd700;
	color: #ffffff;
}

.rank-number.rank-2 {
	background: #c0c0c0;
	color: #ffffff;
}

.rank-number.rank-3 {
	background: #cd7f32;
	color: #ffffff;
}

.avatar-placeholder {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	background: #3cc51f;
	color: #ffffff;
	font-size: 32rpx;
	font-weight: bold;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 20rpx;
}

.rank-info {
	flex: 1;
}

.rank-name {
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 8rpx;
}

.rank-level {
	font-size: 24rpx;
	color: #999;
}

.rank-hours {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.hours-value {
	font-size: 32rpx;
	font-weight: bold;
	color: #3cc51f;
}

.hours-label {
	font-size: 20rpx;
	color: #999;
}

.course-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.course-item {
	display: flex;
	align-items: center;
	padding: 20rpx;
	background: #f8f8f8;
	border-radius: 12rpx;
}

.course-date {
	display: flex;
	flex-direction: column;
	align-items: center;
	background: #3cc51f;
	color: #ffffff;
	padding: 16rpx 20rpx;
	border-radius: 12rpx;
	margin-right: 20rpx;
}

.course-date .day {
	font-size: 32rpx;
	font-weight: bold;
}

.course-date .month {
	font-size: 20rpx;
}

.course-content {
	flex: 1;
}

.course-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 8rpx;
}

.course-time {
	font-size: 24rpx;
	color: #999;
	margin-bottom: 8rpx;
}

.course-students {
	font-size: 24rpx;
	color: #666;
}

.student-count {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.course-status {
	padding: 8rpx 20rpx;
	border-radius: 8rpx;
	font-size: 24rpx;
}

.course-status.planned {
	background: #e3f2fd;
	color: #1976d2;
}

.course-status.ongoing {
	background: #fff3e0;
	color: #f57c00;
}

.course-status.completed {
	background: #e8f5e9;
	color: #388e3c;
}

.course-status.cancelled {
	background: #ffebee;
	color: #d32f2f;
}
</style>
