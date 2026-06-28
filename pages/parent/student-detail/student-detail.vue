<template>
	<view class="container">
		<view class="header">
			<view class="student-info">
				<view class="avatar-placeholder">{{ student.name ? student.name.charAt(0) : '?' }}</view>
				<view class="info">
					<view class="name">{{ student.name || '加载中...' }}</view>
					<view class="level">{{ getLevelLabel(student.level) }}</view>
				</view>
			</view>
		</view>
		
		<view class="hours-card">
			<view class="hours-row">
				<view class="hours-column">
					<view class="hours-item">
						<text class="label">剩余课时</text>
						<text class="value primary">{{ (student.remaining_hours || 0) + (student.remaining_days || 0) + (student.remaining_private_hours || 0) }}</text>
					</view>
					<view class="hours-item">
						<text class="label">剩余节数</text>
						<text class="value primary">{{ student.remaining_hours }}</text>
					</view>
					<view class="hours-item">
						<text class="label">剩余天数</text>
						<text class="value primary">{{ student.remaining_days || 0 }}</text>
					</view>
					<view class="hours-item">
						<text class="label">剩余私教</text>
						<text class="value primary">{{ student.remaining_private_hours || 0 }}</text>
					</view>
				</view>
				<view class="hours-column">
					<view class="hours-item">
						<text class="label">已用课时</text>
						<text class="value">{{ (student.used_hours || 0) + (student.used_days || 0) + (student.used_private_hours || 0) }}</text>
					</view>
					<view class="hours-item">
						<text class="label">已用节数</text>
						<text class="value">{{ student.used_hours }}</text>
					</view>
					<view class="hours-item">
						<text class="label">已用天数</text>
						<text class="value">{{ student.used_days || 0 }}</text>
					</view>
					<view class="hours-item">
						<text class="label">已用私教</text>
						<text class="value">{{ student.used_private_hours || 0 }}</text>
					</view>
				</view>
			</view>
		</view>
		
		<view class="section">
			<view class="section-title">基本信息</view>
			<view class="info-list">
				<view class="info-item">
					<text class="label">性别</text>
					<text class="value">{{ student.gender === 'male' ? '男' : '女' }}</text>
				</view>
				<view class="info-item">
					<text class="label">出生日期</text>
					<text class="value">{{ formatDate(student.birth_date) }}</text>
				</view>
				
				<view class="info-item">
					<text class="label">家长手机号</text>
					<text class="value">{{ student.parent_mobile || '未填写' }}</text>
				</view>
			</view>
		</view>
		
		<view class="section">
			<view class="section-title">最近上课记录</view>
			<view v-if="records.length === 0" class="empty">
				<image src="/static/images/icon-empty-record.png" class="empty-icon" mode="aspectFit"></image>
				<text class="empty-text">暂无上课记录</text>
			</view>
			<view v-else class="record-list">
				<view 
					v-for="record in records" 
					:key="record._id" 
					class="record-item"
					@click="goToClassDetail(record.course_id)"
				>
					<view class="record-left">
						<view class="record-date-box">
							<text class="record-day">{{ getDay(record.create_time) }}</text>
							<text class="record-month">{{ getMonth(record.create_time) }}</text>
						</view>
					</view>
					<view class="record-main">
						<view class="record-title">{{ getRecordTitle(record) }}</view>
						<view class="record-time">{{ formatDateTime(record.create_time) }}</view>
					</view>
					<view class="record-right">
						<text class="record-hours" :class="{ consume: record.type === 'consume' || record.type === 'expire' }">
							{{ getRecordSign(record) }}{{ getRecordQuantity(record) }}{{ getRecordUnitText(record) }}
						</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { studentAPI, hoursAPI } from '@/utils/api.js'
import { getLevelLabel, formatDate } from '@/utils/common.js'
import { getShareConfig, getTimelineConfig } from '@/utils/share.js'

export default {
	data() {
		return {
			studentId: '',
			student: {},
			records: [],
			loading: false
		}
	},
	
	onLoad(options) {
		if (options.id) {
			this.studentId = options.id
			this.loadStudentDetail(this.studentId)
			this.loadRecords(this.studentId)
		}
	},
	
	onShow() {
		if (this.studentId) {
			this.loadStudentDetail(this.studentId)
			this.loadRecords(this.studentId)
		}
	},
	
	onShareAppMessage() {
		const title = this.student.name ? `欣兰体育 - ${this.student.name}的课时` : '欣兰体育 - 学生详情'
		return getShareConfig('/pages/parent/student-detail/student-detail', title)
	},
	
	onShareTimeline() {
		const title = this.student.name ? `欣兰体育 - ${this.student.name}的课时` : '欣兰体育'
		return getTimelineConfig(title)
	},
	
	methods: {
		async loadStudentDetail(id) {
			this.loading = true
			
			try {
				const res = await studentAPI.getDetail(id)
				this.student = res.data
			} catch (e) {
				console.error('加载学生详情失败:', e)
			} finally {
				this.loading = false
			}
		},
		
		async loadRecords(studentId) {
			try {
				const res = await hoursAPI.getRecords({
					student_id: studentId,
					page: 1,
					pageSize: 10
				})
				
				// 确保只存储当前学生的记录
				this.records = res.data.list.filter(record => record.student_id === studentId)
			} catch (e) {
				console.error('加载课时记录失败:', e)
			}
		},
		
		goToClassDetail(courseId) {
			if (courseId) {
				uni.navigateTo({
					url: `/pages/parent/class-detail/class-detail?id=${courseId}`
				})
			}
		},
		
		parseDate(dateValue) {
			// 处理时间戳（数字或字符串）
			if (typeof dateValue === 'number' || !isNaN(Number(dateValue))) {
				return new Date(Number(dateValue))
			}
			// 处理字符串日期
			return new Date(dateValue)
		},
		
		getDay(dateStr) {
			const date = this.parseDate(dateStr)
			if (isNaN(date.getTime())) return '--'
			return String(date.getDate()).padStart(2, '0')
		},
		
		getMonth(dateStr) {
			const date = this.parseDate(dateStr)
			if (isNaN(date.getTime())) return '--'
			const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
			return months[date.getMonth()]
		},
		
		formatDateTime(dateStr) {
			const date = this.parseDate(dateStr)
			if (isNaN(date.getTime())) return '--'
			const year = date.getFullYear()
			const month = String(date.getMonth() + 1).padStart(2, '0')
			const day = String(date.getDate()).padStart(2, '0')
			const hours = String(date.getHours()).padStart(2, '0')
			const minutes = String(date.getMinutes()).padStart(2, '0')
			return `${year}-${month}-${day} ${hours}:${minutes}`
		},

		getRecordQuantity(record) {
			const unit = record.unit || 'lesson'
			if (unit === 'day') return record.days || 0
			if (unit === 'private') return record.private_hours || 0
			return record.hours || 0
		},

		getRecordUnitText(record) {
			const unit = record.unit || 'lesson'
			if (unit === 'day') return '天'
			if (unit === 'private') return '私教'
			return '课时'
		},
		
		getRecordTitle(record) {
			const type = record.type || 'add'
			if (type === 'consume') return '上课消耗'
			if (type === 'expire') return '到期扣除'
			return '课时充值'
		},
		
		getRecordSign(record) {
			const type = record.type || 'add'
			return type === 'consume' || type === 'expire' ? '-' : '+'
		},
		
		getLevelLabel,
		formatDate
	}
}
</script>

<style scoped>
.container {
	min-height: 100vh;
	background: #fafafa;
}

.header {
	background: #ffffff;
	padding: 40rpx 32rpx;
	border-bottom: 1rpx solid #efefef;
}

.student-info {
	display: flex;
	align-items: center;
}

.avatar-placeholder {
	width: 100rpx;
	height: 100rpx;
	border-radius: 50%;
	background: #f5f5f5;
	color: #262626;
	font-size: 40rpx;
	font-weight: 600;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 20rpx;
}

.name {
	font-size: 32rpx;
	font-weight: 600;
	color: #262626;
	margin-bottom: 8rpx;
}

.level {
	font-size: 24rpx;
	color: #8e8e8e;
}

.hours-card {
		background: #ffffff;
		margin: 16rpx;
		border-radius: 16rpx;
		padding: 24rpx;
		border: 1rpx solid #efefef;
	}

	.hours-row {
		display: flex;
		justify-content: space-between;
	}

	.hours-column {
		flex: 1;
		padding: 0 10rpx;
	}

	.hours-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 16rpx 0;
	}

	.hours-item .label {
		font-size: 22rpx;
		color: #8e8e8e;
		margin-bottom: 8rpx;
	}

	.hours-item .value {
		font-size: 40rpx;
		font-weight: 600;
		color: #262626;
	}

	.hours-item .value.primary {
		color: #0095f6;
		font-weight: 700;
	}

.section {
	background: #ffffff;
	margin: 16rpx;
	border-radius: 16rpx;
	padding: 24rpx;
	border: 1rpx solid #efefef;
}

.section-title {
	font-size: 28rpx;
	font-weight: 600;
	color: #262626;
	margin-bottom: 20rpx;
}

.info-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.info-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.info-item .label {
	font-size: 26rpx;
	color: #8e8e8e;
}

.info-item .value {
	font-size: 26rpx;
	color: #262626;
}

.empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 60rpx 0;
}

.empty-icon {
	width: 100rpx;
	height: 100rpx;
	margin-bottom: 16rpx;
	opacity: 0.5;
}

.empty-text {
	font-size: 26rpx;
	color: #8e8e8e;
}

.record-list {
	display: flex;
	flex-direction: column;
}

.record-item {
	display: flex;
	align-items: center;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #efefef;
	transition: all 0.2s ease;
}

.record-item:last-child {
	border-bottom: none;
}

.record-item:active {
	background: #f9f9f9;
}

.record-left {
	margin-right: 20rpx;
}

.record-date-box {
	width: 80rpx;
	height: 80rpx;
	background: #f5f5f5;
	border-radius: 12rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.record-day {
	font-size: 28rpx;
	font-weight: 600;
	color: #262626;
}

.record-month {
	font-size: 20rpx;
	color: #8e8e8e;
}

.record-main {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}

.record-title {
	font-size: 28rpx;
	font-weight: 500;
	color: #262626;
}

.record-time {
	font-size: 22rpx;
	color: #8e8e8e;
}

.record-right {
	margin-left: 16rpx;
}

.record-hours {
	font-size: 26rpx;
	font-weight: 600;
	color: #4caf50;
}

.record-hours.consume {
	color: #ef5350;
}
</style>
