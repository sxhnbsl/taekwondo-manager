<template>
	<view class="container">
		<view class="header">
			<view class="header-left">
				<text class="back-icon" @click="goBack">←</text>
				<view class="course-info">
					<view class="course-title">{{ course.title }}</view>
					<view class="course-meta">
						<text class="meta-item">📅 {{ formatDate(course.date) }}</text>
						<text class="meta-item">⏰ {{ course.start_time }} - {{ course.end_time }}</text>
						<text class="meta-item">📍 {{ course.location || '未设置' }}</text>
					</view>
				</view>
			</view>
		</view>
		
		<view class="section">
			<view class="section-title">
				<text class="title-icon">📝</text>
				<text>课程内容</text>
			</view>
			<view class="content">{{ course.content || '暂无课程内容' }}</view>
		</view>
		
		<view class="section">
			<view class="section-title">
				<text class="title-icon">📷</text>
				<text>课程照片</text>
				<text class="count">({{ mediaList.length }})</text>
			</view>
			<view v-if="mediaList.length === 0" class="empty">
				<view class="empty-icon">📷</view>
				<text class="empty-text">暂无照片</text>
			</view>
			<view v-else class="media-grid">
				<view 
					v-for="(media, index) in mediaList" 
					:key="index" 
					class="media-item"
					@click="previewMedia(media, index)"
				>
					<image 
						class="media-image" 
						:src="media.url" 
						mode="aspectFill"
					></image>
				</view>
			</view>
		</view>
		
		<view class="section">
			<view class="section-title">
				<text class="title-icon">👥</text>
				<text>上课学生</text>
				<text class="count">({{ students.length }}人)</text>
			</view>
			<view v-if="students.length === 0" class="empty">
				<view class="empty-icon">👥</view>
				<text class="empty-text">暂无学生信息</text>
			</view>
			<view v-else class="student-list">
				<view v-for="student in students" :key="student._id" class="student-item">
					<view class="avatar-placeholder">{{ student.name.charAt(0) }}</view>
					<view class="student-info">
						<view class="student-name">{{ student.name }}</view>
						<view class="student-level">{{ getLevelLabel(student.level) }}</view>
					</view>
					<view class="student-arrow">→</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { courseAPI, studentAPI } from '@/utils/api.js'
import { formatDate, getLevelLabel } from '@/utils/common.js'
import { getShareConfig, getTimelineConfig } from '@/utils/share.js'

export default {
	data() {
		return {
			course: {},
			mediaList: [],
			students: [],
			loading: false,
			courseId: ''
		}
	},
	
	onLoad(options) {
		if (options.id) {
			this.courseId = options.id
			this.loadCourseDetail(options.id)
		}
	},
	
	onShow() {
		if (this.courseId) {
			this.loadCourseDetail(this.courseId)
		}
	},
	
	onShareAppMessage() {
		const title = this.course.course_name ? `欣兰体育 - ${this.course.course_name}` : '欣兰体育 - 课程详情'
		return getShareConfig('/pages/parent/class-detail/class-detail', title)
	},
	
	onShareTimeline() {
		const title = this.course.course_name ? `欣兰体育 - ${this.course.course_name}` : '欣兰体育'
		return getTimelineConfig(title)
	},
	
	methods: {
		goBack() {
			uni.navigateBack()
		},
		
		async loadCourseDetail(courseId) {
			this.loading = true
			
			try {
				const courseRes = await courseAPI.getDetail(courseId)
				this.course = courseRes.data
				this.mediaList = this.course.media || []
				
				if (this.course.student_ids && this.course.student_ids.length > 0) {
					await this.loadStudents(this.course.student_ids)
				}
			} catch (e) {
				console.error('加载课程详情失败:', e)
			} finally {
				this.loading = false
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
		
		previewMedia(media, index) {
			if (media.type === 'image') {
				const urls = this.mediaList.filter(m => m.type === 'image').map(m => m.url)
				const current = urls.indexOf(media.url)
				uni.previewImage({
					urls: urls,
					current: current >= 0 ? current : 0
				})
			}
		},
		
		formatDate,
		getLevelLabel
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
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
}

.header-left {
	display: flex;
	align-items: center;
	gap: 20rpx;
}

.back-icon {
	font-size: 48rpx;
	color: #ffffff;
	font-weight: bold;
	padding: 10rpx;
	margin-left: -20rpx;
}

.course-title {
	font-size: 40rpx;
	font-weight: bold;
	color: #ffffff;
	margin-bottom: 20rpx;
}

.course-meta {
	display: flex;
	flex-direction: column;
	gap: 10rpx;
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.9);
}

.meta-item {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.section {
	background: #ffffff;
	margin: 20rpx;
	border-radius: 20rpx;
	padding: 30rpx;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.section-title {
	display: flex;
	align-items: center;
	gap: 10rpx;
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 20rpx;
}

.title-icon {
	font-size: 32rpx;
}

.count {
	font-size: 24rpx;
	color: #999;
	margin-left: 8rpx;
}

.content {
	font-size: 28rpx;
	color: #666;
	line-height: 1.8;
}

.empty {
	text-align: center;
	padding: 60rpx 0;
}

.empty-icon {
	font-size: 80rpx;
	margin-bottom: 20rpx;
}

.empty-text {
	color: #999;
	font-size: 28rpx;
}

.media-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 16rpx;
}

.media-item {
	position: relative;
	width: 100%;
	padding-top: 100%;
	border-radius: 16rpx;
	overflow: hidden;
	background: #f5f7fa;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.media-image {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
}

.student-list {
	display: flex;
	flex-direction: column;
	gap: 0;
}

.student-item {
	display: flex;
	align-items: center;
	padding: 24rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
}

.student-item:last-child {
	border-bottom: none;
}

.avatar-placeholder {
	width: 70rpx;
	height: 70rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: #ffffff;
	font-size: 28rpx;
	font-weight: bold;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 20rpx;
	box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
}

.student-info {
	flex: 1;
}

.student-name {
	font-size: 30rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 6rpx;
}

.student-level {
	font-size: 24rpx;
	color: #999;
}

.student-arrow {
	font-size: 28rpx;
	color: #ccc;
}
</style>