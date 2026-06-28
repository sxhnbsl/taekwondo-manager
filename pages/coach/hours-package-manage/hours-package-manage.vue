<template>
	<view class="container">
		<view class="header">
			<view class="back" @click="goBack">
				<text class="back-icon">←</text>
				<text class="back-text">返回</text>
			</view>
			<view class="title">课时包管理</view>
			<view class="placeholder"></view>
		</view>
		
		<view class="student-info">
			<view class="avatar">{{ student.name.charAt(0) }}</view>
			<view class="info">
				<view class="name">{{ student.name }}</view>
				<view class="detail">
					<text class="level">{{ getLevelLabel(student.level) }}</text>
					<text class="separator">|</text>
					<text class="mobile">{{ student.parent_mobile }}</text>
				</view>
			</view>
		</view>
		
		<view class="packages-section">
			<view class="section-title">课时包列表</view>
			<view v-if="packages.length === 0" class="empty">
				<text>暂无课时包</text>
			</view>
			<view v-else class="package-list">
				<view 
					v-for="pkg in packages" 
					:key="pkg._id"
					class="package-item"
					:class="getPackageStatusClass(pkg)"
				>
					<view class="package-header">
						<view class="package-type">
							<text class="type-label">{{ pkg.unit === 'lesson' ? '课时包' : '天数包' }}</text>
							<text class="status-tag" :class="pkg.status">{{ getStatusText(pkg.status) }}</text>
						</view>
						<view class="package-date">
							<text>{{ formatDate(pkg.create_time) }}</text>
						</view>
					</view>
					<view class="package-body">
						<view class="package-hours">
							<view class="hours-item">
								<text class="label">总{{ pkg.unit === 'lesson' ? '课时' : '天数' }}</text>
								<text class="value">{{ pkg.total || 0 }}</text>
							</view>
							<view class="hours-item">
								<text class="label">剩余</text>
								<text class="value primary">{{ pkg.remaining || 0 }}</text>
							</view>
							<view class="hours-item">
								<text class="label">已用</text>
								<text class="value">{{ (pkg.total || 0) - (pkg.remaining || 0) }}</text>
							</view>
						</view>
						<view v-if="!pkg.is_unlimited" class="expire-info">
							<text class="expire-label">到期日期：</text>
							<text class="expire-date" :class="isExpired(pkg) ? 'expired' : ''">
								{{ formatDate(pkg.expire_at) }}
							</text>
							<text v-if="isExpired(pkg)" class="expired-tag">已过期</text>
						</view>
						<view v-else class="unlimited-info">
							<text class="unlimited-tag">不限时</text>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { studentAPI } from '@/utils/api.js'
import { getLevelLabel, formatDate } from '@/utils/common.js'

export default {
	data() {
		return {
			studentId: '',
			student: {
				name: '',
				level: 'white',
				parent_mobile: ''
			},
			packages: []
		}
	},
	
	onLoad(options) {
		if (options.studentId) {
			this.studentId = options.studentId
			this.loadData()
		}
	},
	
	methods: {
		async loadData() {
			try {
				// 先获取学生信息
				const studentRes = await studentAPI.getDetail(this.studentId)
				this.student = studentRes.data
				
				// 然后获取课时包列表
				const packagesRes = await studentAPI.getPackages(this.studentId)
				this.packages = packagesRes.data.list || []
			} catch (e) {
				console.error('加载数据失败:', e)
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
			}
		},
		
		goBack() {
			uni.navigateBack()
		},
		
		getLevelLabel(level) {
			return getLevelLabel(level)
		},
		
		formatDate(date) {
			return formatDate(date, 'YYYY-MM-DD HH:mm')
		},
		
		getPackageStatusClass(pkg) {
			if (pkg.status === 'consumed') return 'consumed'
			if (this.isExpired(pkg)) return 'expired'
			return 'active'
		},
		
		getStatusText(status) {
			switch(status) {
				case 'active': return '使用中'
				case 'consumed': return '已用完'
				case 'expired': return '已过期'
				default: return status
			}
		},
		
		isExpired(pkg) {
			if (pkg.is_unlimited) return false
			if (!pkg.expire_at) return false
			const expireDate = new Date(pkg.expire_at)
			const now = new Date()
			return expireDate < now
		}
	}
}
</script>

<style scoped>
.container {
	min-height: 100vh;
	background: #f8f8f8;
}

.header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 30rpx;
	background: #ffffff;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.back {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.back-icon {
	font-size: 36rpx;
	color: #333;
}

.back-text {
	font-size: 28rpx;
	color: #333;
}

.title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
}

.placeholder {
	width: 100rpx;
}

.student-info {
	display: flex;
	align-items: center;
	padding: 30rpx;
	background: #ffffff;
	margin-bottom: 20rpx;
}

.avatar {
	width: 80rpx;
	height: 80rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 36rpx;
	color: #ffffff;
	margin-right: 20rpx;
}

.info .name {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 8rpx;
}

.info .detail {
	font-size: 24rpx;
	color: #999;
}

.separator {
	margin: 0 10rpx;
}

.packages-section {
	background: #ffffff;
	margin: 0 30rpx;
	border-radius: 16rpx;
	padding: 30rpx;
	min-height: 400rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 20rpx;
}

.empty {
	text-align: center;
	padding: 60rpx 0;
	color: #999;
	font-size: 28rpx;
}

.package-list {
	padding-top: 10rpx;
}

.package-item {
	border-bottom: 1rpx solid #f0f0f0;
	padding: 24rpx 0;
	transition: all 0.3s ease;
}

.package-item:last-child {
	border-bottom: none;
}

.package-item.active {
	background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
	border-radius: 12rpx;
	padding: 24rpx;
	margin: 0 -24rpx;
}

.package-item.expired {
	background: linear-gradient(135deg, #fff7f7 0%, #ffe6e6 100%);
	border-radius: 12rpx;
	padding: 24rpx;
	margin: 0 -24rpx;
}

.package-item.consumed {
	background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
	border-radius: 12rpx;
	padding: 24rpx;
	margin: 0 -24rpx;
}

.package-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16rpx;
}

.package-type {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.type-label {
	font-size: 28rpx;
	font-weight: 600;
	color: #333;
}

.status-tag {
	font-size: 22rpx;
	padding: 4rpx 12rpx;
	border-radius: 12rpx;
}

.status-tag.active {
	background: #e8f5e9;
	color: #3cc51f;
}

.status-tag.consumed {
	background: #f5f5f5;
	color: #999;
}

.status-tag.expired {
	background: #ffebee;
	color: #ff6b6b;
}

.package-date {
	font-size: 22rpx;
	color: #999;
}

.package-body {
	margin-top: 12rpx;
}

.package-hours {
	display: flex;
	gap: 40rpx;
	margin-bottom: 16rpx;
}

.hours-item {
	display: flex;
	flex-direction: column;
}

.hours-item .label {
	font-size: 22rpx;
	color: #999;
	margin-bottom: 4rpx;
}

.hours-item .value {
	font-size: 28rpx;
	font-weight: 600;
	color: #333;
}

.hours-item .value.primary {
	color: #3cc51f;
}

.expire-info {
	display: flex;
	align-items: center;
	gap: 12rpx;
	padding-top: 16rpx;
	border-top: 1rpx solid #f0f0f0;
}

.expire-label {
	font-size: 24rpx;
	color: #666;
}

.expire-date {
	font-size: 24rpx;
	font-weight: 500;
	color: #333;
}

.expire-date.expired {
	color: #ff6b6b;
}

.expired-tag {
	font-size: 20rpx;
	background: #ffebee;
	color: #ff6b6b;
	padding: 2rpx 8rpx;
	border-radius: 10rpx;
}

.unlimited-info {
	padding-top: 16rpx;
	border-top: 1rpx solid #f0f0f0;
}

.unlimited-tag {
	font-size: 24rpx;
	background: #e8f5e9;
	color: #3cc51f;
	padding: 6rpx 16rpx;
	border-radius: 16rpx;
}
</style>