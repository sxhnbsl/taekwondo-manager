<template>
	<view class="container">
		<view class="header">
			<view class="title">用户管理</view>
			<button class="add-btn" @click="goToAdd">
				<image src="/static/images/icon-add-student.png" class="add-icon" mode="aspectFit"></image>
				<text>添加用户</text>
			</button>
		</view>
		
		<view v-if="coaches.length === 0 && !loading" class="empty">
			<image src="/static/images/icon-coach-manage.png" class="empty-icon" mode="aspectFit"></image>
			<text class="empty-text">暂无用户账号</text>
			<text class="empty-tip">点击右上角"添加用户"按钮创建</text>
		</view>
		
		<view v-else class="coach-list">
			<view 
				v-for="coach in coaches" 
				:key="coach._id" 
				class="coach-card"
			>
				<view class="coach-info">
					<view class="avatar-placeholder" :class="coach.role">{{ coach.nickname ? coach.nickname.charAt(0) : '?' }}</view>
					<view class="info">
						<view class="name">
							{{ coach.nickname || coach.username }}
							<text class="role-badge" :class="coach.role">
	{{ coach.role === 'admin' ? '管理员' : coach.role === 'coach' ? '教练' : '家长' }}
</text>
						</view>
						<view class="detail">
							<text class="username">账号: {{ coach.username }}</text>
							<text class="separator">•</text>
							<text class="status" :class="coach.status">{{ coach.status === 'active' ? '正常' : '禁用' }}</text>
						</view>
					</view>
				</view>
				<view class="actions">
					<button class="action-btn edit" @click="goToEdit(coach._id)">
						<image src="/static/images/icon-edit.png" class="btn-icon" mode="aspectFit"></image>
						<text>编辑</text>
					</button>
					<button class="action-btn reset" @click="showChangePasswordModal(coach)">
				<image src="/static/images/icon-reset.png" class="btn-icon" mode="aspectFit"></image>
				<text>修改密码</text>
			</button>
					<button class="action-btn delete" @click="confirmDelete(coach)">
						<image src="/static/images/icon-delete.png" class="btn-icon" mode="aspectFit"></image>
						<text>删除</text>
					</button>
				</view>
			</view>
		</view>
		
		<view v-if="loading" class="loading">
			<text>加载中...</text>
		</view>
		
		<!-- 修改密码弹窗 -->
		<view v-if="changePasswordModal" class="modal-overlay" @click="closeChangePasswordModal">
			<view class="popup-container" @click.stop>
				<view class="popup-header">
					<text class="popup-title">修改密码</text>
					<text class="popup-close" @click="closeChangePasswordModal">×</text>
				</view>
				<view class="popup-content">
					<view class="form-item">
						<text class="label">新密码</text>
						<input 
							v-model="newPassword" 
							type="password" 
							placeholder="请输入新密码" 
							class="input"
						/>
					</view>
					<view class="form-item">
						<text class="label">确认密码</text>
						<input 
							v-model="confirmPassword" 
							type="password" 
							placeholder="请再次输入新密码" 
							class="input"
						/>
					</view>
				</view>
				<view class="popup-footer">
					<button class="btn cancel" @click="closeChangePasswordModal">取消</button>
					<button class="btn confirm" @click="confirmChangePassword">确定</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { coachAPI } from '@/utils/api.js'
import { getShareConfig, getTimelineConfig } from '@/utils/share.js'

export default {
	data() {
		return {
			coaches: [],
			loading: false,
			userInfo: null,
			changePasswordModal: false,
			currentCoach: null,
			newPassword: '',
			confirmPassword: ''
		}
	},
	
	computed: {
		isAdmin() {
			return this.userInfo && this.userInfo.role === 'admin'
		}
	},
	
	onLoad() {
		this.userInfo = uni.getStorageSync('userInfo')
		
		// 检查是否为管理员
		if (!this.isAdmin) {
			uni.showToast({
				title: '权限不足',
				icon: 'none'
			})
			setTimeout(() => {
				uni.navigateBack()
			}, 1500)
			return
		}
		
		this.loadCoaches()
	},
	
	onShareAppMessage() {
		return getShareConfig('/pages/coach/coach-manage/coach-manage', '欣兰体育 - 教练管理')
	},
	
	onShareTimeline() {
		return getTimelineConfig('欣兰体育')
	},
	
	onShow() {
		this.loadCoaches()
	},
	
	methods: {
		async loadCoaches() {
			this.loading = true
			
			try {
				const res = await coachAPI.getList()
				
				if (res.code === 0) {
					this.coaches = res.data.list
				}
			} catch (e) {
				console.error('加载教练列表失败:', e)
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},
		
		goToAdd() {
			uni.navigateTo({
				url: '/pages/coach/coach-edit/coach-edit'
			})
		},
		
		goToEdit(id) {
			uni.navigateTo({
				url: `/pages/coach/coach-edit/coach-edit?id=${id}`
			})
		},
		
		showChangePasswordModal(coach) {
			this.currentCoach = coach
			this.newPassword = ''
			this.confirmPassword = ''
			this.changePasswordModal = true
		},
		
		closeChangePasswordModal() {
			this.changePasswordModal = false
			this.currentCoach = null
			this.newPassword = ''
			this.confirmPassword = ''
		},
		
		async confirmChangePassword() {
			if (!this.newPassword) {
				uni.showToast({
					title: '新密码不能为空',
					icon: 'none'
				})
				return
			}
			
			if (this.newPassword !== this.confirmPassword) {
				uni.showToast({
					title: '两次输入的密码不一致',
					icon: 'none'
				})
				return
			}
			
			uni.showLoading({ title: '修改中...' })
			
			try {
				const res = await coachAPI.resetPassword(this.currentCoach._id, this.newPassword)
				
				if (res.code === 0) {
					uni.showToast({
						title: '密码修改成功',
						icon: 'success'
					})
					this.closeChangePasswordModal()
				}
			} catch (e) {
				console.error('修改密码失败:', e)
				uni.showToast({
					title: '修改失败',
					icon: 'none'
				})
			} finally {
				uni.hideLoading()
			}
		},
		
		confirmDelete(coach) {
			uni.showModal({
				title: '确认删除',
				content: `确定要删除教练 "${coach.nickname || coach.username}" 吗？\n删除后该教练将无法登录系统`,
				success: async (res) => {
					if (res.confirm) {
						await this.deleteCoach(coach._id)
					}
				}
			})
		},
		
		async deleteCoach(id) {
			uni.showLoading({ title: '删除中...' })
			
			try {
				const res = await coachAPI.delete(id)
				
				if (res.code === 0) {
					uni.showToast({
						title: '删除成功',
						icon: 'success'
					})
					this.loadCoaches()
				}
			} catch (e) {
				console.error('删除教练失败:', e)
				uni.showToast({
					title: '删除失败',
					icon: 'none'
				})
			} finally {
				uni.hideLoading()
			}
		}
	}
}
</script>

<style scoped>
.container {
	min-height: 100vh;
	background-color: #f5f7fa;
	padding: 20rpx;
}

.header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 30rpx;
	padding: 0 10rpx;
}

.title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
}

.add-btn {
	display: flex;
	align-items: center;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: #fff;
	padding: 16rpx 30rpx;
	border-radius: 30rpx;
	font-size: 28rpx;
	border: none;
}

.add-btn::after {
	border: none;
}

.add-icon {
	margin-right: 8rpx;
	width: 28rpx;
	height: 28rpx;
}

.empty {
	text-align: center;
	padding: 100rpx 40rpx;
}

.empty-icon {
	width: 120rpx;
	height: 120rpx;
	margin-bottom: 30rpx;
}

.empty-text {
	font-size: 32rpx;
	color: #666;
	display: block;
	margin-bottom: 20rpx;
}

.empty-tip {
	font-size: 26rpx;
	color: #999;
}

.coach-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.coach-card {
	background: #fff;
	border-radius: 16rpx;
	padding: 30rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.coach-info {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
}

.avatar-placeholder {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	color: #fff;
	font-size: 36rpx;
	font-weight: bold;
	margin-right: 20rpx;
}

.avatar-placeholder.admin {
	background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.avatar-placeholder.coach {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.info {
	flex: 1;
}

.name {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 8rpx;
	display: flex;
	align-items: center;
	gap: 10rpx;
}

.role-badge {
	padding: 4rpx 12rpx;
	border-radius: 8rpx;
	font-size: 22rpx;
	font-weight: normal;
}

.role-badge.admin {
	background: #fce4ec;
	color: #e91e63;
}

.role-badge.coach {
	background: #e8eaf6;
	color: #3f51b5;
}

.detail {
	display: flex;
	align-items: center;
	font-size: 26rpx;
	color: #666;
}

.username {
	color: #999;
}

.separator {
	margin: 0 10rpx;
	color: #ccc;
}

.status {
	padding: 4rpx 12rpx;
	border-radius: 8rpx;
	font-size: 24rpx;
}

.status.active {
	background: #e8f5e9;
	color: #4caf50;
}

.status.inactive {
	background: #ffebee;
	color: #f44336;
}

.actions {
	display: flex;
	gap: 16rpx;
	border-top: 1rpx solid #f0f0f0;
	padding-top: 20rpx;
}

.action-btn {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 16rpx 0;
	border-radius: 8rpx;
	font-size: 26rpx;
	border: none;
}

.action-btn::after {
	border: none;
}

.action-btn.edit {
	background: #e3f2fd;
	color: #2196f3;
}

.action-btn.reset {
	background: #fff3e0;
	color: #ff9800;
}

.action-btn.delete {
	background: #ffebee;
	color: #f44336;
}

.btn-icon {
	margin-right: 8rpx;
	width: 28rpx;
	height: 28rpx;
}

.loading {
		text-align: center;
		padding: 40rpx;
		color: #999;
		font-size: 28rpx;
	}
	
	/* 修改密码弹窗样式 */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 999;
	}
	
	.popup-container {
		background: #fff;
		border-radius: 16rpx;
		width: 90%;
		max-width: 400rpx;
		padding: 0 20rpx;
	}
	
	.input {
		width: 100%;
		height: 80rpx;
		border: 1rpx solid #e0e0e0;
		border-radius: 8rpx;
		padding: 0 20rpx;
		font-size: 28rpx;
		box-sizing: border-box;
	}
	
	.popup-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}
	
	.popup-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}
	
	.popup-close {
		font-size: 40rpx;
		color: #999;
		cursor: pointer;
	}
	
	.popup-content {
		padding: 30rpx;
	}
	
	.form-item {
		margin-bottom: 30rpx;
	}
	
	.label {
		display: block;
		font-size: 28rpx;
		color: #333;
		margin-bottom: 10rpx;
	}
	
	.input {
		width: 100%;
		height: 80rpx;
		border: 1rpx solid #e0e0e0;
		border-radius: 8rpx;
		padding: 0 20rpx;
		font-size: 28rpx;
	}
	
	.popup-footer {
		display: flex;
		border-top: 1rpx solid #f0f0f0;
	}
	
	.btn {
		flex: 1;
		padding: 20rpx 0;
		border: none;
		font-size: 28rpx;
	}
	
	.btn::after {
		border: none;
	}
	
	.btn.cancel {
		background: #f5f5f5;
		color: #666;
	}
	
	.btn.confirm {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
	}
</style>
