<template>
	<view class="container">
		<view class="header-bg">
			<view class="header-wave"></view>
		</view>
		
		<view class="nav-bar">
			<view class="back-button" @click="goBack">
				<text class="back-icon">‹</text>
			</view>
			<text class="nav-title">发送通知</text>
			<view class="nav-right"></view>
		</view>
		
		<view class="content">
			<view class="page-header">
				<view class="header-icon-wrapper">
					<text class="header-icon">📬</text>
				</view>
				<view class="header-text">
					<text class="header-main-title">发送通知消息</text>
					<text class="header-subtitle">精准触达每位家长</text>
				</view>
			</view>
			
			<view class="form-card">
				<view class="form-item">
					<view class="form-label">
						<text class="label-text">接收人</text>
						<text class="label-required">*</text>
					</view>
					<view class="receiver-box" @click="showStudentPicker = true">
						<view class="receiver-info">
							<text v-if="selectedStudents.length === 0" class="receiver-placeholder">请选择接收的学生家长</text>
							<text v-else class="receiver-text">已选择 {{ selectedStudents.length }} 位家长</text>
						</view>
						<view class="receiver-arrow">
							<text class="arrow-icon">›</text>
						</view>
					</view>
					<view v-if="selectedStudents.length > 0" class="selected-tags">
						<view v-for="studentId in selectedStudents" :key="studentId" class="tag-item">
							<text class="tag-text">{{ getStudentName(studentId) }}</text>
						</view>
					</view>
				</view>
				
				<view class="form-item">
					<view class="form-label">
						<text class="label-text">消息类型</text>
						<text class="label-required">*</text>
					</view>
					<view class="type-list">
						<view 
							v-for="type in messageTypes" 
							:key="type.value"
							class="type-item"
							:class="{ active: form.type === type.value }"
							@click="selectType(type.value)"
						>
							<view class="type-icon-box" :class="{ active: form.type === type.value }">
								<text class="type-icon">{{ type.icon }}</text>
							</view>
							<text class="type-name">{{ type.label }}</text>
							<view v-if="form.type === type.value" class="type-check">
								<text class="check-icon">✓</text>
							</view>
						</view>
					</view>
				</view>
				
				<view class="form-item">
					<view class="form-label">
						<text class="label-text">消息标题</text>
						<text class="label-required">*</text>
					</view>
					<view class="input-wrapper">
						<input 
							class="input-field" 
							v-model="form.title" 
							placeholder="请输入消息标题"
							placeholder-class="input-placeholder"
							maxlength="50"
						/>
						<text class="char-count">{{ form.title.length }}/50</text>
					</view>
				</view>
				
				<view class="form-item">
					<view class="form-label">
						<text class="label-text">消息内容</text>
						<text class="label-required">*</text>
					</view>
					<view class="textarea-wrapper">
						<textarea 
							class="textarea-field" 
							v-model="form.content" 
							placeholder="请输入详细的消息内容..."
							placeholder-class="input-placeholder"
							maxlength="500"
							:auto-height="true"
						/>
						<text class="char-count">{{ form.content.length }}/500</text>
					</view>
				</view>
				
				<view class="quick-tips">
					<view class="tips-title">💡 快速模板</view>
					<view class="tips-list">
						<view class="tip-item" @click="useTemplate('reminder')">
							<text class="tip-text">课程提醒</text>
						</view>
						<view class="tip-item" @click="useTemplate('notice')">
							<text class="tip-text">放假通知</text>
						</view>
						<view class="tip-item" @click="useTemplate('hours')">
							<text class="tip-text">课时提醒</text>
						</view>
					</view>
				</view>
				
				<button 
					class="submit-button" 
					@click="submit" 
					:loading="loading" 
					:disabled="loading"
				>
					<text v-if="!loading" class="submit-text">发送通知</text>
					<text v-else class="submit-text">发送中...</text>
				</button>
			</view>
		</view>
		
		<view v-if="showStudentPicker" class="picker-mask" @click="showStudentPicker = false">
			<view class="picker-modal" @click.stop>
				<view class="picker-header">
					<view class="picker-close" @click="showStudentPicker = false">
						<text class="close-text">取消</text>
					</view>
					<text class="picker-title">选择接收人</text>
					<view class="picker-confirm" @click="confirmStudents">
						<text class="confirm-text">确定</text>
					</view>
				</view>
				
				<view class="picker-search">
					<view class="search-box">
						<text class="search-icon">🔍</text>
						<input 
							class="search-input" 
							v-model="searchKeyword"
							placeholder="搜索学生姓名"
							placeholder-class="search-placeholder"
						/>
					</view>
				</view>
				
				<view class="picker-select-all" @click="toggleAll">
					<view class="select-all-box" :class="{ checked: allSelected }">
						<text v-if="allSelected" class="check-mark">✓</text>
					</view>
					<text class="select-all-text">全选</text>
					<text class="select-count">({{ filteredStudents.length }})</text>
				</view>
				
				<scroll-view class="picker-list" scroll-y>
					<view 
						v-for="student in filteredStudents" 
						:key="student._id"
						class="picker-item"
						@click="toggleStudent(student._id)"
					>
						<view class="student-avatar">
							<text class="avatar-text">{{ student.name.charAt(0) }}</text>
						</view>
						<view class="student-detail">
							<text class="student-name">{{ student.name }}</text>
							<text class="student-parent">{{ student.parent_name }} - {{ student.parent_mobile }}</text>
						</view>
						<view class="student-hours" :class="{ low: student.remaining_hours < 10 }">
							<text class="hours-text">{{ student.remaining_hours }} 课时</text>
						</view>
						<view class="check-box" :class="{ checked: isStudentSelected(student._id) }">
							<text v-if="isStudentSelected(student._id)" class="check-icon">✓</text>
						</view>
					</view>
				</scroll-view>
			</view>
		</view>
	</view>
</template>

<script>
import { studentAPI, notificationAPI } from '@/utils/api.js'
import { STORAGE_KEYS } from '@/utils/common.js'
import { getShareConfig, getTimelineConfig } from '@/utils/share.js'

export default {
	data() {
		return {
			form: {
				type: 'class_reminder',
				title: '',
				content: ''
			},
			messageTypes: [
				{ value: 'class_reminder', label: '课程提醒', icon: '📅' },
				{ value: 'hours_reminder', label: '课时提醒', icon: '⏱️' },
				{ value: 'notice', label: '通知公告', icon: '📢' },
				{ value: 'other', label: '其他消息', icon: '💬' }
			],
			students: [],
			selectedStudents: [],
			showStudentPicker: false,
			searchKeyword: '',
			loading: false,
			isSubmitting: false
		}
	},
	
	computed: {
		filteredStudents() {
			if (!this.searchKeyword) {
				return this.students
			}
			return this.students.filter(s => 
				s.name.toLowerCase().includes(this.searchKeyword.toLowerCase())
			)
		},
		allSelected() {
			return this.filteredStudents.length > 0 && 
				this.filteredStudents.every(s => this.selectedStudents.includes(s._id))
		}
	},
	
	onLoad() {
		this.loadStudents()
	},
	
	onShareAppMessage() {
		return getShareConfig('/pages/coach/notification-send/notification-send', '欣兰体育 - 发送消息')
	},
	
	onShareTimeline() {
		return getTimelineConfig('欣兰体育')
	},
	
	methods: {
		goBack() {
			uni.navigateBack()
		},
		
		async loadStudents() {
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
			}
		},
		
		selectType(type) {
			this.form.type = type
		},
		
		getStudentName(studentId) {
			const student = this.students.find(s => s._id === studentId)
			return student ? student.name : ''
		},
		
		isStudentSelected(studentId) {
			return this.selectedStudents.includes(studentId)
		},
		
		toggleStudent(studentId) {
			const index = this.selectedStudents.indexOf(studentId)
			if (index > -1) {
				this.selectedStudents.splice(index, 1)
			} else {
				this.selectedStudents.push(studentId)
			}
		},
		
		toggleAll() {
			if (this.allSelected) {
				const filteredIds = this.filteredStudents.map(s => s._id)
				this.selectedStudents = this.selectedStudents.filter(id => !filteredIds.includes(id))
			} else {
				const newIds = this.filteredStudents.map(s => s._id)
				this.selectedStudents = [...new Set([...this.selectedStudents, ...newIds])]
			}
		},
		
		confirmStudents() {
			this.showStudentPicker = false
		},
		
		useTemplate(type) {
			if (type === 'reminder') {
				this.form.type = 'class_reminder'
				this.form.title = '课程提醒'
				this.form.content = '尊敬的家长您好，本周课程照常进行，请准时带孩子参加，如有特殊情况请提前请假。'
			} else if (type === 'notice') {
				this.form.type = 'notice'
				this.form.title = '放假通知'
				this.form.content = '尊敬的家长您好，因节假日安排，本周末课程暂停，后续课程时间另行通知，请留意群消息。'
			} else if (type === 'hours') {
				this.form.type = 'hours_reminder'
				this.form.title = '课时提醒'
				this.form.content = '尊敬的家长您好，您孩子的课时即将用完，请及时续费以保证正常上课。'
			}
		},
		
		async submit() {
			if (this.selectedStudents.length === 0) {
				uni.showToast({
					title: '请选择接收人',
					icon: 'none'
				})
				return
			}
			
			if (!this.form.title) {
				uni.showToast({
					title: '请输入消息标题',
					icon: 'none'
				})
				return
			}
			
			if (!this.form.content) {
				uni.showToast({
					title: '请输入消息内容',
					icon: 'none'
				})
				return
			}
			
			if (this.isSubmitting) return
			
			this.isSubmitting = true
			this.loading = true
			
			try {
				const parentUserIds = this.students
					.filter(s => this.selectedStudents.includes(s._id))
					.map(s => s.parent_user_id)
					.filter(id => id && id !== '')
				
				if (parentUserIds.length === 0) {
					uni.showToast({
						title: '未找到有效的家长用户',
						icon: 'none'
					})
					this.loading = false
					this.isSubmitting = false
					return
				}
				
				await notificationAPI.send(
					parentUserIds,
					this.form.title,
					this.form.content,
					this.form.type
				)
				
				uni.showToast({
					title: '发送成功',
					icon: 'success'
				})
				
				setTimeout(() => {
					uni.navigateBack()
				}, 1500)
			} catch (e) {
				console.error('发送失败:', e)
				uni.showToast({
					title: e.message || '发送失败',
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
.container {
	min-height: 100vh;
	background: #f5f7fa;
	position: relative;
}

.header-bg {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 320rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	overflow: hidden;
}

.header-wave {
	position: absolute;
	bottom: -2rpx;
	left: 0;
	right: 0;
	height: 60rpx;
	background: #f5f7fa;
	border-radius: 40rpx 40rpx 0 0;
}

.nav-bar {
	position: relative;
	z-index: 10;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 100rpx 32rpx 20rpx;
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

.content {
	position: relative;
	z-index: 5;
	padding: 0 32rpx 40rpx;
}

.page-header {
	display: flex;
	align-items: center;
	gap: 24rpx;
	margin-bottom: 32rpx;
}

.header-icon-wrapper {
	width: 96rpx;
	height: 96rpx;
	background: #ffffff;
	border-radius: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.header-icon {
	font-size: 48rpx;
}

.header-text {
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}

.header-main-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #262626;
}

.header-subtitle {
	font-size: 24rpx;
	color: #8e8e8e;
}

.form-card {
	background: #ffffff;
	border-radius: 24rpx;
	padding: 40rpx 32rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.form-item {
	margin-bottom: 40rpx;
}

.form-item:last-of-type {
	margin-bottom: 0;
}

.form-label {
	display: flex;
	align-items: center;
	margin-bottom: 16rpx;
}

.label-text {
	font-size: 28rpx;
	font-weight: 500;
	color: #262626;
}

.label-required {
	color: #ff4d4f;
	font-size: 28rpx;
	margin-left: 4rpx;
}

.receiver-box {
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: #f8f9fa;
	border-radius: 16rpx;
	padding: 28rpx 24rpx;
	border: 2rpx solid transparent;
	transition: all 0.2s;
}

.receiver-box:active {
	background: #f0f2f5;
}

.receiver-info {
	flex: 1;
}

.receiver-placeholder {
	font-size: 28rpx;
	color: #bfbfbf;
}

.receiver-text {
	font-size: 28rpx;
	color: #262626;
	font-weight: 500;
}

.receiver-arrow {
	margin-left: 16rpx;
}

.arrow-icon {
	font-size: 40rpx;
	color: #bfbfbf;
	line-height: 1;
}

.selected-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 16rpx;
}

.tag-item {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 20rpx;
	padding: 8rpx 20rpx;
}

.tag-text {
	font-size: 22rpx;
	color: #ffffff;
}

.type-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.type-item {
	display: flex;
	align-items: center;
	background: #f8f9fa;
	border-radius: 16rpx;
	padding: 24rpx;
	border: 2rpx solid transparent;
	transition: all 0.2s;
}

.type-item.active {
	background: #f5f7ff;
	border-color: #667eea;
}

.type-icon-box {
	width: 72rpx;
	height: 72rpx;
	background: #e8eaf6;
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 20rpx;
	transition: all 0.2s;
}

.type-icon-box.active {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.type-icon {
	font-size: 36rpx;
}

.type-name {
	flex: 1;
	font-size: 28rpx;
	color: #262626;
}

.type-check {
	width: 40rpx;
	height: 40rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.check-icon {
	font-size: 20rpx;
	color: #ffffff;
	line-height: 1;
}

.input-wrapper {
	position: relative;
	background: #f8f9fa;
	border-radius: 16rpx;
	padding: 28rpx 24rpx;
}

.input-field {
	width: 100%;
	font-size: 28rpx;
	color: #262626;
	padding-right: 80rpx;
}

.input-placeholder {
	color: #bfbfbf;
}

.textarea-wrapper {
	position: relative;
	background: #f8f9fa;
	border-radius: 16rpx;
	padding: 24rpx;
	min-height: 240rpx;
}

.textarea-field {
	width: 100%;
	font-size: 28rpx;
	color: #262626;
	min-height: 180rpx;
	padding-right: 80rpx;
}

.char-count {
	position: absolute;
	right: 24rpx;
	bottom: 24rpx;
	font-size: 22rpx;
	color: #bfbfbf;
}

.quick-tips {
	margin-top: 40rpx;
	padding-top: 40rpx;
	border-top: 1rpx solid #f0f0f0;
}

.tips-title {
	font-size: 26rpx;
	color: #8e8e8e;
	margin-bottom: 16rpx;
}

.tips-list {
	display: flex;
	gap: 16rpx;
}

.tip-item {
	background: #f0f7ff;
	border-radius: 12rpx;
	padding: 16rpx 24rpx;
}

.tip-text {
	font-size: 24rpx;
	color: #1890ff;
}

.submit-button {
	width: 100%;
	height: 96rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border: none;
	border-radius: 24rpx;
	margin-top: 48rpx;
	box-shadow: 0 12rpx 32rpx rgba(102, 126, 234, 0.35);
	transition: all 0.2s;
}

.submit-button:active {
	transform: scale(0.98);
	opacity: 0.9;
}

.submit-button::after {
	border: none;
}

.submit-text {
	font-size: 32rpx;
	font-weight: 600;
	color: #ffffff;
}

.picker-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: flex-end;
	z-index: 1000;
	animation: fadeIn 0.2s;
}

@keyframes fadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

.picker-modal {
	width: 100%;
	background: #ffffff;
	border-radius: 32rpx 32rpx 0 0;
	max-height: 85vh;
	display: flex;
	flex-direction: column;
	animation: slideUp 0.3s;
}

@keyframes slideUp {
	from {
		transform: translateY(100%);
	}
	to {
		transform: translateY(0);
	}
}

.picker-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 32rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.picker-close {
	padding: 8rpx 8rpx;
}

.close-text {
	font-size: 28rpx;
	color: #8e8e8e;
}

.picker-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #262626;
}

.picker-confirm {
	padding: 8rpx 8rpx;
}

.confirm-text {
	font-size: 28rpx;
	color: #667eea;
	font-weight: 500;
}

.picker-search {
	padding: 24rpx 32rpx;
	background: #fafafa;
}

.search-box {
	display: flex;
	align-items: center;
	background: #ffffff;
	border-radius: 16rpx;
	padding: 20rpx 24rpx;
	gap: 12rpx;
}

.search-icon {
	font-size: 28rpx;
}

.search-input {
	flex: 1;
	font-size: 28rpx;
	color: #262626;
}

.search-placeholder {
	color: #bfbfbf;
}

.picker-select-all {
	display: flex;
	align-items: center;
	gap: 12rpx;
	padding: 24rpx 32rpx;
	border-bottom: 1rpx solid #f5f5f5;
	background: #fafafa;
}

.select-all-box {
	width: 40rpx;
	height: 40rpx;
	border: 2rpx solid #d9d9d9;
	border-radius: 8rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s;
}

.select-all-box.checked {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-color: transparent;
}

.select-all-text {
	font-size: 28rpx;
	color: #262626;
	font-weight: 500;
}

.select-count {
	font-size: 24rpx;
	color: #8e8e8e;
}

.picker-list {
	flex: 1;
	overflow-y: auto;
}

.picker-item {
	display: flex;
	align-items: center;
	gap: 20rpx;
	padding: 24rpx 32rpx;
	border-bottom: 1rpx solid #f5f5f5;
}

.student-avatar {
	width: 80rpx;
	height: 80rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.avatar-text {
	font-size: 32rpx;
	color: #ffffff;
	font-weight: 600;
}

.student-detail {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 6rpx;
	min-width: 0;
}

.student-name {
	font-size: 28rpx;
	color: #262626;
	font-weight: 500;
}

.student-parent {
	font-size: 22rpx;
	color: #8e8e8e;
}

.student-hours {
	background: #f6ffed;
	border-radius: 12rpx;
	padding: 8rpx 16rpx;
	flex-shrink: 0;
}

.student-hours.low {
	background: #fff1f0;
}

.hours-text {
	font-size: 22rpx;
	color: #52c41a;
	font-weight: 500;
}

.student-hours.low .hours-text {
	color: #ff4d4f;
}

.check-box {
	width: 44rpx;
	height: 44rpx;
	border: 2rpx solid #d9d9d9;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s;
	flex-shrink: 0;
}

.check-box.checked {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-color: transparent;
}
</style>
