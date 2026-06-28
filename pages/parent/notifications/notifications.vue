<template>
	<view class="container">
		<view class="header-bg">
			<view class="header-decoration">
				<view class="decoration-circle circle-1"></view>
				<view class="decoration-circle circle-2"></view>
				<view class="decoration-circle circle-3"></view>
			</view>
		</view>
		
		<view class="nav-bar">
			<view class="nav-left">
				<text class="nav-title">消息通知</text>
			</view>
			<view class="nav-right">
				<text class="nav-subtitle">及时了解孩子动态</text>
			</view>
		</view>
		
		<view class="tab-container">
			<view class="tab-item" 
				:class="{ active: activeTab === 'all' }"
				@click="switchTab('all')"
			>
				<text class="tab-text">全部</text>
				<text v-if="activeTab === 'all' && unreadCount > 0" class="tab-count">{{ unreadCount }}</text>
			</view>
			<view 
				class="tab-item" 
				:class="{ active: activeTab === 'unread' }"
				@click="switchTab('unread')"
			>
				<text class="tab-text">未读</text>
				<text v-if="activeTab === 'unread' && unreadCount > 0" class="tab-count">{{ unreadCount }}</text>
			</view>
		</view>
		
		<view v-if="notifications.length === 0 && !loading" class="empty-state">
			<view class="empty-icon">
				<text class="empty-emoji">📭</text>
			</view>
			<text class="empty-text">暂无通知</text>
			<text class="empty-tip">有新消息时会第一时间通知您</text>
		</view>
		
		<view v-else class="notification-list">
			<view 
				v-for="notification in notifications" 
				:key="notification._id" 
				class="notification-card"
				:class="{ unread: !notification.is_read }"
				@click="handleNotification(notification)"
			>
				<view class="card-left">
					<view class="icon-box" :class="notification.type">
						<text class="type-emoji">{{ getTypeEmoji(notification.type) }}</text>
					</view>
				</view>
				<view class="card-center">
					<view class="card-title">
						<text class="title-text">{{ notification.title }}</text>
						<view v-if="!notification.is_read" class="unread-badge"></view>
					</view>
					<text class="card-content">{{ notification.content }}</text>
					<view class="card-footer">
						<text class="card-time">{{ formatTime(notification.create_time) }}</text>
					</view>
				</view>
				<view class="card-right">
					<text class="arrow-icon">›</text>
				</view>
			</view>
		</view>
		
		<view v-if="hasMore && notifications.length > 0" class="load-more" @click="loadMore">
			<text v-if="!loading" class="load-text">加载更多</text>
			<text v-else class="load-text">加载中...</text>
		</view>
	</view>
</template>

<script>
import { notificationAPI } from '@/utils/api.js'
import { formatDate } from '@/utils/common.js'
import { getShareConfig, getTimelineConfig } from '@/utils/share.js'

export default {
	data() {
		return {
			notifications: [],
			activeTab: 'all',
			page: 1,
			pageSize: 20,
			totalCount: 0,
			unreadCount: 0,
			loading: false,
			hasMore: false
		}
	},
	
	onLoad() {
		this.loadNotifications()
	},
	
	onShow() {
		if (this.page === 1) {
			this.loadNotifications()
		}
	},
	
	onPullDownRefresh() {
		this.page = 1
		this.loadNotifications()
	},
	
	onShareAppMessage() {
		return getShareConfig('/pages/parent/notifications/notifications', '欣兰体育 - 消息通知')
	},
	
	onShareTimeline() {
		return getTimelineConfig('欣兰体育')
	},
	
	methods: {
		async loadNotifications() {
			this.loading = true
			
			try {
				const res = await notificationAPI.getList({
					page: this.page,
					pageSize: this.pageSize
				})
				
				let list = res.data.list || []
				this.unreadCount = res.data.unread_count || 0
				this.totalCount = res.data.total || 0
				
				if (this.activeTab === 'unread') {
					list = list.filter(item => !item.is_read)
				}
				
				if (this.page === 1) {
					this.notifications = list
				} else {
					this.notifications = [...this.notifications, ...list]
				}
				
				const displayTotal = this.activeTab === 'unread' ? this.unreadCount : this.totalCount
				this.hasMore = this.notifications.length < displayTotal
			} catch (e) {
				console.error('加载通知失败:', e)
			} finally {
				this.loading = false
				uni.stopPullDownRefresh()
			}
		},
		
		switchTab(tab) {
			this.activeTab = tab
			this.page = 1
			this.loadNotifications()
		},
		
		loadMore() {
			if (!this.loading && this.hasMore) {
				this.page++
				this.loadNotifications()
			}
		},
		
		async handleNotification(notification) {
			if (!notification.is_read) {
				try {
					await notificationAPI.markRead(notification._id)
					notification.is_read = true
					if (this.unreadCount > 0) {
						this.unreadCount--
					}
				} catch (e) {
					console.error('标记已读失败:', e)
				}
			}
			
			uni.navigateTo({
				url: `/pages/parent/notification-detail/notification-detail?id=${notification._id}`
			})
		},
		
		getTypeEmoji(type) {
			const emojiMap = {
				class_reminder: '📅',
				hours_reminder: '⏱️',
				notice: '📢',
				media_update: '📸',
				other: '💬'
			}
			return emojiMap[type] || '📬'
		},
		
		formatTime(time) {
			const now = new Date()
			const date = new Date(time)
			const diff = now - date
			
			if (diff < 60000) {
				return '刚刚'
			} else if (diff < 3600000) {
				return `${Math.floor(diff / 60000)}分钟前`
			} else if (diff < 86400000) {
				return `${Math.floor(diff / 3600000)}小时前`
			} else if (diff < 172800000) {
				return '昨天 ' + formatDate(time, 'HH:mm')
			} else {
				return formatDate(time, 'MM-DD HH:mm')
			}
		}
	}
}
</script>

<style scoped>
.container {
	min-height: 100vh;
	background: #f7f8fa;
	position: relative;
}

.header-bg {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 280rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	overflow: hidden;
}

.header-decoration {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
}

.decoration-circle {
	position: absolute;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.1);
}

.circle-1 {
	width: 200rpx;
	height: 200rpx;
	top: -80rpx;
	right: -60rpx;
}

.circle-2 {
	width: 120rpx;
	height: 120rpx;
	top: 60rpx;
	right: 120rpx;
}

.circle-3 {
	width: 80rpx;
	height: 80rpx;
	top: 160rpx;
	left: 40rpx;
}

.nav-bar {
	position: relative;
	z-index: 10;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 32rpx;
	padding-top: calc(32rpx + env(safe-area-inset-top));
}

.nav-left {
	flex: 1;
}

.nav-title {
	font-size: 40rpx;
	font-weight: 700;
	color: #ffffff;
}

.nav-right {
	flex-shrink: 0;
}

.nav-subtitle {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.8);
}

.tab-container {
	position: relative;
	z-index: 10;
	display: flex;
	gap: 12rpx;
	padding: 0 32rpx 24rpx;
}

.tab-item {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
	padding: 18rpx 0;
	background: rgba(255, 255, 255, 0.15);
	border-radius: 16rpx;
	transition: all 0.3s;
}

.tab-item.active {
	background: #ffffff;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
}

.tab-text {
	font-size: 28rpx;
	color: rgba(255, 255, 255, 0.9);
	font-weight: 500;
}

.tab-item.active .tab-text {
	color: #667eea;
	font-weight: 600;
}

.tab-count {
	min-width: 32rpx;
	height: 32rpx;
	background: #ff6b6b;
	border-radius: 16rpx;
	font-size: 20rpx;
	color: #ffffff;
	font-weight: 600;
	text-align: center;
	line-height: 32rpx;
	padding: 0 8rpx;
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 160rpx 32rpx;
}

.empty-icon {
	width: 160rpx;
	height: 160rpx;
	background: #ffffff;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 32rpx;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.empty-emoji {
	font-size: 72rpx;
}

.empty-text {
	font-size: 32rpx;
	color: #262626;
	font-weight: 600;
	margin-bottom: 12rpx;
}

.empty-tip {
	font-size: 26rpx;
	color: #8e8e8e;
	text-align: center;
}

.notification-list {
	padding: 20rpx;
	margin-top: 20rpx;
}

.notification-card {
	display: flex;
	align-items: flex-start;
	gap: 20rpx;
	background: #ffffff;
	border-radius: 24rpx;
	padding: 28rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	transition: all 0.2s;
	position: relative;
	overflow: hidden;
}

.notification-card:active {
	transform: scale(0.98);
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

.notification-card.unread::before {
	content: '';
	position: absolute;
	left: 0;
	top: 0;
	bottom: 0;
	width: 6rpx;
	background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
}

.card-left {
	flex-shrink: 0;
}

.icon-box {
	width: 88rpx;
	height: 88rpx;
	border-radius: 20rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.icon-box.class_reminder {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.icon-box.hours_reminder {
	background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.icon-box.notice {
	background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.icon-box.media_update {
	background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.icon-box.other {
	background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}

.type-emoji {
	font-size: 40rpx;
}

.card-center {
	flex: 1;
	min-width: 0;
}

.card-title {
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-bottom: 10rpx;
}

.title-text {
	font-size: 30rpx;
	font-weight: 600;
	color: #262626;
	line-height: 1.4;
}

.unread-badge {
	width: 12rpx;
	height: 12rpx;
	background: #ff6b6b;
	border-radius: 50%;
	animation: pulse 2s infinite;
}

@keyframes pulse {
	0%, 100% {
		transform: scale(1);
		opacity: 1;
	}
	50% {
		transform: scale(1.3);
		opacity: 0.6;
	}
}

.card-content {
	font-size: 26rpx;
	color: #595959;
	line-height: 1.6;
	margin-bottom: 12rpx;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
	overflow: hidden;
}

.card-footer {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.card-time {
	font-size: 24rpx;
	color: #bfbfbf;
	font-weight: 500;
}

.card-right {
	flex-shrink: 0;
	align-self: center;
}

.arrow-icon {
	font-size: 40rpx;
	color: #d9d9d9;
	line-height: 1;
}

.load-more {
	text-align: center;
	padding: 40rpx 0;
}

.load-text {
	font-size: 28rpx;
	color: #8e8e8e;
	font-weight: 500;
}
</style>
