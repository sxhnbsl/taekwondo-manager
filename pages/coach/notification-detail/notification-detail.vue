<template>
	<view class="container">
		<view class="header">
			<view class="header-top">
				<view class="back-btn" @click="goBack">
					<text class="back-arrow">←</text>
					<text class="back-text">返回</text>
				</view>
			</view>
		</view>
		
		<view class="content">
			<view class="notification-icon-wrapper">
				<view class="notification-icon" :class="notification.type">
					<image :src="getTypeIcon(notification.type)" class="icon" mode="aspectFit"></image>
				</view>
			</view>
			
			<view class="notification-header">
				<view class="notification-title">{{ notification.title }}</view>
				<view class="notification-meta">
					<text class="notification-type">{{ getTypeLabel(notification.type) }}</text>
					<text class="notification-time">{{ formatTime(notification.create_time) }}</text>
				</view>
			</view>
			
			<view class="notification-body">
				<view class="body-label">消息内容</view>
				<view class="body-content">{{ notification.content }}</view>
			</view>
			
			<view class="notification-footer">
				<view class="receiver-info">
					<text class="receiver-label">接收人</text>
					<text class="receiver-name">{{ getReceiverName(notification.user_id) }}</text>
				</view>
				<view class="action-buttons">
					<view class="action-btn edit" @click="editNotification">
						<text>编辑消息</text>
					</view>
					<view class="action-btn delete" @click="deleteNotification">
						<text>删除消息</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { notificationAPI } from '@/utils/api.js'
import { formatDate } from '@/utils/common.js'

export default {
	data() {
		return {
			id: '',
			notification: {}
		}
	},
	
	onLoad(options) {
		if (options.id) {
			this.id = options.id
			this.loadNotification()
		}
	},
	
	methods: {
		goBack() {
			uni.navigateBack()
		},
		
		async loadNotification() {
			try {
				const res = await notificationAPI.getSentList({
					page: 1,
					pageSize: 100
				})
				
				const notification = res.data.list.find(item => item._id === this.id)
				if (notification) {
					this.notification = notification
				}
			} catch (e) {
				console.error('加载通知失败:', e)
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
			}
		},
		
		editNotification() {
			uni.navigateTo({
				url: `/pages/coach/notification-list/notification-list?editId=${this.id}`
			})
		},
		
		deleteNotification() {
			uni.showModal({
				title: '确认删除',
				content: '确定要删除这条消息吗？',
				success: async (res) => {
					if (res.confirm) {
						try {
							await notificationAPI.delete(this.id)
							
							uni.showToast({
								title: '删除成功',
								icon: 'success'
							})
							
							setTimeout(() => {
								uni.navigateBack()
							}, 1500)
						} catch (e) {
							console.error('删除失败:', e)
							uni.showToast({
								title: e.message || '删除失败',
								icon: 'none'
							})
						}
					}
				}
			})
		},
		
		getTypeIcon(type) {
			const iconMap = {
				class_reminder: '/static/images/icon-course.png',
				hours_reminder: '/static/images/icon-hours.png',
				notice: '/static/images/icon-message.png',
				other: '/static/images/icon-back.png'
			}
			return iconMap[type] || '/static/images/icon-back.png'
		},
		
		getTypeLabel(type) {
			const labelMap = {
				class_reminder: '课程提醒',
				hours_reminder: '课时提醒',
				notice: '通知公告',
				other: '其他消息'
			}
			return labelMap[type] || '未知类型'
		},
		
		getReceiverName(userId) {
			const nameMap = {
				'parent-1': '张大明',
				'parent-2': '李华',
				'parent-3': '王芳'
			}
			return nameMap[userId] || userId
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
			} else {
				return formatDate(time, 'YYYY-MM-DD HH:mm')
			}
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
	padding: 40rpx 32rpx 60rpx;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
}

.header-top {
	display: flex;
	align-items: center;
}

.back-btn {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 12rpx 16rpx;
	background: rgba(255, 255, 255, 0.9);
	border-radius: 24rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.back-arrow {
	font-size: 32rpx;
	color: #262626;
}

.back-text {
	font-size: 26rpx;
	color: #262626;
}

.content {
	padding: 0 32rpx 40rpx;
	margin-top: -40rpx;
}

.notification-icon-wrapper {
	display: flex;
	justify-content: center;
	margin-bottom: 32rpx;
}

.notification-icon {
	width: 120rpx;
	height: 120rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.notification-icon .icon {
	width: 60rpx;
	height: 60rpx;
}

.notification-header {
	border-radius: 20rpx;
	padding: 32rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.notification-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
	line-height: 1.5;
	margin-bottom: 20rpx;
}

.notification-meta {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.notification-type {
	padding: 6rpx 16rpx;
	background: #f0f0f0;
	color: #666;
	border-radius: 20rpx;
	font-size: 22rpx;
	font-weight: 500;
}

.notification-time {
	font-size: 24rpx;
	color: #999;
	font-weight: 500;
}

.notification-body {
	border-radius: 20rpx;
	padding: 32rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.body-label {
	font-size: 26rpx;
	color: #666;
	font-weight: 500;
	margin-bottom: 16rpx;
}

.body-content {
	font-size: 28rpx;
	color: #333;
	line-height: 1.8;
	white-space: pre-wrap;
	word-wrap: break-word;
}

.notification-footer {
	border-radius: 20rpx;
	padding: 32rpx;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.receiver-info {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	margin-bottom: 24rpx;
	padding-bottom: 24rpx;
	border-bottom: 1rpx solid #efefef;
}

.receiver-label {
	font-size: 24rpx;
	color: #999;
	font-weight: 500;
}

.receiver-name {
	font-size: 28rpx;
	color: #333;
	font-weight: 600;
}

.action-buttons {
	display: flex;
	gap: 16rpx;
}

.action-btn {
	flex: 1;
	padding: 24rpx;
	border-radius: 12rpx;
	font-size: 28rpx;
	font-weight: 600;
	text-align: center;
	transition: all 0.2s;
}

.action-btn.edit {
	background: #e6f7ff;
	color: #0095f6;
}

.action-btn.edit:active {
	background: #bae7ff;
}

.action-btn.delete {
	background: #fff1f0;
	color: #ff4d4f;
}

.action-btn.delete:active {
	background: #ffccc7;
}
</style>