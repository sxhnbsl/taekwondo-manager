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
			<text class="nav-title">课时预警</text>
			<view class="nav-right"></view>
		</view>
		
		<view class="content">
			<view class="warning-card">
				<view class="warning-icon">⚠️</view>
				<view class="warning-info">
					<text class="warning-title">课时不足预警</text>
					<text class="warning-desc">以下学生的剩余课时少于或等于10节，请及时提醒家长续费</text>
				</view>
			</view>
			
			<view class="stats-summary">
				<view class="stat-item">
					<text class="stat-value">{{ lowHoursStudents.length }}</text>
					<text class="stat-label">预警学生</text>
				</view>
				<view class="stat-divider"></view>
				<view class="stat-item">
					<text class="stat-value">{{ totalLowHours }}</text>
					<text class="stat-label">剩余总课时</text>
				</view>
			</view>
			
			<view v-if="loading" class="loading-container">
				<text class="loading-text">加载中...</text>
			</view>
			
			<view v-else-if="lowHoursStudents.length === 0" class="empty-container">
				<text class="empty-icon">✅</text>
				<text class="empty-text">暂无课时预警学生</text>
				<text class="empty-desc">所有学生的课时都很充足</text>
			</view>
			
			<view v-else class="student-list">
				<view 
					v-for="student in lowHoursStudents" 
					:key="student._id" 
					class="student-card"
					@click="goToStudentDetail(student._id)"
				>
					<view class="student-avatar">
						<text class="avatar-text">{{ student.name.charAt(0) }}</text>
					</view>
					
					<view class="student-info">
						<view class="student-header">
							<text class="student-name">{{ student.name }}</text>
							<view class="hours-badge" :class="getHoursLevel(student.remaining_hours)">
								<text class="hours-text">{{ student.remaining_hours }}节</text>
							</view>
						</view>
						
						<view class="student-details">
							<view class="detail-item">
								<text class="detail-icon">👨‍👩‍👧</text>
								<text class="detail-text">{{ student.parent_name }}</text>
							</view>
							<view class="detail-item">
								<text class="detail-icon">📱</text>
								<text class="detail-text">{{ student.parent_mobile }}</text>
							</view>
						</view>
						
						<view class="student-footer">
							<view class="warning-level" :class="getHoursLevel(student.remaining_hours)">
								<text class="level-icon">{{ getWarningIcon(student.remaining_hours) }}</text>
								<text class="level-text">{{ getWarningText(student.remaining_hours) }}</text>
							</view>
							<view class="action-buttons">
								<view class="action-btn" @click.stop="callParent(student.parent_mobile)">
									<text class="btn-icon">📞</text>
									<text class="btn-text">联系家长</text>
								</view>
								<view class="action-btn" @click.stop="sendNotification(student)">
									<text class="btn-icon">💬</text>
									<text class="btn-text">发送提醒</text>
								</view>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { studentAPI } from '@/utils/api.js'

export default {
	data() {
		return {
			loading: false,
			students: []
		}
	},
	
	computed: {
		lowHoursStudents() {
			return this.students.filter(s => {
				// 计算总有效课时（节数 + 天数）
				const totalEffectiveHours = (s.remaining_hours || 0) + (s.remaining_days || 0)
				return totalEffectiveHours <= 10
			})
		},
		
		totalLowHours() {
			return this.lowHoursStudents.reduce((sum, s) => {
				return sum + (s.remaining_hours || 0) + (s.remaining_days || 0)
			}, 0)
		}
	},
	
	onLoad() {
		this.loadStudents()
	},
	
	onTabItemTap() {
		this.loadStudents()
	},
	
	methods: {
		async loadStudents() {
			this.loading = true
			
			try {
				const res = await studentAPI.getList({
					page: 1,
					pageSize: 100
				})
				
				if (res.code === 0) {
					this.students = res.data.list || []
				}
			} catch (e) {
				console.error('加载学生列表失败:', e)
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},
		
		goBack() {
			uni.navigateBack()
		},
		
		goToStudentDetail(studentId) {
			uni.navigateTo({
				url: `/pages/coach/student-detail/student-detail?id=${studentId}`
			})
		},
		
		callParent(mobile) {
			uni.makePhoneCall({
				phoneNumber: mobile
			})
		},
		
		sendNotification(student) {
			uni.navigateTo({
				url: `/pages/coach/notification-send/notification-send?studentId=${student._id}`
			})
		},
		
		getHoursLevel(hours) {
			if (hours <= 3) return 'critical'
			if (hours <= 6) return 'warning'
			return 'normal'
		},
		
		getWarningIcon(hours) {
			if (hours <= 3) return '🔴'
			if (hours <= 6) return '🟡'
			return '🟢'
		},
		
		getWarningText(hours) {
			if (hours <= 3) return '严重不足'
			if (hours <= 6) return '即将用完'
			return '即将到期'
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
	background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
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

/* 标签页样式 */
.tab-bar {
	position: relative;
	z-index: 5;
	display: flex;
	background: #ffffff;
	margin: 0 32rpx;
	border-radius: 16rpx;
	padding: 8rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
	margin-bottom: 24rpx;
}

.tab-item {
	flex: 1;
	padding: 16rpx;
	text-align: center;
	border-radius: 12rpx;
	transition: all 0.3s;
}

.tab-item.active {
	background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.tab-text {
	font-size: 28rpx;
	font-weight: 600;
	color: #666;
	transition: all 0.3s;
}

.tab-item.active .tab-text {
	color: #ffffff;
}

.content {
	position: relative;
	z-index: 5;
	padding: 0 32rpx 32rpx;
	padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
}

.warning-card {
	background: #ffffff;
	border-radius: 24rpx;
	padding: 32rpx;
	margin-bottom: 24rpx;
	display: flex;
	align-items: flex-start;
	gap: 20rpx;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.warning-icon {
	font-size: 48rpx;
	line-height: 1;
}

.warning-info {
	flex: 1;
}

.warning-title {
	display: block;
	font-size: 32rpx;
	font-weight: 700;
	color: #262626;
	margin-bottom: 12rpx;
}

.warning-desc {
	display: block;
	font-size: 26rpx;
	color: #8e8e8e;
	line-height: 1.6;
}

.stats-summary {
	background: #ffffff;
	border-radius: 24rpx;
	padding: 32rpx;
	margin-bottom: 24rpx;
	display: flex;
	align-items: center;
	justify-content: space-around;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.stat-item {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.stat-value {
	font-size: 48rpx;
	font-weight: 700;
	color: #fa709a;
	margin-bottom: 8rpx;
}

.stat-label {
	font-size: 24rpx;
	color: #8e8e8e;
}

.stat-divider {
	width: 2rpx;
	height: 60rpx;
	background: #f0f0f0;
}

/* 批量操作栏 */
.batch-action-bar {
	background: #ffffff;
	border-radius: 16rpx;
	padding: 20rpx;
	margin-bottom: 16rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
}

.selected-count {
	font-size: 26rpx;
	color: #666;
}

.batch-buttons {
	display: flex;
	gap: 16rpx;
}

.batch-btn {
	padding: 12rpx 24rpx;
	border-radius: 12rpx;
	font-size: 26rpx;
	font-weight: 600;
	transition: all 0.2s;
}

.batch-btn.cancel {
	background: #f5f7fa;
	color: #666;
}

.batch-btn.delete {
	background: #ffebee;
	color: #ef5350;
}

.batch-btn:active {
	transform: scale(0.95);
}

.loading-container {
	background: #ffffff;
	border-radius: 24rpx;
	padding: 80rpx 40rpx;
	text-align: center;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.loading-text {
	font-size: 28rpx;
	color: #8e8e8e;
}

.empty-container {
	background: #ffffff;
	border-radius: 24rpx;
	padding: 80rpx 40rpx;
	text-align: center;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.empty-icon {
	display: block;
	font-size: 80rpx;
	margin-bottom: 24rpx;
}

.empty-text {
	display: block;
	font-size: 28rpx;
	color: #262626;
	font-weight: 600;
	margin-bottom: 12rpx;
}

.empty-desc {
	display: block;
	font-size: 24rpx;
	color: #8e8e8e;
}

.student-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.student-card {
	background: #ffffff;
	border-radius: 24rpx;
	padding: 32rpx;
	display: flex;
	gap: 24rpx;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
	transition: all 0.2s;
}

.student-card:active {
	transform: scale(0.98);
	background: #fafafa;
}

.student-avatar {
	width: 100rpx;
	height: 100rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.avatar-text {
	font-size: 40rpx;
	color: #ffffff;
	font-weight: 600;
}

.student-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.student-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.student-name {
	font-size: 32rpx;
	font-weight: 700;
	color: #262626;
}

.hours-badge {
	padding: 8rpx 20rpx;
	border-radius: 20rpx;
}

.hours-badge.critical {
	background: #ffebee;
}

.hours-badge.warning {
	background: #fff8e1;
}

.hours-badge.normal {
	background: #e8f5e9;
}

.hours-text {
	font-size: 24rpx;
	font-weight: 600;
}

.hours-badge.critical .hours-text {
	color: #ef5350;
}

.hours-badge.warning .hours-text {
	color: #f9a825;
}

.hours-badge.normal .hours-text {
	color: #4caf50;
}

.student-details {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.detail-item {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.detail-icon {
	font-size: 24rpx;
}

.detail-text {
	font-size: 26rpx;
	color: #8e8e8e;
}

.student-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-top: 16rpx;
	border-top: 1rpx solid #f0f0f0;
}

.warning-level {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 8rpx 16rpx;
	border-radius: 16rpx;
}

.warning-level.critical {
	background: #ffebee;
}

.warning-level.warning {
	background: #fff8e1;
}

.warning-level.normal {
	background: #e8f5e9;
}

.level-icon {
	font-size: 24rpx;
}

.level-text {
	font-size: 24rpx;
	font-weight: 600;
}

.warning-level.critical .level-text {
	color: #ef5350;
}

.warning-level.warning .level-text {
	color: #f9a825;
}

.warning-level.normal .level-text {
	color: #4caf50;
}

.action-buttons {
	display: flex;
	gap: 12rpx;
}

.action-btn {
	display: flex;
	align-items: center;
	gap: 6rpx;
	padding: 12rpx 20rpx;
	border-radius: 16rpx;
	background: #f5f7fa;
	transition: all 0.2s;
}

.action-btn:active {
	transform: scale(0.95);
	background: #e8e8e8;
}

.btn-icon {
	font-size: 24rpx;
}

.btn-text {
	font-size: 24rpx;
	color: #666;
	font-weight: 500;
}

/* 课时包列表样式 */
.package-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.package-card {
	background: #ffffff;
	border-radius: 24rpx;
	padding: 32rpx;
	display: flex;
	gap: 20rpx;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
	transition: all 0.2s;
}

.package-card:active {
	transform: scale(0.98);
	background: #fafafa;
}

.package-checkbox {
	display: flex;
	align-items: flex-start;
	padding-top: 8rpx;
}

.checkbox {
	width: 40rpx;
	height: 40rpx;
	border: 2rpx solid #d9d9d9;
	border-radius: 8rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s;
}

.checkbox.checked {
	background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
	border-color: transparent;
}

.check-icon {
	font-size: 24rpx;
	color: #ffffff;
	font-weight: 600;
}

.package-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.package-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.expire-badge {
	padding: 8rpx 20rpx;
	border-radius: 20rpx;
}

.expire-badge.expired {
	background: #ffebee;
}

.expire-badge.critical {
	background: #fff8e1;
}

.expire-badge.warning {
	background: #e3f2fd;
}

.expire-badge.normal {
	background: #e8f5e9;
}

.expire-text {
	font-size: 24rpx;
	font-weight: 600;
}

.expire-badge.expired .expire-text {
	color: #ef5350;
}

.expire-badge.critical .expire-text {
	color: #f9a825;
}

.expire-badge.warning .expire-text {
	color: #2196f3;
}

.expire-badge.normal .expire-text {
	color: #4caf50;
}

.package-details {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.package-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-top: 16rpx;
	border-top: 1rpx solid #f0f0f0;
}

.expire-time {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.time-label {
	font-size: 24rpx;
	color: #8e8e8e;
}

.time-value {
	font-size: 24rpx;
	color: #262626;
	font-weight: 500;
}
</style>
