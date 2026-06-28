<template>
	<view class="container">
		<view class="header">
			<view class="filter-box">
				<picker 
					mode="date" 
					:value="filterDate" 
					@change="onDateChange"
				>
					<view class="picker">
						<text class="picker-icon">📅</text>
						<text class="picker-text">{{ filterDate ? filterDate : '全部日期' }}</text>
					</view>
				</picker>
				<view class="filter-tabs">
				<view 
					class="filter-tab" 
					:class="{ active: filterStatus === '' }"
					@click="switchFilter('')"
				>
					全部
				</view>
				<view 
					class="filter-tab" 
					:class="{ active: filterStatus === 'ongoing' }"
					@click="switchFilter('ongoing')"
				>
					进行中
				</view>
				<view 
					class="filter-tab" 
					:class="{ active: filterStatus === 'completed' }"
					@click="switchFilter('completed')"
				>
					已完成
				</view>
			</view>
			</view>
			<button class="add-btn" @click="goToCreate">
				<text class="add-icon">➕</text>
				<text class="add-text">创建</text>
			</button>
		</view>
		
		<view v-if="courses.length === 0 && !loading" class="empty">
			<view class="empty-icon">📚</view>
			<text class="empty-text">暂无课程</text>
			<text class="empty-tip">点击右上角"创建"按钮开始添加课程</text>
		</view>
		
		<view v-else class="course-list">
			<view 
				v-for="course in courses" 
				:key="course._id" 
				class="course-card"
			>
				<view class="course-header" @click="goToDetail(course._id)">
					<view class="course-date">
						<text class="day">{{ getDay(course.date) }}</text>
						<text class="month">{{ getMonth(course.date) }}</text>
					</view>
					<view class="course-time">
						<text class="time-icon">⏰</text>
						<text class="time-text">{{ course.start_time }} - {{ course.end_time }}</text>
					</view>
					<view class="course-status" :class="course.status">
						{{ getStatusText(course.status) }}
					</view>
				</view>
				
				<view class="course-content" @click="goToDetail(course._id)">
					<view class="course-title">{{ course.title }}</view>
					<view class="course-meta">
						<text class="location">📍 {{ course.location }}</text>
						<text class="separator">•</text>
						<text class="students">👥 {{ course.student_ids ? course.student_ids.length : 0 }}人</text>
					</view>
					<view class="course-desc">{{ course.content || '暂无课程内容' }}</view>
				</view>
				
				<view class="course-footer">
					<view class="course-media" v-if="course.media_count > 0">
						<text class="media-count">📷 {{ course.media_count }}个</text>
					</view>
					<view class="actions">
						<button class="action-btn edit" @click.stop="goToEdit(course._id)">
							<text class="btn-icon">✏️</text>
							<text>编辑</text>
						</button>
						<button v-if="isAdmin" class="action-btn delete" @click.stop="confirmDelete(course)">
							<text class="btn-icon">🗑️</text>
							<text>删除</text>
						</button>
					</view>
				</view>
			</view>
		</view>
		
		<view v-if="loading" class="loading">
			<text>加载中...</text>
		</view>
		
		<view v-if="hasMore && !loading" class="load-more" @click="loadMore">
			<text>加载更多</text>
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
			courses: [],
			filterDate: '',
			filterStatus: '',
			page: 1,
			pageSize: 20,
			total: 0,
			loading: false,
			hasMore: false,
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
	
	onLoad(options) {
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
		
		this.loadCourses()
	},
	
	onShow() {
		this.loadCourses()
	},
	
	onShareAppMessage() {
		return getShareConfig('/pages/coach/class-list/class-list', '欣兰体育 - 课程管理')
	},
	
	onShareTimeline() {
		return getTimelineConfig('欣兰体育')
	},
	
	onPullDownRefresh() {
		this.page = 1
		this.loadCourses()
	},
	
	methods: {
		async loadCourses() {
			this.loading = true
			
			try {
				const params = {
					page: this.page,
					pageSize: this.pageSize
				}
				
				if (this.filterDate) {
					params.date = this.filterDate
				}
				
				if (this.filterStatus) {
					params.status = this.filterStatus
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
		
		onDateChange(e) {
		this.filterDate = e.detail.value
		this.page = 1
		this.loadCourses()
	},
	
	switchFilter(status) {
		this.filterStatus = status
		this.page = 1
		this.loadCourses()
	},
		
		loadMore() {
			if (!this.loading && this.hasMore) {
				this.page++
				this.loadCourses()
			}
		},
		
		goToCreate() {
			uni.navigateTo({
				url: '/pages/coach/class-create/class-create'
			})
		},
		
		goToDetail(id) {
			uni.navigateTo({
				url: `/pages/coach/class-edit/class-edit?id=${id}`
			})
		},
		
		goToEdit(id) {
			uni.navigateTo({
				url: `/pages/coach/class-edit/class-edit?id=${id}`
			})
		},
		
		async confirmDelete(course) {
			let confirmContent = `确定要删除课程"${course.title}"吗？`
			
			if (course.status === 'completed' && course.student_ids && course.student_ids.length > 0) {
				try {
					const courseDetailRes = await courseAPI.getDetail(course._id)
					if (courseDetailRes.data && courseDetailRes.data.student_ids) {
						const studentIds = courseDetailRes.data.student_ids
						const studentRes = await studentAPI.getList({
							ids: studentIds,
							page: 1,
							pageSize: 100
						})
						if (studentRes.data && studentRes.data.list) {
							const studentNames = studentRes.data.list.map(s => s.name).join('、')
							confirmContent = `确定要删除课程"${course.title}"吗？\n\n将把课时返还给：${studentNames}`
						}
					}
				} catch (e) {
					console.error('获取课程详情失败:', e)
				}
			}
			
			uni.showModal({
				title: '确认删除',
				content: confirmContent,
				confirmText: '确定',
				cancelText: '取消',
				success: async (res) => {
					if (res.confirm) {
						await this.deleteCourse(course._id)
					}
				}
			})
		},
		
		async deleteCourse(id) {
			try {
				await courseAPI.delete(id)
				
				uni.showToast({
					title: '删除成功',
					icon: 'success'
				})
				
				this.page = 1
				this.loadCourses()
			} catch (e) {
				console.error('删除课程失败:', e)
			}
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
	padding: 16rpx 20rpx;
	display: flex;
	align-items: center;
	gap: 16rpx;
	border-bottom: 1rpx solid #efefef;
	position: sticky;
	top: 0;
	z-index: 100;
}

.filter-box {
	flex: 1;
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.picker {
	flex: 1;
	height: 64rpx;
	background: #fafafa;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 26rpx;
	color: #262626;
	gap: 8rpx;
	border: 1rpx solid #efefef;
}

.picker-icon {
	font-size: 26rpx;
}

.picker-text {
	font-size: 26rpx;
}

.filter-tabs {
	display: flex;
	gap: 8rpx;
}

.filter-tab {
	padding: 14rpx 20rpx;
	background: #fafafa;
	border-radius: 12rpx;
	font-size: 24rpx;
	color: #8e8e8e;
	transition: all 0.2s ease;
	border: 1rpx solid #efefef;
}

.filter-tab.active {
	background: #262626;
	color: #ffffff;
	font-weight: 600;
	border-color: #262626;
}

.add-btn {
	height: 64rpx;
	background: #0095f6;
	color: #ffffff;
	border: none;
	border-radius: 12rpx;
	padding: 0 20rpx;
	font-size: 26rpx;
	display: flex;
	align-items: center;
	gap: 6rpx;
	transition: all 0.2s ease;
}

.add-btn:active {
	opacity: 0.8;
}

.add-btn::after {
	border: none;
}

.add-icon {
	font-size: 26rpx;
}

.add-text {
	font-size: 24rpx;
}

.empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding-top: 200rpx;
}

.empty-icon {
	font-size: 100rpx;
	margin-bottom: 24rpx;
	opacity: 0.4;
}

.empty-text {
	font-size: 28rpx;
	color: #8e8e8e;
	margin-bottom: 8rpx;
}

.empty-tip {
	font-size: 22rpx;
	color: #c7c7c7;
}

.course-list {
	padding: 16rpx;
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.course-card {
	background: #ffffff;
	border-radius: 16rpx;
	padding: 24rpx;
	border: 1rpx solid #efefef;
	transition: all 0.2s ease;
}

.course-card:active {
	background: #f9f9f9;
}

.course-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.course-date {
	display: flex;
	flex-direction: column;
	align-items: center;
	background: #f5f5f5;
	color: #262626;
	padding: 14rpx 20rpx;
	border-radius: 12rpx;
}

.course-date .day {
	font-size: 32rpx;
	font-weight: 600;
}

.course-date .month {
	font-size: 22rpx;
	color: #8e8e8e;
}

.course-time {
	flex: 1;
	margin: 0 16rpx;
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.time-icon {
	font-size: 26rpx;
	opacity: 0.6;
}

.time-text {
	font-size: 26rpx;
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

.course-content {
	margin-bottom: 20rpx;
}

.course-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #262626;
	margin-bottom: 12rpx;
}

.course-meta {
	display: flex;
	align-items: center;
	gap: 10rpx;
	font-size: 24rpx;
	color: #8e8e8e;
	margin-bottom: 10rpx;
}

.separator {
	font-size: 18rpx;
	color: #dbdbdb;
}

.course-desc {
	font-size: 24rpx;
	color: #8e8e8e;
	line-height: 1.5;
}

.course-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-top: 16rpx;
	border-top: 1rpx solid #efefef;
}

.course-media {
	display: flex;
	align-items: center;
	gap: 8rpx;
	font-size: 22rpx;
	color: #8e8e8e;
}

.media-count {
	display: flex;
	align-items: center;
	gap: 6rpx;
}

.actions {
	display: flex;
	gap: 12rpx;
}

.action-btn {
	height: 64rpx;
	border-radius: 12rpx;
	font-size: 26rpx;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6rpx;
	padding: 0 20rpx;
	transition: all 0.2s ease;
}

.action-btn::after {
	border: none;
}

.action-btn:active {
	opacity: 0.8;
}

.action-btn .btn-icon {
	font-size: 26rpx;
}

.action-btn.edit {
	background: #f5f5f5;
	color: #262626;
}

.action-btn.delete {
	background: #f5f5f5;
	color: #ef5350;
}

.loading {
	text-align: center;
	padding: 40rpx;
	font-size: 26rpx;
	color: #8e8e8e;
}

.load-more {
	text-align: center;
	padding: 24rpx;
	font-size: 26rpx;
	color: #0095f6;
	background: #ffffff;
	margin: 16rpx;
	border-radius: 12rpx;
	border: 1rpx solid #efefef;
}
</style>
