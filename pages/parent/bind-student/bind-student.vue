<template>
	<view class="container">
		<!-- 顶部装饰区域 -->
		<view class="header-decoration">
			<view class="decoration-circle circle-1"></view>
			<view class="decoration-circle circle-2"></view>
			<view class="decoration-circle circle-3"></view>
		</view>
		
		<!-- 返回按钮 -->
		<view class="back-btn-wrapper">
			<view class="back-btn" @click="goBack">
				<text class="back-arrow">←</text>
				<text class="back-text">返回</text>
			</view>
		</view>
		
		<!-- 第一步：输入信息 -->
		<view v-if="step === 1" class="content-wrapper">
			<!-- 图标和标题区域 -->
			<view class="header-section">
				<view class="icon-wrapper">
					<image src="/static/images/icon-child.png" class="header-icon" mode="aspectFit"></image>
				</view>
				<view class="header-title">添加孩子</view>
				<view class="header-subtitle">请输入孩子的姓名和您的手机号</view>
			</view>
			
			<!-- 表单区域 -->
			<view class="form-section">
				<view class="form-item">
					<view class="input-label">
						<text class="label-text">孩子姓名</text>
						<text class="required-mark">*</text>
					</view>
					<view class="input-box">
						<view class="input-icon-wrapper">
							<image src="/static/images/icon-user.png" class="input-icon" mode="aspectFit"></image>
						</view>
						<input 
							class="input-field" 
							v-model="form.name" 
							placeholder="请输入孩子姓名"
							placeholder-class="placeholder-text"
							maxlength="20"
						/>
					</view>
				</view>
				
				<view class="form-item">
					<view class="input-label">
						<text class="label-text">家长手机号</text>
						<text class="required-mark">*</text>
					</view>
					<view class="input-box">
						<view class="input-icon-wrapper phone-icon">
						<image src="/static/images/icon-phone.png" class="input-icon" mode="aspectFit"></image>
					</view>
						<input 
							class="input-field" 
							v-model="form.mobile" 
							placeholder="请输入家长手机号"
							placeholder-class="placeholder-text"
							maxlength="11"
							type="number"
						/>
					</view>
				</view>
				
				<button class="search-btn" @click="searchStudent" :loading="loading" :disabled="loading">
					<text v-if="!loading" class="btn-text">查找孩子</text>
					<text v-else class="btn-text">查找中...</text>
				</button>
			</view>
			
			<!-- 底部提示 -->
			<view class="bottom-tip">
				<text class="tip-icon">💡</text>
				<text class="tip-text">请确保输入的信息与报名时填写的一致</text>
			</view>
		</view>
		
		<!-- 第二步：选择孩子（处理重名情况） -->
		<view v-if="step === 2" class="content-wrapper">
			<view class="header-section">
				<view class="icon-wrapper result">
					<image src="/static/images/icon-students.png" class="header-icon" mode="aspectFit"></image>
				</view>
				<view class="header-title">找到多个匹配结果</view>
				<view class="header-subtitle">请选择正确的孩子</view>
			</view>
			
			<view class="student-list-section">
				<view 
					v-for="student in matchedStudents" 
					:key="student._id"
					class="student-card"
					@click="selectStudent(student)"
				>
					<view class="student-avatar">{{ student.name.charAt(0) }}</view>
					<view class="student-info">
						<view class="student-name">{{ student.name }}</view>
						<view class="student-meta">
							<text class="meta-tag level">{{ getLevelLabel(student.level) }}</text>
							<text class="meta-tag hours">剩余{{ student.hours_info?.remaining || 0 }}节</text>
						</view>
					</view>
					<view class="select-arrow">
						<text class="arrow-text">选择</text>
						<text class="arrow-icon">›</text>
					</view>
				</view>
			</view>
			
			<button class="secondary-btn" @click="step = 1">
				<text class="btn-text">重新输入</text>
			</button>
		</view>
		
		<!-- 第三步：确认绑定 -->
		<view v-if="step === 3" class="content-wrapper">
			<view class="header-section">
				<view class="success-circle">
					<text class="success-check">✓</text>
				</view>
				<view class="header-title">找到孩子信息</view>
				<view class="header-subtitle">请确认信息无误后添加</view>
			</view>
			
			<view class="info-card">
				<view class="info-row">
					<text class="info-label">姓名</text>
					<text class="info-value">{{ selectedStudent.name }}</text>
				</view>
				<view class="info-divider"></view>
				<view class="info-row">
					<text class="info-label">性别</text>
					<text class="info-value">{{ selectedStudent.gender === 'male' ? '男' : '女' }}</text>
				</view>
				<view class="info-divider"></view>
				<view class="info-row">
					<text class="info-label">级别</text>
					<text class="info-value">{{ getLevelLabel(selectedStudent.level) }}</text>
				</view>
				<view class="info-divider"></view>
				<view class="info-row">
					<text class="info-label">剩余节数课时</text>
					<text class="info-value highlight">{{ selectedStudent.hours_info?.lesson?.remaining || 0 }}节</text>
				</view>
				<view class="info-divider"></view>
				<view class="info-row">
					<text class="info-label">已用节数课时</text>
					<text class="info-value">{{ selectedStudent.hours_info?.lesson?.used || 0 }}节</text>
				</view>
				<view class="info-divider"></view>
				<view class="info-row">
					<text class="info-label">剩余天数课时</text>
					<text class="info-value highlight">{{ selectedStudent.hours_info?.day?.remaining || 0 }}天</text>
				</view>
				<view class="info-divider"></view>
				<view class="info-row">
					<text class="info-label">已用天数课时</text>
					<text class="info-value">{{ selectedStudent.hours_info?.day?.used || 0 }}天</text>
				</view>
				<view class="info-divider"></view>
				<view class="info-row">
					<text class="info-label">剩余私教课时</text>
					<text class="info-value highlight">{{ selectedStudent.hours_info?.private?.remaining || 0 }}节</text>
				</view>
				<view class="info-divider"></view>
				<view class="info-row">
					<text class="info-label">已用私教课时</text>
					<text class="info-value">{{ selectedStudent.hours_info?.private?.used || 0 }}节</text>
				</view>
			</view>
			
			<button class="confirm-btn" @click="confirmBind" :loading="loading" :disabled="loading">
				<text v-if="!loading" class="btn-text">确认添加</text>
				<text v-else class="btn-text">添加中...</text>
			</button>
			
			<button class="secondary-btn" @click="step = 1">
				<text class="btn-text">重新查找</text>
			</button>
		</view>
	</view>
</template>

<script>
import { studentAPI } from '@/utils/api.js'
import { LEVEL_OPTIONS, STORAGE_KEYS } from '@/utils/common.js'
import { getShareConfig, getTimelineConfig } from '@/utils/share.js'

export default {
	data() {
		return {
			step: 1,
			form: {
				name: '',
				mobile: ''
			},
			matchedStudents: [],
			selectedStudent: null,
			loading: false
		}
	},
	
	onShareAppMessage() {
		return getShareConfig('/pages/parent/bind-student/bind-student', '欣兰体育 - 添加孩子')
	},
	
	onShareTimeline() {
		return getTimelineConfig('欣兰体育')
	},
	
	methods: {
		goBack() {
			uni.navigateBack()
		},
		
		async searchStudent() {
			if (!this.form.name) {
				uni.showToast({
					title: '请输入孩子姓名',
					icon: 'none'
				})
				return
			}
			
			if (!this.form.mobile) {
				uni.showToast({
					title: '请输入家长手机号',
					icon: 'none'
				})
				return
			}
			
			if (!/^1[3-9]\d{9}$/.test(this.form.mobile)) {
				uni.showToast({
					title: '请输入正确的手机号',
					icon: 'none'
				})
				return
			}
			
			this.loading = true
			
			try {
				// 根据姓名和手机号搜索学生
				const res = await studentAPI.searchByNameAndMobile({
					name: this.form.name,
					mobile: this.form.mobile
				})
				
				if (res.data.list.length === 0) {
					uni.showToast({
						title: '未找到匹配的孩子，请检查姓名和手机号',
						icon: 'none',
						duration: 2000
					})
				} else if (res.data.list.length === 1) {
					// 只有一个匹配，直接显示确认
					this.selectedStudent = res.data.list[0]
					this.step = 3
				} else {
					// 多个匹配，需要选择
					this.matchedStudents = res.data.list
					this.step = 2
				}
			} catch (e) {
				console.error('搜索失败:', e)
				uni.showToast({
					title: e.message || '搜索失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},
		
		selectStudent(student) {
			this.selectedStudent = student
			this.step = 3
		},
		
		async confirmBind() {
			this.loading = true
			
			try {
				// 绑定学生到当前家长账号
				await studentAPI.bindToParent({
					student_id: this.selectedStudent._id
				})
				
				// 更新本地存储的学生列表
				const userInfo = uni.getStorageSync(STORAGE_KEYS.USER_INFO)
				if (userInfo) {
					if (!userInfo.student_ids) {
						userInfo.student_ids = []
					}
					userInfo.student_ids.push(this.selectedStudent._id)
					uni.setStorageSync(STORAGE_KEYS.USER_INFO, userInfo)
				}
				
				uni.showToast({
					title: '添加成功',
					icon: 'success'
				})
				
				setTimeout(() => {
					uni.navigateBack()
				}, 1500)
			} catch (e) {
				console.error('绑定失败:', e)
				uni.showToast({
					title: e.message || '绑定失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},
		
		getLevelLabel(level) {
			const option = LEVEL_OPTIONS.find(opt => opt.value === level)
			return option ? option.label : level
		}
	}
}
</script>

<style scoped>
.container {
	min-height: 100vh;
	background: linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%);
	position: relative;
}

/* 顶部装饰 */
.header-decoration {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 300rpx;
	overflow: hidden;
	pointer-events: none;
}

.decoration-circle {
	position: absolute;
	border-radius: 50%;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	opacity: 0.08;
}

.circle-1 {
	width: 400rpx;
	height: 400rpx;
	top: -200rpx;
	right: -100rpx;
}

.circle-2 {
	width: 300rpx;
	height: 300rpx;
	top: -100rpx;
	left: -100rpx;
}

.circle-3 {
	width: 200rpx;
	height: 200rpx;
	top: 100rpx;
	right: 100rpx;
	opacity: 0.05;
}

/* 返回按钮 */
.back-btn-wrapper {
	padding: 40rpx 30rpx 20rpx;
}

.back-btn {
	display: inline-flex;
	align-items: center;
	gap: 8rpx;
	padding: 16rpx 24rpx;
	background: rgba(255, 255, 255, 0.8);
	border-radius: 40rpx;
	backdrop-filter: blur(10rpx);
}

.back-arrow {
	font-size: 32rpx;
	color: #667eea;
	font-weight: bold;
}

.back-text {
	font-size: 28rpx;
	color: #667eea;
	font-weight: 500;
}

/* 内容区域 */
.content-wrapper {
	padding: 0 40rpx 60rpx;
}

/* 头部区域 - 图标居中 */
.header-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 40rpx 0 50rpx;
}

.icon-wrapper {
	width: 140rpx;
	height: 140rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 30rpx;
	box-shadow: 0 12rpx 40rpx rgba(102, 126, 234, 0.25);
}

.icon-wrapper.result {
	background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
	box-shadow: 0 12rpx 40rpx rgba(78, 205, 196, 0.25);
}

.header-icon {
	width: 70rpx;
	height: 70rpx;
}

.header-title {
	font-size: 40rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 16rpx;
}

.header-subtitle {
	font-size: 28rpx;
	color: #999;
}

/* 成功图标 */
.success-circle {
	width: 140rpx;
	height: 140rpx;
	background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 30rpx;
	box-shadow: 0 12rpx 40rpx rgba(76, 175, 80, 0.25);
}

.success-check {
	font-size: 70rpx;
	color: #ffffff;
	font-weight: bold;
}

/* 表单区域 */
.form-section {
	background: #ffffff;
	border-radius: 24rpx;
	padding: 40rpx;
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);
}

.form-item {
	margin-bottom: 32rpx;
}

.form-item:last-of-type {
	margin-bottom: 0;
}

.input-label {
	display: flex;
	align-items: center;
	margin-bottom: 16rpx;
}

.label-text {
	font-size: 28rpx;
	color: #333;
	font-weight: 600;
}

.required-mark {
	color: #ff6b6b;
	margin-left: 8rpx;
	font-size: 28rpx;
}

.input-box {
	display: flex;
	align-items: center;
	background: #f8f9fa;
	border-radius: 16rpx;
	border: 2rpx solid #f0f0f0;
	transition: all 0.3s ease;
	overflow: hidden;
}

.input-box:focus-within {
	background: #ffffff;
	border-color: #667eea;
	box-shadow: 0 0 0 4rpx rgba(102, 126, 234, 0.1);
}

.input-icon-wrapper {
			width: 88rpx;
			height: 88rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
		}

		.input-icon-wrapper.phone-icon {
			background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
		}

.input-icon {
	width: 36rpx;
	height: 36rpx;
}

.input-field {
	flex: 1;
	height: 88rpx;
	padding: 0 24rpx;
	font-size: 30rpx;
	color: #333;
	background: transparent;
}

.placeholder-text {
	color: #bbb;
	font-size: 30rpx;
}

/* 按钮样式 */
.search-btn, .confirm-btn {
	width: 100%;
	height: 96rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: #ffffff;
	border: none;
	border-radius: 48rpx;
	font-size: 32rpx;
	font-weight: bold;
	margin-top: 40rpx;
	box-shadow: 0 12rpx 32rpx rgba(102, 126, 234, 0.3);
	transition: all 0.3s ease;
}

.search-btn:active, .confirm-btn:active {
	transform: translateY(4rpx);
	box-shadow: 0 6rpx 16rpx rgba(102, 126, 234, 0.3);
}

.search-btn[disabled], .confirm-btn[disabled] {
	opacity: 0.7;
}

.btn-text {
	color: #ffffff;
}

.secondary-btn {
	width: 100%;
	height: 96rpx;
	background: #f0f0f0;
	color: #666;
	border: none;
	border-radius: 48rpx;
	font-size: 32rpx;
	font-weight: 500;
	margin-top: 24rpx;
	transition: all 0.3s ease;
}

.secondary-btn:active {
	background: #e0e0e0;
}

/* 底部提示 */
.bottom-tip {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	margin-top: 40rpx;
	padding: 20rpx;
}

.tip-icon {
	font-size: 28rpx;
}

.tip-text {
	font-size: 26rpx;
	color: #999;
}

/* 学生列表 */
.student-list-section {
	margin-bottom: 30rpx;
}

.student-card {
	display: flex;
	align-items: center;
	background: #ffffff;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
	transition: all 0.3s ease;
}

.student-card:active {
	transform: scale(0.98);
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.04);
}

.student-avatar {
	width: 80rpx;
	height: 80rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 32rpx;
	color: #ffffff;
	font-weight: bold;
	margin-right: 24rpx;
	flex-shrink: 0;
}

.student-info {
	flex: 1;
	min-width: 0;
}

.student-name {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 12rpx;
}

.student-meta {
	display: flex;
	gap: 16rpx;
	flex-wrap: wrap;
}

.meta-tag {
	font-size: 24rpx;
	padding: 6rpx 16rpx;
	border-radius: 8rpx;
}

.meta-tag.level {
	background: rgba(102, 126, 234, 0.1);
	color: #667eea;
}

.meta-tag.hours {
	background: rgba(78, 205, 196, 0.1);
	color: #4ecdc4;
}

.select-arrow {
	display: flex;
	align-items: center;
	gap: 4rpx;
	padding: 12rpx 20rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 30rpx;
	margin-left: 16rpx;
	flex-shrink: 0;
}

.arrow-text {
	font-size: 24rpx;
	color: #ffffff;
	font-weight: 500;
}

.arrow-icon {
	font-size: 28rpx;
	color: #ffffff;
}

/* 信息卡片 */
.info-card {
	background: #ffffff;
	border-radius: 24rpx;
	padding: 20rpx 40rpx;
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);
	margin-bottom: 40rpx;
}

.info-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 28rpx 0;
}

.info-label {
	font-size: 28rpx;
	color: #666;
}

.info-value {
	font-size: 30rpx;
	color: #333;
	font-weight: 600;
}

.info-value.highlight {
	color: #667eea;
	font-size: 32rpx;
}

.info-divider {
	height: 1rpx;
	background: #f0f0f0;
}
</style>
