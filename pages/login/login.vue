<template>
	<view class="login-container">
		<view class="login-box">
			<view class="logo">
				<image src="/static/images/taekwondo.png" class="logo-icon" mode="aspectFit"></image>
			</view>
			<view class="title">欣兰体育</view>
			
			<view class="form-group">
				<view class="tab-bar">
					<view 
						class="tab-item" 
						:class="{ active: loginType === 'wechat' }"
						@click="switchLoginType('wechat')"
					>
						<image src="/static/images/icon-wechat.png" class="tab-icon" mode="aspectFit"></image>
						<text>微信登录</text>
					</view>
					<view 
						class="tab-item" 
						:class="{ active: loginType === 'coach' }"
						@click="switchLoginType('coach')"
					>
						<image src="/static/images/icon-coach.png" class="tab-icon" mode="aspectFit"></image>
						<text>教练登录</text>
					</view>
					<view 
						class="tab-item" 
						:class="{ active: loginType === 'admin' }"
						@click="switchLoginType('admin')"
					>
						<image src="/static/images/icon-admin.png" class="tab-icon" mode="aspectFit"></image>
						<text>管理员登录</text>
					</view>
				</view>
			</view>
			
			<view v-if="loginType === 'wechat'" class="wechat-login">
				<button class="login-btn" @click="wechatLogin" :loading="loading">
					<text v-if="!loading">微信一键登录</text>
					<text v-else>登录中...</text>
				</button>
				<view class="privacy-agreement">
					<view class="checkbox-wrapper" @click="togglePrivacyAgreement">
						<view class="checkbox" :class="{ checked: privacyAgreed }">
							<text v-if="privacyAgreed" class="check-icon">✓</text>
						</view>
						<text class="agreement-text">
							我已阅读并同意
							<text class="link" @click.stop="openUserAgreement">《用户协议》</text>
							和
							<text class="link" @click.stop="openPrivacyPolicy">《隐私政策》</text>
						</text>
					</view>
				</view>
				<button class="guest-btn" @click="guestLogin" :loading="loading">
					<text v-if="!loading">游客体验</text>
					<text v-else>登录中...</text>
				</button>
			</view>
			
			<view v-if="loginType === 'coach'" class="coach-login">
				<view class="form-item">
					<view class="input-container">
						<image src="/static/images/icon-user.png" class="input-icon" mode="aspectFit"></image>
						<input 
							class="input" 
							v-model="username" 
							placeholder="请输入教练账号"
							placeholder-class="placeholder"
							maxlength="30"
						/>
					</view>
				</view>
				
				<view class="form-item">
					<view class="input-container">
						<image src="/static/images/icon-password.png" class="input-icon" mode="aspectFit"></image>
						<input 
							class="input" 
							v-model="password" 
							password
							placeholder="请输入密码"
							placeholder-class="placeholder"
							maxlength="20"
							@input="handlePasswordInput"
						/>
					</view>
				</view>
				
				<view class="privacy-agreement">
					<view class="checkbox-wrapper" @click="togglePrivacyAgreement">
						<view class="checkbox" :class="{ checked: privacyAgreed }">
							<text v-if="privacyAgreed" class="check-icon">✓</text>
						</view>
						<text class="agreement-text">
							我已阅读并同意
							<text class="link" @click.stop="openUserAgreement">《用户协议》</text>
							和
							<text class="link" @click.stop="openPrivacyPolicy">《隐私政策》</text>
						</text>
					</view>
				</view>
				
				<button class="login-btn" @click="coachLogin" :loading="loading">
					<text v-if="!loading">教练登录</text>
					<text v-else>登录中...</text>
				</button>
			</view>
			
			<view v-if="loginType === 'admin'" class="admin-login">
				<view class="form-item">
					<view class="input-container">
						<image src="/static/images/icon-user.png" class="input-icon" mode="aspectFit"></image>
						<input 
							class="input" 
							v-model="adminUsername" 
							placeholder="请输入管理员账号"
							placeholder-class="placeholder"
							maxlength="30"
						/>
					</view>
				</view>
				
				<view class="form-item">
					<view class="input-container">
						<image src="/static/images/icon-password.png" class="input-icon" mode="aspectFit"></image>
						<input 
							class="input" 
							v-model="adminPassword" 
							password
							placeholder="请输入密码"
							placeholder-class="placeholder"
							maxlength="20"
							@input="handleAdminPasswordInput"
						/>
					</view>
				</view>
				
				<view class="privacy-agreement">
					<view class="checkbox-wrapper" @click="togglePrivacyAgreement">
						<view class="checkbox" :class="{ checked: privacyAgreed }">
							<text v-if="privacyAgreed" class="check-icon">✓</text>
						</view>
						<text class="agreement-text">
							我已阅读并同意
							<text class="link" @click.stop="openUserAgreement">《用户协议》</text>
							和
							<text class="link" @click.stop="openPrivacyPolicy">《隐私政策》</text>
						</text>
					</view>
				</view>
				
				<button class="login-btn" @click="adminLogin" :loading="loading">
					<text v-if="!loading">管理员登录</text>
					<text v-else>登录中...</text>
				</button>
			</view>
		</view>
	</view>
</template>

<script>
import { authAPI } from '@/utils/api.js'
import { STORAGE_KEYS } from '@/utils/common.js'
import { getShareConfig, getTimelineConfig } from '@/utils/share.js'

export default {
	data() {
		return {
			loginType: 'wechat',
			username: '',
			password: '',
			adminUsername: '',
			adminPassword: '',
			loading: false,
			isSubmitting: false,
			privacyAgreed: false,
			redirectUrl: ''
		}
	},
	
	onLoad(options) {
		if (options.redirect) {
			this.redirectUrl = decodeURIComponent(options.redirect)
		}
	},
	
	onShareAppMessage() {
		return getShareConfig('/pages/login/login', '欣兰体育 - 登录')
	},
	
	onShareTimeline() {
		return getTimelineConfig('欣兰体育')
	},
	
	methods: {
		switchLoginType(type) {
			this.loginType = type
		},
		
		togglePrivacyAgreement() {
			this.privacyAgreed = !this.privacyAgreed
		},
		
		openUserAgreement() {
			uni.navigateTo({
				url: '/pages/parent/user-agreement/user-agreement'
			})
		},
		
		openPrivacyPolicy() {
			uni.navigateTo({
				url: '/pages/parent/privacy-policy/privacy-policy'
			})
		},
		
		handlePasswordInput(e) {
			this.password = e.detail.value.replace(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/g, '')
		},
		
		handleAdminPasswordInput(e) {
			this.adminPassword = e.detail.value.replace(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/g, '')
		},
		
		checkPrivacyAgreement() {
			if (!this.privacyAgreed) {
				uni.showToast({
					title: '请先同意用户协议和隐私政策',
					icon: 'none'
				})
				return false
			}
			return true
		},
		
		async wechatLogin() {
			if (!this.checkPrivacyAgreement()) return
			
			if (this.isSubmitting) return
			
			this.isSubmitting = true
			this.loading = true
			
			try {
				uni.clearStorageSync()
				
				const loginRes = await uni.login({
					provider: 'weixin'
				})
				
				const res = await authAPI.login(loginRes.code)
				
				uni.setStorageSync(STORAGE_KEYS.TOKEN, res.data.token)
				uni.setStorageSync(STORAGE_KEYS.USER_INFO, res.data.userInfo)
				
				uni.showToast({
					title: '登录成功',
					icon: 'success'
				})
				
				setTimeout(() => {
					if (this.redirectUrl) {
						uni.redirectTo({
							url: this.redirectUrl,
							fail: () => {
								uni.switchTab({
									url: '/pages/parent/index/index'
								})
							}
						})
					} else {
						uni.switchTab({
							url: '/pages/parent/index/index'
						})
					}
				}, 1500)
			} catch (e) {
				console.error('登录失败:', e)
				uni.showToast({
					title: '登录失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
				this.isSubmitting = false
			}
		},
		
		async guestLogin() {
			if (!this.checkPrivacyAgreement()) return
			
			if (this.isSubmitting) return
			
			this.isSubmitting = true
			this.loading = true
			
			try {
				uni.clearStorageSync()
				const res = await authAPI.guestLogin()
				uni.setStorageSync(STORAGE_KEYS.TOKEN, res.data.token)
				uni.setStorageSync(STORAGE_KEYS.USER_INFO, res.data.userInfo)
				
				uni.showToast({
					title: '游客登录成功',
					icon: 'success'
				})
				
				setTimeout(() => {
					if (this.redirectUrl) {
						uni.redirectTo({
							url: this.redirectUrl,
							fail: () => {
								uni.switchTab({
									url: '/pages/parent/index/index'
								})
							}
						})
					} else {
						uni.switchTab({
							url: '/pages/parent/index/index'
						})
					}
				}, 1500)
			} catch (e) {
				console.error('游客登录失败:', e)
				uni.showToast({
					title: '登录失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
				this.isSubmitting = false
			}
		},
		
		async coachLogin() {
			if (!this.checkPrivacyAgreement()) return
			
			if (!this.username || !this.password) {
				uni.showToast({
					title: '请输入教练账号和密码',
					icon: 'none'
				})
				return
			}
			
			if (this.isSubmitting) return
			
			this.isSubmitting = true
			this.loading = true
			
			try {
				uni.clearStorageSync()
				
				const res = await authAPI.coachLogin(this.username, this.password)
				uni.setStorageSync(STORAGE_KEYS.TOKEN, res.data.token)
				uni.setStorageSync(STORAGE_KEYS.USER_INFO, res.data.userInfo)
				
				uni.showToast({
					title: '登录成功',
					icon: 'success'
				})
				
				setTimeout(() => {
					uni.redirectTo({
						url: '/pages/coach/index/index'
					})
				}, 1500)
			} catch (e) {
				console.error('登录失败:', e)
				uni.showToast({
					title: e.message || '登录失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
				this.isSubmitting = false
			}
		},
		
		async adminLogin() {
			if (!this.checkPrivacyAgreement()) return
			
			if (!this.adminUsername || !this.adminPassword) {
				uni.showToast({
					title: '请输入管理员账号和密码',
					icon: 'none'
				})
				return
			}
			
			if (this.isSubmitting) return
			
			this.isSubmitting = true
			this.loading = true
			
			try {
				uni.clearStorageSync()
				
				const res = await authAPI.adminLogin(this.adminUsername, this.adminPassword)
				
				uni.setStorageSync(STORAGE_KEYS.TOKEN, res.data.token)
				uni.setStorageSync(STORAGE_KEYS.USER_INFO, res.data.userInfo)
				
				uni.showToast({
					title: '登录成功',
					icon: 'success'
				})
				
				setTimeout(() => {
					uni.redirectTo({
						url: '/pages/coach/index/index'
					})
				}, 1500)
			} catch (e) {
				console.error('登录失败:', e)
				uni.showToast({
					title: e.message || '登录失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
				this.isSubmitting = false
			}
		}
	}
}
</script>

<style scoped>
.login-container {
	min-height: 100vh;
	background: #fafafa;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 40rpx;
}

.login-box {
	width: 100%;
	max-width: 600rpx;
	background: #ffffff;
	border-radius: 24rpx;
	padding: 60rpx 40rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.logo {
	text-align: center;
	margin-bottom: 40rpx;
}

.logo-icon {
	width: 100rpx;
	height: 100rpx;
	display: inline-block;
}

.title {
	font-size: 36rpx;
	font-weight: 600;
	text-align: center;
	color: #262626;
	margin-bottom: 50rpx;
	letter-spacing: 2rpx;
}

.tab-bar {
	display: flex;
	background: #f5f5f5;
	border-radius: 12rpx;
	padding: 6rpx;
	margin-bottom: 40rpx;
}

.tab-item {
	flex: 1;
	text-align: center;
	padding: 18rpx 0;
	font-size: 26rpx;
	color: #8e8e8e;
	border-radius: 10rpx;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
}

.tab-item.active {
	background: #ffffff;
	color: #262626;
	font-weight: 600;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}

.tab-icon {
	width: 28rpx;
	height: 28rpx;
}

.form-item {
	margin-bottom: 24rpx;
}

.input-container {
	position: relative;
	width: 100%;
	overflow: visible;
}

.input-icon {
	width: 28rpx;
	height: 28rpx;
	position: absolute;
	left: 24rpx;
	top: 50%;
	transform: translateY(-50%);
	z-index: 10;
	opacity: 0.6;
}

.input {
	width: 100%;
	height: 88rpx;
	background: #fafafa;
	border-radius: 12rpx;
	padding: 0 24rpx 0 72rpx;
	font-size: 28rpx;
	border: 1rpx solid #dbdbdb;
	transition: all 0.2s ease;
	box-sizing: border-box;
}

.input:focus {
	border-color: #a8a8a8;
	background: #ffffff;
}

.placeholder {
	color: #8e8e8e;
}

.login-btn {
	width: 100%;
	height: 88rpx;
	background: #0095f6;
	color: #ffffff;
	border: none;
	border-radius: 12rpx;
	font-size: 30rpx;
	font-weight: 600;
	margin-top: 32rpx;
	transition: all 0.2s ease;
}

.login-btn:active {
	opacity: 0.8;
}

.login-btn::after {
	border: none;
}

.guest-btn {
	width: 100%;
	height: 88rpx;
	background: #ffffff;
	color: #0095f6;
	border: 2rpx solid #0095f6;
	border-radius: 12rpx;
	font-size: 30rpx;
	font-weight: 600;
	margin-top: 24rpx;
	transition: all 0.2s ease;
}

.guest-btn:active {
	opacity: 0.8;
	background: #f0f0f0;
}

.guest-btn::after {
	border: none;
}

.privacy-agreement {
	margin-top: 24rpx;
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
	background: #0095f6;
	border-color: #0095f6;
}

.check-icon {
	color: #ffffff;
	font-size: 20rpx;
	font-weight: bold;
}

.agreement-text {
	font-size: 24rpx;
	color: #8e8e8e;
	line-height: 1.6;
	flex: 1;
}

.link {
	color: #0095f6;
}

.tips {
	text-align: center;
	font-size: 24rpx;
	color: #8e8e8e;
	margin-top: 24rpx;
	line-height: 1.6;
}

@media (max-width: 375px) {
	.login-box {
		padding: 40rpx 30rpx;
	}
	
	.title {
		font-size: 32rpx;
		margin-bottom: 36rpx;
	}
	
	.input {
		height: 80rpx;
		font-size: 26rpx;
	}
	
	.login-btn {
		height: 80rpx;
		font-size: 28rpx;
	}
	
	.guest-btn {
		height: 80rpx;
		font-size: 28rpx;
	}
}
</style>