<template>
	<view class="welcome-container">
		<view class="header-bg">
			<view class="header-decoration">
				<view class="decoration-circle circle-1"></view>
				<view class="decoration-circle circle-2"></view>
				<view class="decoration-circle circle-3"></view>
			</view>
		</view>
		
		<view class="content">
			<view class="logo-section">
				<image class="logo" src="/static/images/logo-large.png" mode="aspectFit"></image>
				<view class="app-name">欣兰体育课时管理</view>
				<view class="app-slogan">专业跆拳道培训机构管理平台</view>
			</view>
			
			<view class="features-section">
				<view class="feature-item">
					<view class="feature-icon">📊</view>
					<view class="feature-text">
						<view class="feature-title">课时管理</view>
						<view class="feature-desc">实时查看剩余课时，上课记录一目了然</view>
					</view>
				</view>
				
				<view class="feature-item">
					<view class="feature-icon">📅</view>
					<view class="feature-text">
						<view class="feature-title">课程安排</view>
						<view class="feature-desc">查看课程详情，了解孩子上课内容</view>
					</view>
				</view>
				
				<view class="feature-item">
					<view class="feature-icon">📸</view>
					<view class="feature-text">
						<view class="feature-title">精彩瞬间</view>
						<view class="feature-desc">查看孩子上课照片，记录成长点滴</view>
					</view>
				</view>
				
				<view class="feature-item">
					<view class="feature-icon">📢</view>
					<view class="feature-text">
						<view class="feature-title">消息通知</view>
						<view class="feature-desc">及时接收机构通知，不错过重要信息</view>
					</view>
				</view>
			</view>
			
			<view class="action-section">
				<button class="action-btn login-btn" @click="goToLogin">
					立即登录体验
				</button>
				<view class="tips">
					<text class="tip-text">登录后可使用完整功能</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { STORAGE_KEYS } from '@/utils/common.js'

export default {
	data() {
		return {}
	},
	
	onLoad() {
		
	},
	
	methods: {
		goToLogin() {
			uni.navigateTo({
				url: '/pages/login/login'
			})
		}
	}
}
</script>

<style scoped>
.welcome-container {
	min-height: 100vh;
	background: #f7f8fa;
	position: relative;
	overflow: hidden;
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

.content {
	position: relative;
	z-index: 5;
	padding: 60rpx 32rpx 40rpx;
	padding-top: calc(80rpx + env(safe-area-inset-top));
}

.logo-section {
	text-align: center;
	margin-bottom: 60rpx;
}

.logo {
	width: 160rpx;
	height: 160rpx;
	margin-bottom: 32rpx;
}

.app-name {
	font-size: 40rpx;
	font-weight: 700;
	color: #ffffff;
	margin-bottom: 12rpx;
}

.app-slogan {
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.85);
}

.features-section {
	background: #ffffff;
	border-radius: 24rpx;
	padding: 40rpx 32rpx;
	margin-bottom: 40rpx;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.feature-item {
	display: flex;
	align-items: flex-start;
	gap: 20rpx;
	margin-bottom: 32rpx;
}

.feature-item:last-child {
	margin-bottom: 0;
}

.feature-icon {
	width: 80rpx;
	height: 80rpx;
	background: linear-gradient(135deg, #f5f7fa 0%, #f0f2f5 100%);
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 36rpx;
	flex-shrink: 0;
}

.feature-text {
	flex: 1;
}

.feature-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #262626;
	margin-bottom: 6rpx;
}

.feature-desc {
	font-size: 26rpx;
	color: #8e8e8e;
	line-height: 1.6;
}

.action-section {
	text-align: center;
}

.action-btn {
	width: 100%;
	height: 96rpx;
	border-radius: 48rpx;
	font-size: 32rpx;
	font-weight: 600;
	border: none;
	margin-bottom: 24rpx;
}

.login-btn {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: #ffffff;
	box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.3);
}

.login-btn:active {
	opacity: 0.85;
}

.login-btn::after {
	border: none;
}

.tips {
	text-align: center;
}

.tip-text {
	font-size: 24rpx;
	color: #8e8e8e;
}
</style>