<template>
	<view class="container">
		<view class="header">
			<view class="header-top">
				<view class="header-left"></view>
				<view class="header-center">
					<view class="welcome">欢迎，家长</view>
					<view class="date">{{ currentDate }}</view>
				</view>
				<view class="header-right">
					<view class="menu-btn" @click="showMenu">
						<text class="menu-icon">⋮</text>
					</view>
				</view>
			</view>
			<view class="header-tips">
				<image src="/static/images/icon-home.png" class="tips-icon" mode="aspectFit"></image>
				<text class="tips-text">查看孩子的课程记录和剩余课时</text>
			</view>
		</view>
		
		<view v-if="students.length === 0" class="empty">
			<image src="/static/images/icon-child.png" class="empty-icon" mode="aspectFit"></image>
			<text class="empty-text">暂无孩子信息</text>
			<text class="empty-tip">添加孩子后可以查看课程记录</text>
			<button class="bind-btn" @click="bindStudent">
				<image src="/static/images/icon-add-child.png" class="btn-icon" mode="aspectFit"></image>
				<text>添加孩子</text>
			</button>
		</view>
		
		<view v-else class="student-list">
			<view 
				v-for="student in students" 
				:key="student._id" 
				class="student-card"
				@click="goToDetail(student._id)"
			>
				<view class="student-info">
					<view class="avatar-placeholder">{{ student.name.charAt(0) }}</view>
					<view class="info">
						<view class="name">{{ student.name }}</view>
						<view class="level">{{ getLevelLabel(student.level) }}</view>
					</view>
					<view class="card-arrow">→</view>
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
			
			<button class="add-btn" @click="bindStudent">
				<image src="/static/images/icon-add-child.png" class="btn-icon" mode="aspectFit"></image>
				<text>添加孩子</text>
			</button>
		</view>
		
		<view v-if="showMenuPopup" class="menu-popup" @click="hideMenu">
			<view class="menu-content" @click.stop>
				<view class="menu-item" @click="logout">
					<text class="menu-text">退出登录</text>
				</view>
				<view class="menu-divider"></view>
				<view class="menu-item danger" @click="goToDeleteAccount">
					<text class="menu-text">注销账号</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { studentAPI } from '@/utils/api.js'
import { getLevelLabel, isParent, STORAGE_KEYS } from '@/utils/common.js'
import { getShareConfig, getTimelineConfig } from '@/utils/share.js'

export default {
	data() {
		return {
			students: [],
			loading: false,
			currentDate: '',
			showMenuPopup: false
		}
	},
	
	onLoad() {
		this.updateDate()
		if (!isParent()) {
			uni.showToast({
				title: '无权限访问',
				icon: 'none'
			})
			setTimeout(() => {
				uni.switchTab({
					url: '/pages/login/login'
				})
			}, 1500)
			return
		}
		this.loadStudents()
	},
	
	onShow() {
		this.updateDate()
		if (isParent()) {
			this.loadStudents()
		}
	},
	
	onShareAppMessage() {
		return getShareConfig('/pages/parent/index/index', '欣兰体育 - 我的孩子')
	},
	
	onShareTimeline() {
		return getTimelineConfig('欣兰体育')
	},
	
	methods: {
		showMenu() {
			this.showMenuPopup = true
		},

		hideMenu() {
			this.showMenuPopup = false
		},

		goToDeleteAccount() {
			this.hideMenu()
			uni.navigateTo({
				url: '/pages/parent/delete-account/delete-account'
			})
		},

		updateDate() {
			const now = new Date()
			const year = now.getFullYear()
			const month = String(now.getMonth() + 1).padStart(2, '0')
			const day = String(now.getDate()).padStart(2, '0')
			const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
			const weekDay = weekDays[now.getDay()]
			this.currentDate = `${year}年${month}月${day}日 ${weekDay}`
		},
		
		async loadStudents() {
			this.loading = true
			
			try {
				const res = await studentAPI.getList({
					page: 1,
					pageSize: 20
				})
				
				this.students = res.data.list
			} catch (e) {
				console.error('加载学生列表失败:', e)
			} finally {
				this.loading = false
			}
		},
		
		goToDetail(id) {
			uni.navigateTo({
				url: `/pages/parent/student-detail/student-detail?id=${id}`
			})
		},
		
		bindStudent() {
			uni.navigateTo({
				url: '/pages/parent/bind-student/bind-student'
			})
		},
		
		logout() {
			uni.showModal({
				title: '确认退出',
				content: '确定要退出登录吗？',
				success: (res) => {
					if (res.confirm) {
						// 清除存储的登录信息
						uni.removeStorageSync(STORAGE_KEYS.TOKEN)
						uni.removeStorageSync(STORAGE_KEYS.USER_INFO)
						
						// 跳转到登录页面
						uni.redirectTo({
							url: '/pages/login/login'
						})
					}
				}
			})
		},
		
		getLevelLabel
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
	padding: 40rpx 32rpx;
	border-bottom: 1rpx solid #efefef;
}

.header-top {
	margin-bottom: 20rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.header-left {
	flex: 1;
}

.header-center {
	flex: 2;
	text-align: center;
}

.header-right {
	flex: 1;
	text-align: right;
}

.menu-btn {
	display: inline-block;
	padding: 8rpx 16rpx;
	border-radius: 6rpx;
	font-weight: 600;
	background: #f5f5f5;
}

.menu-icon {
	font-size: 32rpx;
	color: #262626;
}

.menu-popup {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 999;
	display: flex;
	align-items: center;
	justify-content: center;
}

.menu-content {
	background: #ffffff;
	border-radius: 16rpx;
	width: 80%;
	max-width: 400rpx;
	overflow: hidden;
}

.menu-item {
	padding: 32rpx;
	text-align: center;
	border-bottom: 1rpx solid #f0f0f0;
}

.menu-item:active {
	background: #f5f5f5;
}

.menu-item.danger {
	color: #dc3545;
}

.menu-text {
	font-size: 28rpx;
}

.menu-divider {
	height: 1rpx;
	background: #f0f0f0;
}

.welcome {
	font-size: 32rpx;
	font-weight: 600;
	color: #262626;
	margin-bottom: 8rpx;
}

.date {
	font-size: 24rpx;
	color: #8e8e8e;
}

.header-tips {
	background: #f5f5f5;
	border-radius: 12rpx;
	padding: 16rpx 20rpx;
	display: flex;
	align-items: center;
	gap: 10rpx;
	margin-top: 20rpx;
}

.tips-icon {
	width: 24rpx;
	height: 24rpx;
	opacity: 0.6;
}

.tips-text {
	font-size: 24rpx;
	color: #8e8e8e;
}

.empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding-top: 200rpx;
}

.empty-icon {
	width: 100rpx;
	height: 100rpx;
	margin-bottom: 24rpx;
	opacity: 0.5;
}

.empty-text {
	font-size: 28rpx;
	color: #8e8e8e;
	margin-bottom: 8rpx;
}

.empty-tip {
	font-size: 22rpx;
	color: #c7c7c7;
	margin-bottom: 32rpx;
}

.bind-btn {
	width: 280rpx;
	height: 80rpx;
	background: #0095f6;
	color: #ffffff;
	border: none;
	border-radius: 12rpx;
	font-size: 28rpx;
	font-weight: 600;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
	transition: all 0.2s ease;
}

.bind-btn:active {
	opacity: 0.8;
}

.bind-btn::after {
	border: none;
}

.btn-icon {
	width: 28rpx;
	height: 28rpx;
}

.student-list {
	padding: 16rpx;
}

.student-card {
	background: #ffffff;
	border-radius: 16rpx;
	padding: 24rpx;
	margin-bottom: 16rpx;
	border: 1rpx solid #efefef;
	transition: all 0.2s ease;
}

.student-card:active {
	background: #f9f9f9;
}

.student-info {
	display: flex;
	align-items: center;
	margin-bottom: 16rpx;
}

.avatar-placeholder {
	width: 80rpx;
	height: 80rpx;
	background: #f5f5f5;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 32rpx;
	color: #262626;
	margin-right: 16rpx;
}

.info {
	flex: 1;
}

.info .name {
	font-size: 28rpx;
	font-weight: 600;
	color: #262626;
	margin-bottom: 6rpx;
}

.info .level {
	font-size: 24rpx;
	color: #8e8e8e;
}

.card-arrow {
	font-size: 28rpx;
	color: #dbdbdb;
}

.hours-info {
	display: flex;
	justify-content: space-around;
	align-items: center;
	padding-top: 16rpx;
	border-top: 1rpx solid #efefef;
}

.hours-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	flex: 1;
}

.hours-item .label {
	font-size: 22rpx;
	color: #8e8e8e;
	margin-bottom: 6rpx;
}

.hours-item .value {
	font-size: 32rpx;
	font-weight: 600;
	color: #262626;
}

.hours-item .value.primary {
	color: #0095f6;
}

.hours-divider {
	width: 1rpx;
	height: 36rpx;
	background: #efefef;
}

.add-btn {
	width: 100%;
	height: 80rpx;
	background: #0095f6;
	color: #ffffff;
	border: none;
	border-radius: 12rpx;
	font-size: 28rpx;
	font-weight: 600;
	margin-top: 32rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
	transition: all 0.2s ease;
}

.add-btn:active {
	opacity: 0.8;
}

.add-btn::after {
	border: none;
}
</style>
