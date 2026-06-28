<template>
	<view class="container">
		<view class="header">
			<view class="header-top">
				<text class="header-title">上课记录</text>
				<text class="header-subtitle">查看孩子的历史课程</text>
			</view>
		</view>
		
		<view v-if="courses.length === 0" class="empty">
			<image src="/static/images/icon-empty-record.png" class="empty-icon" mode="aspectFit"></image>
			<text class="empty-text">暂无上课记录</text>
			<text class="empty-tip">孩子开始上课后，记录会显示在这里</text>
		</view>
		
		<view v-else class="course-list">
			<view 
				v-for="course in courses" 
				:key="course._id" 
				class="course-card"
				@click="goToDetail(course._id)"
			>
				<view class="course-header">
					<view class="course-date">
						<text class="day">{{ getDay(course.date) }}</text>
						<text class="month">{{ getMonth(course.date) }}</text>
					</view>
					<view class="course-time">
						<text>{{ course.start_time }} - {{ course.end_time }}</text>
					</view>
				</view>
				
				<view class="course-content">
					<view class="course-title">{{ course.title }}</view>
					<view class="course-info">
						<image src="/static/images/icon-course.png" class="info-icon" mode="aspectFit"></image>
						<text class="info-text">{{ course.location || '跆拳道馆' }}</text>
					</view>
					<view v-if="course.content" class="course-desc">{{ course.content }}</view>
				</view>
				
				<view class="course-footer">
					<view v-if="course.media_count > 0" class="course-media">
						<image src="/static/images/icon-media-upload.png" class="media-icon" mode="aspectFit"></image>
						<text class="media-count">{{ course.media_count }}个文件</text>
					</view>
					<view class="course-status">
						<view class="status-dot"></view>
						<text class="status-text">已完成</text>
					</view>
				</view>
			</view>
		</view>
		
		<view v-if="hasMore" class="load-more" @click="loadMore">
			<text>加载更多</text>
		</view>
	</view>
</template>

<script>
import { courseAPI, studentAPI } from '@/utils/api.js'
import { getShareConfig, getTimelineConfig } from '@/utils/share.js'

export default {
	data() {
		return {
			courses: [],
			page: 1,
			pageSize: 20,
			total: 0,
			loading: false,
			hasMore: false,
			students: []
		}
	},
	
	onLoad() {
		this.loadStudents()
	},
	
	onShow() {
		if (this.page === 1) {
			this.loadStudents()
		}
	},
	
	onShareAppMessage() {
		return getShareConfig('/pages/parent/class-history/class-history', '欣兰体育 - 上课记录')
	},
	
	onShareTimeline() {
		return getTimelineConfig('欣兰体育')
	},
	
	onPullDownRefresh() {
		this.page = 1
		this.loadStudents()
	},
	
	methods: {
		async loadStudents() {
			try {
				const res = await studentAPI.getList({
					page: 1,
					pageSize: 100
				})
				this.students = res.data.list
				this.loadCourses()
			} catch (e) {
				console.error('加载学生列表失败:', e)
			}
		},
		
		async loadCourses() {
			this.loading = true
			
			try {
				const params = {
					page: this.page,
					pageSize: this.pageSize
				}
				
				if (this.students.length > 0) {
					const studentIds = this.students.map(s => s._id)
					params.student_ids = studentIds
				}
				
				const res = await courseAPI.getList(params)
				
				if (this.page === 1) {
					this.courses = res.data.list
				} else {
					this.courses = [...this.courses, ...res.data.list]
				}
				
				this.total = res.data.total
				this.hasMore = this.courses.length < this.total
			} catch (e) {
				console.error('加载课程列表失败:', e)
			} finally {
				this.loading = false
				uni.stopPullDownRefresh()
			}
		},
		
		loadMore() {
			if (!this.loading && this.hasMore) {
				this.page++
				this.loadCourses()
			}
		},
		
		goToDetail(id) {
			uni.navigateTo({
				url: `/pages/parent/class-detail/class-detail?id=${id}`
			})
		},
		
		getDay(date) {
			const d = new Date(date)
			return String(d.getDate()).padStart(2, '0')
		},
		
		getMonth(date) {
			const d = new Date(date)
			const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
			return months[d.getMonth()]
		}
	}
}
</script>

<style scoped>
.container {
	min-height: 100vh;
	background: #f5f7fa;
}

.header {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	padding: 40rpx 40rpx 60rpx;
	color: #ffffff;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
}

.header-top {
	margin-bottom: 20rpx;
}

.header-title {
	font-size: 36rpx;
	font-weight: bold;
	margin-bottom: 10rpx;
	display: block;
}

.header-subtitle {
	font-size: 24rpx;
	opacity: 0.9;
	line-height: 1.4;
}

.empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding-top: 200rpx;
	padding: 100rpx 40rpx;
}

.empty-icon {
	width: 160rpx;
	height: 160rpx;
	margin-bottom: 30rpx;
	opacity: 0.7;
}

.empty-text {
	font-size: 32rpx;
	color: #666;
	margin-bottom: 12rpx;
	font-weight: 500;
}

.empty-tip {
	font-size: 24rpx;
	color: #999;
	text-align: center;
	line-height: 1.5;
}

.course-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
	padding: 20rpx;
	margin-top: -40rpx;
}

.course-card {
	background: #ffffff;
	border-radius: 20rpx;
	padding: 30rpx;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
	transition: transform 0.2s;
}

.course-card:active {
	transform: scale(0.98);
}

.course-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24rpx;
}

.course-date {
	display: flex;
	flex-direction: column;
	align-items: center;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: #ffffff;
	padding: 16rpx 24rpx;
	border-radius: 12rpx;
	box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
}

.course-date .day {
	font-size: 36rpx;
	font-weight: bold;
}

.course-date .month {
	font-size: 24rpx;
	opacity: 0.9;
}

.course-time {
	font-size: 26rpx;
	color: #666;
	font-weight: 500;
}

.course-content {
	margin-bottom: 24rpx;
}

.course-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 16rpx;
	line-height: 1.4;
}

.course-info {
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-bottom: 16rpx;
}

.info-icon {
	width: 28rpx;
	height: 28rpx;
	opacity: 0.7;
}

.info-text {
	font-size: 26rpx;
	color: #999;
}

.course-desc {
	font-size: 26rpx;
	color: #666;
	line-height: 1.6;
	opacity: 0.85;
}

.course-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-top: 20rpx;
	border-top: 2rpx solid #f0f0f0;
}

.course-media {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.media-icon {
	width: 24rpx;
	height: 24rpx;
	opacity: 0.7;
}

.media-count {
	font-size: 24rpx;
	color: #667eea;
	font-weight: 500;
}

.course-status {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.status-dot {
	width: 12rpx;
	height: 12rpx;
	background: #3cc51f;
	border-radius: 50%;
	animation: pulse 2s infinite;
}

@keyframes pulse {
	0% {
		transform: scale(1);
		opacity: 1;
	}
	50% {
		transform: scale(1.2);
		opacity: 0.7;
	}
	100% {
		transform: scale(1);
		opacity: 1;
	}
}

.status-text {
	font-size: 24rpx;
	color: #3cc51f;
	font-weight: 500;
}

.load-more {
	text-align: center;
	padding: 30rpx 0;
	color: #667eea;
	font-size: 28rpx;
	font-weight: 500;
	margin-top: 20rpx;
}

.load-more:active {
	color: #764ba2;
}
</style>
