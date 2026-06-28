<template>
	<view class="container">
		<view class="header">
			<view class="header-top">
				<text class="header-title">消息管理</text>
				<text class="header-subtitle">查看和管理已发送的消息</text>
			</view>
		</view>
		
		<view v-if="notifications.length === 0" class="empty">
			<image src="/static/images/icon-empty-notification.png" class="empty-icon" mode="aspectFit"></image>
			<text class="empty-text">暂无消息</text>
			<text class="empty-tip">发送的消息会显示在这里</text>
		</view>
		
		<view v-else class="notification-list">
			<view 
				v-for="notification in notifications" 
				:key="notification._id" 
				class="notification-item"
				@click="goToDetail(notification._id)"
			>
				<view class="notification-icon" :class="notification.type">
					<image :src="getTypeIcon(notification.type)" class="icon" mode="aspectFit"></image>
				</view>
				<view class="notification-content">
					<view class="notification-title">{{ notification.title }}</view>
					<view class="notification-desc">{{ notification.content }}</view>
					<view class="notification-meta">
						<text class="notification-time">{{ formatTime(notification.create_time) }}</text>
						<text class="notification-receiver">接收人: {{ getReceiverName(notification.user_id) }}</text>
					</view>
				</view>
				<view class="notification-actions" @click.stop>
					<view class="action-btn edit" @click="editNotification(notification)">
						<text>编辑</text>
					</view>
					<view class="action-btn delete" @click="deleteNotification(notification._id)">
						<text>删除</text>
					</view>
				</view>
			</view>
		</view>
		
		<view v-if="hasMore" class="load-more" @click="loadMore">
			<text>加载更多</text>
		</view>
		
		<view class="fab" @click="goToSend">
			<text class="fab-icon">+</text>
		</view>
		
		<view v-if="showEditModal" class="modal-mask" @click="showEditModal = false">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">编辑消息</text>
					<view class="modal-close" @click="showEditModal = false">×</view>
				</view>
				<view class="modal-body">
					<view class="form-item">
						<view class="input-label">
							<text class="label-text">消息类型</text>
						</view>
						<view class="type-grid">
							<view 
								v-for="type in messageTypes" 
								:key="type.value"
								class="type-item"
								:class="{ active: editForm.type === type.value }"
								@click="editForm.type = type.value"
							>
								<text class="type-icon">{{ type.icon }}</text>
								<text class="type-label">{{ type.label }}</text>
							</view>
						</view>
					</view>
					
					<view class="form-item">
						<view class="input-label">
							<text class="label-text">消息标题</text>
						</view>
						<view class="input-box">
							<input 
								class="input-field" 
								v-model="editForm.title" 
								placeholder="请输入消息标题"
								placeholder-class="placeholder-text"
								maxlength="50"
							/>
							<text class="char-count">{{ editForm.title.length }}/50</text>
						</view>
					</view>
					
					<view class="form-item">
						<view class="input-label">
							<text class="label-text">消息内容</text>
						</view>
						<view class="textarea-box">
							<textarea 
								class="textarea-field" 
								v-model="editForm.content" 
								placeholder="请输入消息内容"
								placeholder-class="placeholder-text"
								maxlength="500"
								:auto-height="true"
							/>
							<text class="char-count">{{ editForm.content.length }}/500</text>
						</view>
					</view>
				</view>
				<view class="modal-footer">
					<button class="modal-btn cancel" @click="showEditModal = false">取消</button>
					<button class="modal-btn confirm" @click="confirmEdit" :loading="loading">保存</button>
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
			notifications: [],
			page: 1,
			pageSize: 20,
			total: 0,
			loading: false,
			hasMore: false,
			showEditModal: false,
			editForm: {
				id: '',
				type: 'class_reminder',
				title: '',
				content: ''
			},
			messageTypes: [
				{ value: 'class_reminder', label: '课程提醒', icon: '📚' },
				{ value: 'hours_warning', label: '课时提醒', icon: '⏰' },
				{ value: 'notice', label: '通知公告', icon: '📢' },
				{ value: 'other', label: '其他消息', icon: '💬' }
			]
		}
	},
	
	onLoad(options) {
		if (options.editId) {
			this.loadNotifications().then(() => {
				const notification = this.notifications.find(item => item._id === options.editId)
				if (notification) {
					this.editForm = {
						id: notification._id,
						type: notification.type,
						title: notification.title,
						content: notification.content
					}
					this.showEditModal = true
				}
			})
		} else {
			this.loadNotifications()
		}
	},
	
	onShareAppMessage() {
		return getShareConfig('/pages/coach/notification-list/notification-list', '欣兰体育 - 消息管理')
	},
	
	onShareTimeline() {
		return getTimelineConfig('欣兰体育')
	},
	
	onShow() {
		this.page = 1
		this.loadNotifications()
	},
	
	onPullDownRefresh() {
		this.page = 1
		this.loadNotifications()
	},
	
	methods: {
		async loadNotifications() {
			this.loading = true
			
			try {
				const res = await notificationAPI.getSentList({
					page: this.page,
					pageSize: this.pageSize
				})
				
				if (this.page === 1) {
					this.notifications = res.data.list
				} else {
					this.notifications = [...this.notifications, ...res.data.list]
				}
				
				this.total = res.data.total
				this.hasMore = this.notifications.length < this.total
			} catch (e) {
				console.error('加载通知失败:', e)
			} finally {
				this.loading = false
				uni.stopPullDownRefresh()
			}
		},
		
		loadMore() {
			if (!this.loading && this.hasMore) {
				this.page++
				this.loadNotifications()
			}
		},
		
		editNotification(notification) {
			this.editForm = {
				id: notification._id,
				type: notification.type,
				title: notification.title,
				content: notification.content
			}
			this.showEditModal = true
		},
		
		async confirmEdit() {
			if (!this.editForm.title) {
				uni.showToast({
					title: '请输入消息标题',
					icon: 'none'
				})
				return
			}
			
			if (!this.editForm.content) {
				uni.showToast({
					title: '请输入消息内容',
					icon: 'none'
				})
				return
			}
			
			this.loading = true
			
			try {
				await notificationAPI.update(
					this.editForm.id,
					this.editForm.title,
					this.editForm.content,
					this.editForm.type
				)
				
				uni.showToast({
					title: '更新成功',
					icon: 'success'
				})
				
				this.showEditModal = false
				
				this.page = 1
				await this.loadNotifications()
			} catch (e) {
				console.error('更新失败:', e)
				uni.showToast({
					title: e.message || '更新失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},
		
		async deleteNotification(id) {
			uni.showModal({
				title: '确认删除',
				content: '确定要删除这条消息吗？',
				success: async (res) => {
					if (res.confirm) {
						try {
							await notificationAPI.delete(id)
							
							uni.showToast({
								title: '删除成功',
								icon: 'success'
							})
							
							this.page = 1
							await this.loadNotifications()
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
		
		goToSend() {
			uni.navigateTo({
				url: '/pages/coach/notification-send/notification-send'
			})
		},
		
		goToDetail(id) {
			uni.navigateTo({
				url: `/pages/coach/notification-detail/notification-detail?id=${id}`
			})
		},
		
		getTypeIcon(type) {
			const iconMap = {
				class_reminder: '/static/images/icon-course.png',
				hours_warning: '/static/images/icon-hours.png',
				notice: '/static/images/icon-message.png',
				other: '/static/images/icon-back.png'
			}
			return iconMap[type] || '/static/images/icon-back.png'
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
	padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

.header {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	padding: 40rpx;
	padding-top: calc(40rpx + env(safe-area-inset-top));
	padding-bottom: 60rpx;
	color: #ffffff;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
}

.header-top {
	margin-bottom: 30rpx;
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
	opacity: 0.5;
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

.notification-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
	padding: 20rpx;
	margin-top: -40rpx;
}

.notification-item {
	border-radius: 20rpx;
	padding: 30rpx;
	display: flex;
	align-items: flex-start;
	gap: 20rpx;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
	position: relative;
}

.notification-icon {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.notification-icon .icon {
	width: 40rpx;
	height: 40rpx;
}

.notification-content {
	flex: 1;
}

.notification-title {
	font-size: 30rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 12rpx;
	line-height: 1.4;
}

.notification-desc {
	font-size: 26rpx;
	color: #666;
	line-height: 1.6;
	margin-bottom: 12rpx;
	opacity: 0.85;
}

.notification-meta {
	display: flex;
	flex-direction: column;
	gap: 4rpx;
}

.notification-time {
	font-size: 24rpx;
	color: #999;
	font-weight: 500;
}

.notification-receiver {
	font-size: 24rpx;
	color: #8e8e8e;
}

.notification-actions {
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.action-btn {
	padding: 8rpx 20rpx;
	border-radius: 8rpx;
	font-size: 24rpx;
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

.fab {
	position: fixed;
	bottom: 80rpx;
	right: 40rpx;
	width: 120rpx;
	height: 120rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.4);
	z-index: 100;
}

.fab:active {
	transform: scale(0.95);
}

.fab-icon {
	font-size: 60rpx;
	color: #ffffff;
	font-weight: 300;
}

.modal-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
}

.modal-content {
	width: 640rpx;
	background: #ffffff;
	border-radius: 24rpx;
	max-height: 80vh;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 32rpx;
	border-bottom: 1rpx solid #efefef;
}

.modal-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #262626;
}

.modal-close {
	font-size: 48rpx;
	color: #8e8e8e;
	line-height: 1;
	padding: 0 8rpx;
}

.modal-body {
	flex: 1;
	overflow-y: auto;
	padding: 32rpx;
}

.form-item {
	margin-bottom: 32rpx;
}

.input-label {
	display: flex;
	align-items: center;
	margin-bottom: 12rpx;
}

.label-text {
	font-size: 26rpx;
	color: #262626;
	font-weight: 500;
}

.type-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 16rpx;
}

.type-item {
	background: #ffffff;
	border: 1rpx solid #e0e0e0;
	border-radius: 12rpx;
	padding: 24rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12rpx;
	transition: all 0.2s ease;
}

.type-item.active {
	border-color: #667eea;
	background: #f5f7ff;
}

.type-icon {
	font-size: 40rpx;
}

.type-label {
	font-size: 24rpx;
	color: #262626;
}

.input-box,
.textarea-box {
	position: relative;
	background: #ffffff;
	border: 1rpx solid #e0e0e0;
	border-radius: 12rpx;
	padding: 24rpx;
	transition: all 0.2s ease;
}

.input-box:focus-within,
.textarea-box:focus-within {
	border-color: #667eea;
}

.input-field {
	width: 100%;
	font-size: 28rpx;
	color: #262626;
}

.textarea-field {
	width: 100%;
	font-size: 28rpx;
	color: #262626;
	min-height: 200rpx;
}

.placeholder-text {
	color: #8e8e8e;
}

.char-count {
	position: absolute;
	right: 24rpx;
	bottom: 24rpx;
	font-size: 22rpx;
	color: #8e8e8e;
}

.modal-footer {
	display: flex;
	gap: 16rpx;
	padding: 24rpx 32rpx;
	border-top: 1rpx solid #efefef;
}

.modal-btn {
	flex: 1;
	height: 80rpx;
	border-radius: 12rpx;
	font-size: 28rpx;
	font-weight: 600;
	border: none;
}

.modal-btn.cancel {
	background: #f5f5f5;
	color: #262626;
}

.modal-btn.confirm {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: #ffffff;
}

.modal-btn::after {
	border: none;
}
</style>
