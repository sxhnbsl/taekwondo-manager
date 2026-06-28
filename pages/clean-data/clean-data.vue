<template>
	<view class="container">
		<view class="header">
			<text class="title">数据清理</text>
			<text class="subtitle">快速清理测试数据</text>
		</view>
		
		<view class="action-section">
			<view class="section-title">
				<text class="title-text">清理操作</text>
			</view>
			
			<view class="action-list">
				<view class="action-item" @click="clearAll">
					<view class="action-icon" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);">
						<text class="icon-text">🗑️</text>
					</view>
					<view class="action-info">
						<text class="action-name">清理所有数据</text>
						<text class="action-desc">删除所有学生、家长、课程、通知</text>
					</view>
				</view>
				
				<view class="action-item" @click="clearStudents">
					<view class="action-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
						<text class="icon-text">👨‍🎓</text>
					</view>
					<view class="action-info">
						<text class="action-name">清理学生数据</text>
						<text class="action-desc">只删除所有学生</text>
					</view>
				</view>
				
				<view class="action-item" @click="clearParents">
					<view class="action-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
						<text class="icon-text">👨‍👩‍👧</text>
					</view>
					<view class="action-info">
						<text class="action-name">清理家长数据</text>
						<text class="action-desc">只删除所有家长</text>
					</view>
				</view>
				
				<view class="action-item" @click="keepOneCoach">
					<view class="action-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
						<text class="icon-text">🏃</text>
					</view>
					<view class="action-info">
						<text class="action-name">保留一个教练</text>
						<text class="action-desc">删除其他教练，只保留第一个</text>
					</view>
				</view>
				
				<view class="action-item" @click="keepOneAdmin">
					<view class="action-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
						<text class="icon-text">👔</text>
					</view>
					<view class="action-info">
						<text class="action-name">保留一个管理员</text>
						<text class="action-desc">删除其他管理员，只保留第一个</text>
					</view>
				</view>
			</view>
		</view>
		
		<view class="tips-section">
			<text class="tips-icon">⚠️</text>
			<text class="tips-text">警告：清理操作不可恢复，请谨慎操作！</text>
		</view>
	</view>
</template>

<script>
export default {
	methods: {
		async clearAll() {
			uni.showModal({
				title: '确认清理',
				content: '确定要清理所有数据吗？此操作不可恢复！',
				success: async (res) => {
					if (res.confirm) {
						try {
							uni.showLoading({
								title: '清理中...'
							})
							
							const result = await uniCloud.callFunction({
								name: 'clean-data',
								data: {
									action: 'clearAll'
								}
							})
							
							uni.hideLoading()
							
							if (result.result.code === 0) {
								uni.showToast({
									title: '清理成功',
									icon: 'success'
								})
							} else {
								uni.showToast({
									title: result.result.message || '清理失败',
									icon: 'none'
								})
							}
						} catch (e) {
							uni.hideLoading()
							console.error('清理失败:', e)
							uni.showToast({
								title: '清理失败',
								icon: 'none'
							})
						}
					}
				}
			})
		},
		
		async clearStudents() {
			uni.showModal({
				title: '确认清理',
				content: '确定要清理所有学生数据吗？',
				success: async (res) => {
					if (res.confirm) {
						try {
							uni.showLoading({
								title: '清理中...'
							})
							
							const result = await uniCloud.callFunction({
								name: 'clean-data',
								data: {
									action: 'clearStudents'
								}
							})
							
							uni.hideLoading()
							
							if (result.result.code === 0) {
								uni.showToast({
									title: result.result.message,
									icon: 'success'
								})
							} else {
								uni.showToast({
									title: result.result.message || '清理失败',
									icon: 'none'
								})
							}
						} catch (e) {
							uni.hideLoading()
							console.error('清理失败:', e)
							uni.showToast({
								title: '清理失败',
								icon: 'none'
							})
						}
					}
				}
			})
		},
		
		async clearParents() {
			uni.showModal({
				title: '确认清理',
				content: '确定要清理所有家长数据吗？',
				success: async (res) => {
					if (res.confirm) {
						try {
							uni.showLoading({
								title: '清理中...'
							})
							
							const result = await uniCloud.callFunction({
								name: 'clean-data',
								data: {
									action: 'clearParents'
								}
							})
							
							uni.hideLoading()
							
							if (result.result.code === 0) {
								uni.showToast({
									title: result.result.message,
									icon: 'success'
								})
							} else {
								uni.showToast({
									title: result.result.message || '清理失败',
									icon: 'none'
								})
							}
						} catch (e) {
							uni.hideLoading()
							console.error('清理失败:', e)
							uni.showToast({
								title: '清理失败',
								icon: 'none'
							})
						}
					}
				}
			})
		},
		
		async keepOneCoach() {
			uni.showModal({
				title: '确认清理',
				content: '确定要保留一个教练，删除其他教练吗？',
				success: async (res) => {
					if (res.confirm) {
						try {
							uni.showLoading({
								title: '清理中...'
							})
							
							const result = await uniCloud.callFunction({
								name: 'clean-data',
								data: {
									action: 'keepOneCoach'
								}
							})
							
							uni.hideLoading()
							
							if (result.result.code === 0) {
								uni.showToast({
									title: result.result.message,
									icon: 'success'
								})
							} else {
								uni.showToast({
									title: result.result.message || '清理失败',
									icon: 'none'
								})
							}
						} catch (e) {
							uni.hideLoading()
							console.error('清理失败:', e)
							uni.showToast({
								title: '清理失败',
								icon: 'none'
							})
						}
					}
				}
			})
		},
		
		async keepOneAdmin() {
			uni.showModal({
				title: '确认清理',
				content: '确定要保留一个管理员，删除其他管理员吗？',
				success: async (res) => {
					if (res.confirm) {
						try {
							uni.showLoading({
								title: '清理中...'
							})
							
							const result = await uniCloud.callFunction({
								name: 'clean-data',
								data: {
									action: 'keepOneAdmin'
								}
							})
							
							uni.hideLoading()
							
							if (result.result.code === 0) {
								uni.showToast({
									title: result.result.message,
									icon: 'success'
								})
							} else {
								uni.showToast({
									title: result.result.message || '清理失败',
									icon: 'none'
								})
							}
						} catch (e) {
							uni.hideLoading()
							console.error('清理失败:', e)
							uni.showToast({
								title: '清理失败',
								icon: 'none'
							})
						}
					}
				}
			})
		}
	}
}
</script>

<style scoped>
.container {
	min-height: 100vh;
	background: linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%);
	padding: 40rpx 32rpx;
}

.header {
	text-align: center;
	margin-bottom: 60rpx;
}

.title {
	display: block;
	font-size: 40rpx;
	font-weight: 600;
	color: #262626;
	margin-bottom: 12rpx;
}

.subtitle {
	display: block;
	font-size: 24rpx;
	color: #8e8e8e;
}

.action-section {
	margin-bottom: 24rpx;
}

.section-title {
	margin-bottom: 24rpx;
}

.title-text {
	font-size: 28rpx;
	font-weight: 600;
	color: #262626;
}

.action-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.action-item {
	background: #ffffff;
	border-radius: 16rpx;
	padding: 24rpx;
	display: flex;
	align-items: center;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
	transition: all 0.2s ease;
}

.action-item:active {
	transform: translateY(2rpx);
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

.action-icon {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 20rpx;
}

.icon-text {
	font-size: 36rpx;
}

.action-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 4rpx;
}

.action-name {
	font-size: 28rpx;
	font-weight: 600;
	color: #262626;
}

.action-desc {
	font-size: 22rpx;
	color: #8e8e8e;
}

.tips-section {
	display: flex;
	align-items: center;
	gap: 12rpx;
	background: #fff3cd;
	border-radius: 12rpx;
	padding: 20rpx 24rpx;
	margin-top: 24rpx;
}

.tips-icon {
	font-size: 28rpx;
}

.tips-text {
	flex: 1;
	font-size: 24rpx;
	color: #262626;
}
</style>