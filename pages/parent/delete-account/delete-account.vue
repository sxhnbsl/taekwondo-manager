<template>
	<view class="container">
		<view class="header">
			<text class="title">注销账号</text>
			<text class="subtitle">注销后，您的账号及相关数据将被删除</text>
		</view>

		<view class="warning-box">
			<view class="warning-title">⚠️ 注销前请注意</view>
			<view class="warning-list">
				<view class="warning-item">• 注销后，您的账号将无法恢复</view>
				<view class="warning-item">• 您的所有个人信息将被永久删除</view>
				<view class="warning-item">• 您绑定的孩子信息将被解除关联</view>
				<view class="warning-item">• 您的课程记录和通知将被删除</view>
				<view class="warning-item">• 建议在注销前备份重要信息</view>
			</view>
		</view>

		<view class="checkbox-section">
			<view class="checkbox-wrapper" @click="toggleAgreement">
				<view class="checkbox" :class="{ checked: agreed }">
					<text v-if="agreed" class="check-icon">✓</text>
				</view>
				<text class="agreement-text">
					我已阅读并了解注销账号的后果，确认要注销账号
				</text>
			</view>
		</view>

		<view class="actions">
			<button class="action-btn cancel" @click="goBack">取消</button>
			<button class="action-btn delete" @click="handleDeleteAccount" :loading="loading" :disabled="!agreed">
				{{ loading ? '注销中...' : '确认注销' }}
			</button>
		</view>
	</view>
</template>

<script>
import { authAPI } from '@/utils/api.js'
import { checkPermission, USER_ROLES } from '@/utils/common.js'

export default {
	data() {
		return {
			agreed: false,
			loading: false
		}
	},
	
	onLoad() {
		// 检查权限，只有家长账号可以注销
		if (!checkPermission(USER_ROLES.PARENT)) {
			uni.navigateBack()
		}
	},

	methods: {
		toggleAgreement() {
			this.agreed = !this.agreed
		},

		async handleDeleteAccount() {
			if (!this.agreed) {
				uni.showToast({
					title: '请先阅读并同意注销说明',
					icon: 'none'
				})
				return
			}

			uni.showModal({
				title: '确认注销',
				content: '您确定要注销账号吗？此操作不可恢复！',
				confirmText: '确认注销',
				cancelText: '取消',
				success: async (res) => {
					if (res.confirm) {
						await this.deleteAccount()
					}
				}
			})
		},

		async deleteAccount() {
			this.loading = true

			try {
				await authAPI.deleteAccount()

				uni.showToast({
					title: '注销成功',
					icon: 'success'
				})

				setTimeout(() => {
					uni.clearStorageSync()
					uni.reLaunch({
						url: '/pages/login/login'
					})
				}, 1500)
			} catch (e) {
				console.error('注销失败:', e)
				uni.showToast({
					title: e.message || '注销失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},

		goBack() {
			uni.navigateBack()
		}
	}
}
</script>

<style scoped>
.container {
	min-height: 100vh;
	background: #fafafa;
	padding: 40rpx 30rpx;
}

.header {
	text-align: center;
	margin-bottom: 40rpx;
}

.title {
	display: block;
	font-size: 40rpx;
	font-weight: 600;
	color: #262626;
	margin-bottom: 16rpx;
}

.subtitle {
	display: block;
	font-size: 28rpx;
	color: #8e8e8e;
}

.warning-box {
	background: #fff3cd;
	border: 2rpx solid #ffc107;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 40rpx;
}

.warning-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #856404;
	margin-bottom: 20rpx;
}

.warning-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.warning-item {
	font-size: 28rpx;
	color: #856404;
	line-height: 1.6;
}

.checkbox-section {
	margin-bottom: 40rpx;
	padding: 0 10rpx;
}

.checkbox-wrapper {
	display: flex;
	align-items: flex-start;
	gap: 12rpx;
}

.checkbox {
	width: 32rpx;
	height: 32rpx;
	border: 2rpx solid #dbdbdb;
	border-radius: 6rpx;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-top: 4rpx;
	transition: all 0.2s ease;
}

.checkbox.checked {
	background: #dc3545;
	border-color: #dc3545;
}

.check-icon {
	color: #ffffff;
	font-size: 20rpx;
	font-weight: bold;
}

.agreement-text {
	font-size: 28rpx;
	color: #595959;
	line-height: 1.6;
	flex: 1;
}

.actions {
	display: flex;
	gap: 20rpx;
}

.action-btn {
	flex: 1;
	height: 88rpx;
	border-radius: 12rpx;
	font-size: 30rpx;
	font-weight: 600;
	border: none;
}

.action-btn::after {
	border: none;
}

.action-btn.cancel {
	background: #ffffff;
	color: #262626;
	border: 2rpx solid #dbdbdb;
}

.action-btn.delete {
	background: #dc3545;
	color: #ffffff;
}

.action-btn.delete:disabled {
	background: #cccccc;
}
</style>
