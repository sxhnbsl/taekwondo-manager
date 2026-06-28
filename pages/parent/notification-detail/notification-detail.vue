<template>
	<view class="container">
		<view class="header-bg">
			<view class="header-decoration">
				<view class="decoration-circle circle-1"></view>
				<view class="decoration-circle circle-2"></view>
			</view>
		</view>
		
		<view class="nav-bar">
			<view class="back-button" @click="goBack">
				<text class="back-icon">‹</text>
			</view>
			<text class="nav-title">通知详情</text>
			<view class="nav-right"></view>
		</view>
		
		<view class="content">
			<view class="icon-card">
				<view class="icon-wrapper" :class="notification.type">
					<text class="type-emoji">{{ getTypeEmoji(notification.type) }}</text>
				</view>
			</view>
			
			<view class="detail-card">
				<view class="card-header">
					<text class="card-title">{{ notification.title }}</text>
					<view class="card-tags">
						<view class="tag-item" :class="notification.type">
							<text class="tag-text">{{ getTypeLabel(notification.type) }}</text>
						</view>
						<view v-if="!notification.is_read" class="tag-item unread">
							<text class="tag-text">未读</text>
						</view>
					</view>
				</view>
				
				<view class="card-meta">
					<view class="meta-item">
						<text class="meta-icon">🕐</text>
						<text class="meta-text">{{ formatTime(notification.create_time) }}</text>
					</view>
				</view>
				
				<view class="card-divider"></view>
				
				<view class="card-body">
					<view class="body-label">消息内容</view>
					<view class="body-content">{{ notification.content }}</view>
				</view>
			</view>
			
			<view v-if="notification.related_id" class="action-card">
				<view class="action-header">
					<text class="action-title">📎 相关信息</text>
				</view>
				<view class="action-content" @click="goToRelatedCourse">
					<view class="action-info">
						<text class="action-label">查看相关课程详情</text>
					</view>
					<view class="action-btn">
						<text class="action-btn-text">前往查看</text>
						<text class="action-btn-arrow">›</text>
					</view>
				</view>
			</view>
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
			id: '',
			notification: {
				type: 'other',
				title: '',
				content: '',
				create_time: '',
				is_read: true,
				related_id: ''
			}
		}
	},
	
	onLoad(options) {
		if (options.id) {
			this.id = options.id
			this.loadNotification()
		}
	},
	
	onShareAppMessage() {
		const title = this.notification.title ? `欣兰体育 - ${this.notification.title}` : '欣兰体育 - 消息详情'
		return getShareConfig('/pages/parent/notification-detail/notification-detail', title)
	},
	
	onShareTimeline() {
		const title = this.notification.title ? `欣兰体育 - ${this.notification.title}` : '欣兰体育'
		return getTimelineConfig(title)
	},
	
	methods: {
		goBack() {
			uni.navigateBack()
		},
		
		async loadNotification() {
			try {
				const res = await notificationAPI.getList({
					page: 1,
					pageSize: 100
				})
				
				const notification = res.data.list.find(item => item._id === this.id)
				if (notification) {
					this.notification = notification
					
					if (!notification.is_read) {
						await notificationAPI.markRead(notification._id)
						notification.is_read = true
					}
				}
			} catch (e) {
				console.error('加载通知失败:', e)
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
			}
		},
		
		goToRelatedCourse() {
			if (this.notification.related_id) {
				uni.navigateTo({
					url: `/pages/parent/class-detail/class-detail?id=${this.notification.related_id}`
				})
			}
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
		
		getTypeLabel(type) {
			const labelMap = {
				class_reminder: '课程提醒',
				hours_reminder: '课时提醒',
				notice: '通知公告',
				media_update: '媒体更新',
				other: '其他消息'
			}
			return labelMap[type] || '系统消息'
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
				return formatDate(time, 'YYYY年MM月DD日 HH:mm')
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
	height: 400rpx;
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
	width: 240rpx;
	height: 240rpx;
	top: -100rpx;
	right: -80rpx;
}

.circle-2 {
	width: 160rpx;
	height: 160rpx;
	top: 120rpx;
	left: -60rpx;
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

.back-button {
	width: 72rpx;
	height: 72rpx;
	background: rgba(255, 255, 255, 0.2);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.back-icon {
	font-size: 48rpx;
	color: #ffffff;
	line-height: 1;
}

.nav-title {
	font-size: 34rpx;
	font-weight: 600;
	color: #ffffff;
}

.nav-right {
	width: 72rpx;
}

.content {
	position: relative;
	z-index: 5;
	padding: 32rpx;
	padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
}

.icon-card {
	display: flex;
	justify-content: center;
	margin-bottom: 32rpx;
}

.icon-wrapper {
	width: 140rpx;
	height: 140rpx;
	border-radius: 32rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.15);
}

.icon-wrapper.class_reminder {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.icon-wrapper.hours_reminder {
	background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.icon-wrapper.notice {
	background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.icon-wrapper.media_update {
	background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.icon-wrapper.other {
	background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}

.type-emoji {
	font-size: 64rpx;
}

.detail-card {
	background: #ffffff;
	border-radius: 32rpx;
	padding: 40rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.card-header {
	margin-bottom: 24rpx;
}

.card-title {
	display: block;
	font-size: 36rpx;
	font-weight: 700;
	color: #262626;
	line-height: 1.5;
	margin-bottom: 20rpx;
}

.card-tags {
	display: flex;
	gap: 12rpx;
}

.tag-item {
	padding: 8rpx 20rpx;
	border-radius: 20rpx;
}

.tag-item.class_reminder {
	background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
}

.tag-item.hours_reminder {
	background: linear-gradient(135deg, rgba(250, 112, 154, 0.1) 0%, rgba(254, 225, 64, 0.1) 100%);
}

.tag-item.notice {
	background: linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(0, 242, 254, 0.1) 100%);
}

.tag-item.media_update {
	background: linear-gradient(135deg, rgba(67, 233, 123, 0.1) 0%, rgba(56, 249, 215, 0.1) 100%);
}

.tag-item.other {
	background: linear-gradient(135deg, rgba(168, 237, 234, 0.1) 0%, rgba(254, 214, 227, 0.1) 100%);
}

.tag-item.unread {
	background: #fff1f0;
}

.tag-text {
	font-size: 22rpx;
	font-weight: 500;
}

.tag-item.class_reminder .tag-text {
	color: #667eea;
}

.tag-item.hours_reminder .tag-text {
	color: #fa709a;
}

.tag-item.notice .tag-text {
	color: #4facfe;
}

.tag-item.media_update .tag-text {
	color: #43e97b;
}

.tag-item.other .tag-text {
	color: #a8edea;
}

.tag-item.unread .tag-text {
	color: #ff4d4f;
}

.card-meta {
	display: flex;
	align-items: center;
	gap: 24rpx;
	margin-bottom: 24rpx;
}

.meta-item {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.meta-icon {
	font-size: 24rpx;
}

.meta-text {
	font-size: 24rpx;
	color: #8e8e8e;
	font-weight: 500;
}

.card-divider {
	height: 2rpx;
	background: #f0f0f0;
	margin: 32rpx 0;
}

.card-body {
	padding-top: 8rpx;
}

.body-label {
	font-size: 26rpx;
	color: #8e8e8e;
	font-weight: 500;
	margin-bottom: 16rpx;
}

.body-content {
	font-size: 30rpx;
	color: #262626;
	line-height: 1.9;
	white-space: pre-wrap;
	word-wrap: break-word;
}

.action-card {
	background: #ffffff;
	border-radius: 24rpx;
	padding: 32rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.action-header {
	margin-bottom: 20rpx;
}

.action-title {
	font-size: 28rpx;
	font-weight: 600;
	color: #262626;
}

.action-content {
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 20rpx;
	padding: 28rpx 32rpx;
	transition: all 0.2s;
}

.action-content:active {
	opacity: 0.85;
	transform: scale(0.98);
}

.action-info {
	flex: 1;
}

.action-label {
	font-size: 28rpx;
	color: #ffffff;
	font-weight: 500;
}

.action-btn {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.action-btn-text {
	font-size: 26rpx;
	color: #ffffff;
	font-weight: 600;
}

.action-btn-arrow {
	font-size: 32rpx;
	color: #ffffff;
	line-height: 1;
}
</style>
