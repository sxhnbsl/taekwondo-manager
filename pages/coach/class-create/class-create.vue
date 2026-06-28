<template>
	<view class="container">
		<view class="header">
			<view class="header-left">
				<text class="back-icon" @click="goBack">←</text>
				<text class="title">创建课程</text>
			</view>
		</view>
		
		<view class="form">
			<view class="form-item">
				<view class="label-wrapper">
					<text class="label">课程标题</text>
					<text class="required">*</text>
				</view>
				<input 
					class="input" 
					v-model="form.title" 
					placeholder="请输入课程标题"
					placeholder-class="placeholder"
				/>
			</view>
			
			<view class="form-item">
				<view class="label-wrapper">
					<text class="label">上课日期</text>
					<text class="required">*</text>
				</view>
				<picker 
					mode="date" 
					:value="form.date" 
					@change="onDateChange"
				>
					<view class="picker">
						<text class="picker-icon">📅</text>
						<text class="picker-text">{{ form.date ? formatDate(form.date) : '请选择上课日期' }}</text>
					</view>
				</picker>
			</view>
			
			<view class="form-row">
				<view class="form-item half">
					<view class="label-wrapper">
						<text class="label">开始时间</text>
						<text class="required">*</text>
					</view>
					<picker 
						mode="time" 
						:value="form.start_time" 
						@change="onStartTimeChange"
					>
						<view class="picker">
							<text class="picker-icon">⏰</text>
							<text class="picker-text">{{ form.start_time || '请选择' }}</text>
						</view>
					</picker>
				</view>
				<view class="form-item half">
					<view class="label-wrapper">
						<text class="label">结束时间</text>
						<text class="required">*</text>
					</view>
					<picker 
						mode="time" 
						:value="form.end_time" 
						@change="onEndTimeChange"
					>
						<view class="picker">
							<text class="picker-icon">⏰</text>
							<text class="picker-text">{{ form.end_time || '请选择' }}</text>
						</view>
					</picker>
				</view>
			</view>
			
			<view class="form-item">
				<view class="label-wrapper">
					<text class="label">上课地点</text>
				</view>
				<input 
					class="input" 
					v-model="form.location" 
					placeholder="请输入上课地点"
					placeholder-class="placeholder"
				/>
			</view>
			
			<view class="form-item">
				<view class="label-wrapper">
					<text class="label">课程内容</text>
				</view>
				<textarea 
					class="textarea" 
					v-model="form.content" 
					placeholder="请输入课程内容"
					placeholder-class="placeholder"
					:maxlength="500"
				></textarea>
			</view>
			
			<view class="form-item">
				<view class="label-wrapper">
					<text class="label">参与学生</text>
					<text class="count">({{ selectedStudents.length }})</text>
				</view>
				<view class="student-selector">
					<view 
						v-for="student in students" 
						:key="student._id"
						class="student-tag"
						:class="{ selected: selectedStudents.includes(student._id) }"
						@click="toggleStudent(student._id)"
					>
						<text class="student-name">{{ student.name }}</text>
						<text v-if="selectedStudents.includes(student._id)" class="check-icon">✓</text>
					</view>
					<view v-if="students.length === 0" class="empty-students">
						<text>暂无学生，请先添加学生</text>
					</view>
				</view>
			</view>
		</view>
		
		<view class="actions">
			<button class="action-btn cancel" @click="goBack" :disabled="loading">
				<text>取消</text>
			</button>
			<button class="action-btn submit" @click="handleSubmit" :loading="loading" :disabled="loading">
				<text v-if="!loading">创建课程</text>
				<text v-else>创建中...</text>
			</button>
		</view>
	</view>
</template>

<script>
import { courseAPI, studentAPI } from '@/utils/api.js'

export default {
	data() {
		return {
			loading: false,
			isSubmitting: false,
			students: [],
			selectedStudents: [],
			form: {
				title: '',
				date: '',
				start_time: '',
				end_time: '',
				location: '',
				content: ''
			}
		}
	},
	
	onLoad() {
		this.loadStudents()
	},
	
	methods: {
		formatDate(date, format = 'YYYY-MM-DD') {
			if (!date) return ''
			
			const d = new Date(date)
			const year = d.getFullYear()
			const month = String(d.getMonth() + 1).padStart(2, '0')
			const day = String(d.getDate()).padStart(2, '0')
			const hour = String(d.getHours()).padStart(2, '0')
			const minute = String(d.getMinutes()).padStart(2, '0')
			
			switch(format) {
				case 'YYYY-MM-DD':
					return `${year}-${month}-${day}`
				case 'YYYY-MM-DD HH:mm':
					return `${year}-${month}-${day} ${hour}:${minute}`
				case 'HH:mm':
					return `${hour}:${minute}`
				case 'MM-DD HH:mm':
					return `${month}-${day} ${hour}:${minute}`
				default:
					return `${year}-${month}-${day}`
			}
		},
		
		async loadStudents() {
			try {
				const res = await studentAPI.getList({
					page: 1,
					pageSize: 100
				})
				this.students = res.data.list
			} catch (e) {
				console.error('加载学生列表失败:', e)
			}
		},
		
		toggleStudent(studentId) {
			const index = this.selectedStudents.indexOf(studentId)
			if (index > -1) {
				this.selectedStudents.splice(index, 1)
			} else {
				this.selectedStudents.push(studentId)
			}
		},
		
		onDateChange(e) {
			this.form.date = e.detail.value
		},
		
		onStartTimeChange(e) {
			this.form.start_time = e.detail.value
		},
		
		onEndTimeChange(e) {
			this.form.end_time = e.detail.value
		},
		
		async handleSubmit() {
			if (!this.form.title || !this.form.date || !this.form.start_time || !this.form.end_time) {
				uni.showToast({
					title: '请填写必填项',
					icon: 'none'
				})
				return
			}
			
			if (this.selectedStudents.length === 0) {
				uni.showToast({
					title: '请选择学生',
					icon: 'none'
				})
				return
			}
			
			if (this.isSubmitting) return
			
			this.isSubmitting = true
			this.loading = true
			
			try {
				await courseAPI.create({
					title: this.form.title,
					date: this.form.date,
					start_time: this.form.start_time,
					end_time: this.form.end_time,
					location: this.form.location,
					content: this.form.content,
					student_ids: this.selectedStudents
				})
				
				uni.showToast({
					title: '创建成功',
					icon: 'success'
				})
				
				setTimeout(() => {
					uni.navigateBack()
				}, 1500)
			} catch (e) {
				console.error('创建课程失败:', e)
			} finally {
				this.loading = false
				this.isSubmitting = false
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
	background: #f5f7fa;
}

.header {
	background: #ffffff;
	padding: 30rpx 40rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
	position: sticky;
	top: 0;
	z-index: 100;
}

.header-left {
	display: flex;
	align-items: center;
	gap: 20rpx;
}

.back-icon {
	font-size: 48rpx;
	color: #333;
	font-weight: bold;
	padding: 10rpx;
	margin-left: -20rpx;
}

.title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
}

.form {
	background: #ffffff;
	margin: 20rpx;
	border-radius: 20rpx;
	padding: 40rpx;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.form-row {
	display: flex;
	gap: 20rpx;
}

.form-item {
	margin-bottom: 40rpx;
}

.form-item.half {
	flex: 1;
}

.label-wrapper {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
}

.label {
	font-size: 28rpx;
	color: #333;
	font-weight: bold;
}

.required {
	color: #ff6b6b;
	margin-left: 8rpx;
	font-size: 32rpx;
}

.count {
	color: #999;
	margin-left: 8rpx;
	font-size: 24rpx;
}

.input {
	width: 100%;
	height: 88rpx;
	background: #fafafa;
	border-radius: 12rpx;
	padding: 0 24rpx;
	font-size: 28rpx;
	border: 1rpx solid #dbdbdb;
	transition: all 0.2s ease;
	box-sizing: border-box;
}

.input:focus {
	border-color: #a8a8a8;
	background: #ffffff;
}

.textarea {
	width: 100%;
	min-height: 200rpx;
	background: #fafafa;
	border-radius: 12rpx;
	padding: 20rpx 24rpx;
	font-size: 28rpx;
	line-height: 1.6;
	border: 1rpx solid #dbdbdb;
	transition: all 0.2s ease;
	box-sizing: border-box;
}

.textarea:focus {
	border-color: #a8a8a8;
	background: #ffffff;
}

.placeholder {
	color: #999;
}

.picker {
	width: 100%;
	height: 88rpx;
	background: #f5f7fa;
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10rpx;
	font-size: 28rpx;
	color: #333;
	border: 2rpx solid transparent;
	transition: border-color 0.3s;
}

.picker-icon {
	font-size: 32rpx;
}

.picker-text {
	font-size: 28rpx;
}

.student-selector {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
}

.student-tag {
	display: flex;
	align-items: center;
	padding: 16rpx 24rpx;
	background: #f5f7fa;
	border-radius: 20rpx;
	border: 2rpx solid transparent;
	transition: all 0.3s;
}

.student-tag.selected {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-color: #667eea;
	box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
}

.student-tag.selected .student-name {
	color: #ffffff;
}

.student-name {
	font-size: 26rpx;
	color: #666;
}

.check-icon {
	margin-left: 10rpx;
	color: #ffffff;
	font-size: 24rpx;
	font-weight: bold;
}

.empty-students {
	width: 100%;
	padding: 40rpx;
	text-align: center;
	color: #999;
	font-size: 26rpx;
	background: #f5f7fa;
	border-radius: 16rpx;
}

.actions {
	background: #ffffff;
	padding: 30rpx;
	display: flex;
	gap: 20rpx;
	box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
	position: sticky;
	bottom: 0;
	z-index: 100;
}

.action-btn {
	flex: 1;
	height: 88rpx;
	border-radius: 16rpx;
	font-size: 32rpx;
	font-weight: bold;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: transform 0.2s;
}

.action-btn::after {
	border: none;
}

.action-btn:active {
	transform: scale(0.95);
}

.action-btn.cancel {
	background: #f5f7fa;
	color: #666;
}

.action-btn.submit {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: #ffffff;
	box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
}

.action-btn[disabled] {
	opacity: 0.6;
	pointer-events: none;
}

.action-btn.submit[disabled] {
	background: #d0d0d0;
	box-shadow: none;
}
</style>
