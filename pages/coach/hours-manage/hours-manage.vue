<template>
	<view class="container">
		<view class="header">
			<view class="search-box">
				<input 
					class="search-input" 
					v-model="keyword" 
					placeholder="搜索学生姓名"
					placeholder-class="placeholder"
					@input="onSearchInput"
				/>
				<text class="search-icon">🔍</text>
			</view>
		</view>
		
		<view v-if="students.length === 0" class="empty">
			<view class="empty-icon">📊</view>
			<text>暂无学生信息</text>
		</view>
		
		<view v-else class="student-list">
			<view 
				v-for="student in students" 
				:key="student._id" 
				class="student-card"
				@click="selectStudent(student)"
			>
				<view class="student-info">
					<view class="avatar-placeholder">{{ student.name.charAt(0) }}</view>
					<view class="info">
						<view class="name">{{ student.name }}</view>
						<view class="detail">
							<text class="level">{{ getLevelLabel(student.level) }}</text>
							<text class="separator">|</text>
							<text class="mobile">{{ student.parent_mobile }}</text>
						</view>
					</view>
				</view>
				<view class="hours-info">
						<view class="hours-item">
						<text class="label">剩余总课时</text>
						<text class="value primary">{{ (student.remaining_hours || 0) + (student.remaining_days || 0) + (student.remaining_private_hours || 0) }}</text>
					</view>
						<view class="hours-divider"></view>
						<view class="hours-item">
							<text class="label">剩余节数课时</text>
							<text class="value primary">{{ student.remaining_hours || 0 }}</text>
						</view>
						<view class="hours-divider"></view>
						<view class="hours-item">
							<text class="label">剩余天数</text>
							<text class="value primary">{{ student.remaining_days || 0 }}</text>
						</view>
						<view class="hours-divider"></view>
						<view class="hours-item">
							<text class="label">剩余私教</text>
							<text class="value primary">{{ student.remaining_private_hours || 0 }}</text>
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
import { studentAPI } from '@/utils/api.js'
import { getLevelLabel } from '@/utils/common.js'
import { getShareConfig, getTimelineConfig } from '@/utils/share.js'

export default {
	data() {
		return {
			students: [],
			keyword: '',
			page: 1,
			pageSize: 20,
			total: 0,
			loading: false,
			hasMore: false,
			searchTimer: null,
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
		
		this.loadStudents()
	},
	
	onShow() {
		this.loadStudents()
	},
	
	onShareAppMessage() {
		return getShareConfig('/pages/coach/hours-manage/hours-manage', '欣兰体育 - 课时管理')
	},
	
	onShareTimeline() {
		return getTimelineConfig('欣兰体育')
	},
	
	methods: {
		async loadStudents() {
			this.loading = true
			
			try {
				const res = await studentAPI.getList({
					keyword: this.keyword,
					page: this.page,
					pageSize: this.pageSize
				})
				
				if (this.page === 1) {
					this.students = res.data.list
				} else {
					this.students = [...this.students, ...res.data.list]
				}
				
				this.total = res.data.total
				this.hasMore = this.students.length < this.total
			} catch (e) {
				console.error('加载学生列表失败:', e)
			} finally {
				this.loading = false
			}
		},
		
		onSearchInput() {
			// 简单的防抖实现
			if (this.searchTimer) {
				clearTimeout(this.searchTimer)
			}
			this.searchTimer = setTimeout(() => {
				this.page = 1
				this.loadStudents()
			}, 500)
		},
		
		loadMore() {
			if (!this.loading && this.hasMore) {
				this.page++
				this.loadStudents()
			}
		},
		
		selectStudent(student) {
			uni.navigateTo({
				url: `/pages/coach/hours-manage-detail/hours-manage-detail?studentId=${student._id}`
			})
		},
		
		getLevelLabel(level) {
			return getLevelLabel(level)
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
	padding: 20rpx;
	display: flex;
	align-items: center;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.search-box {
	flex: 1;
	position: relative;
}

.search-input {
	width: 100%;
	height: 72rpx;
	background: #fafafa;
	border: 1rpx solid #dbdbdb;
	border-radius: 36rpx;
	padding: 0 80rpx 0 30rpx;
	font-size: 28rpx;
	box-sizing: border-box;
}

.placeholder {
	color: #999;
}

.search-icon {
	position: absolute;
	right: 30rpx;
	top: 50%;
	transform: translateY(-50%);
	font-size: 32rpx;
}

.empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding-top: 200rpx;
}

.empty-icon {
	font-size: 120rpx;
	margin-bottom: 30rpx;
}

.empty text {
	font-size: 30rpx;
	color: #999;
}

.student-list {
	padding: 20rpx;
}

.student-card {
	background: #ffffff;
	border-radius: 12rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.student-info {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
}

.avatar-placeholder {
	width: 80rpx;
	height: 80rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 36rpx;
	color: #ffffff;
	margin-right: 20rpx;
}

.info .name {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 8rpx;
}

.info .detail {
	font-size: 24rpx;
	color: #999;
}

.info .separator {
	margin: 0 10rpx;
}

.hours-info {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-around;
		padding: 20rpx 0;
		border-top: 1rpx solid #f0f0f0;
	}

.hours-item {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.hours-item .label {
	font-size: 24rpx;
	color: #999;
	margin-bottom: 8rpx;
}

.hours-item .value {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
}

.hours-item .value.primary {
		color: #3cc51f;
	}

	.hours-divider {
		width: 1rpx;
		height: 60rpx;
		background: #e0e0e0;
	}

.load-more {
	text-align: center;
	padding: 30rpx;
	font-size: 28rpx;
	color: #666;
}
</style>
