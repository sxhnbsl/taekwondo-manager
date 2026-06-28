<template>
	<view class="container">
		<view class="header">
			<text class="title">编辑课程</text>
		</view>
		
		<view class="form">
			<view class="form-item">
				<text class="label">课程标题 *</text>
				<input 
					class="input" 
					v-model="form.title" 
					placeholder="请输入课程标题"
					placeholder-class="placeholder"
				/>
			</view>
			
			<view class="form-item">
				<text class="label">上课日期 *</text>
				<picker 
					mode="date" 
					:value="form.date" 
					@change="onDateChange"
				>
					<view class="picker">
						{{ form.date ? formatDate(form.date) : '请选择上课日期' }}
					</view>
				</picker>
			</view>
			
			<view class="form-row">
				<view class="form-item half">
					<text class="label">开始时间 *</text>
					<picker 
						mode="time" 
						:value="form.start_time" 
						@change="onStartTimeChange"
					>
						<view class="picker">
							{{ form.start_time || '请选择' }}
						</view>
					</picker>
				</view>
				<view class="form-item half">
					<text class="label">结束时间 *</text>
					<picker 
						mode="time" 
						:value="form.end_time" 
						@change="onEndTimeChange"
					>
						<view class="picker">
							{{ form.end_time || '请选择' }}
						</view>
					</picker>
				</view>
			</view>
			
			<view class="form-item">
				<text class="label">上课地点</text>
				<input 
					class="input" 
					v-model="form.location" 
					placeholder="请输入上课地点"
					placeholder-class="placeholder"
				/>
			</view>
			
			<view class="form-item">
				<text class="label">课程内容</text>
				<textarea 
					class="textarea" 
					v-model="form.content" 
					placeholder="请输入课程内容"
					placeholder-class="placeholder"
					:maxlength="500"
				></textarea>
			</view>
			
			<view class="form-item">
				<text class="label">课程状态</text>
				<view class="status-tabs">
					<view 
						class="status-tab" 
						:class="{ active: form.status === 'ongoing' }"
						@click="form.status = 'ongoing'"
					>
						进行中
					</view>
					<view 
						class="status-tab" 
						:class="{ active: form.status === 'completed' }"
						@click="form.status = 'completed'"
					>
						已完成
					</view>
				</view>
			</view>
			
			<view class="form-item">
				<text class="label">参与学生</text>
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
				</view>
			</view>
		</view>
		
		<view class="actions">
			<button class="action-btn cancel" @click="goBack">取消</button>
			<button class="action-btn submit" @click="handleSubmit" :loading="loading">
				保存
			</button>
		</view>
		
		<view class="media-section">
			<view class="section-header">
				<text class="section-title">课程照片</text>
				<button class="upload-btn" @click="goToUpload">➕ 上传照片</button>
			</view>
			<view v-if="mediaList.length === 0" class="empty">
				<text>暂无照片</text>
			</view>
			<view v-else class="media-list">
				<view 
					v-for="media in mediaList" 
					:key="media._id" 
					class="media-item"
				>
					<image 
						class="media-image" 
						:src="media.url" 
						mode="aspectFill"
						@click="previewImage(media.url)"
					></image>
					<view class="media-desc">{{ media.description || '无描述' }}</view>
					<button class="delete-btn" @click="deleteMedia(media)">删除</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { courseAPI, studentAPI, mediaAPI } from '@/utils/api.js'
import { formatDate, formatDuration } from '@/utils/common.js'

export default {
	data() {
		return {
			courseId: '',
			loading: false,
			isSubmitting: false,
			students: [],
			selectedStudents: [],
			mediaList: [],
			form: {
				title: '',
				date: '',
				start_time: '',
				end_time: '',
				location: '',
				content: '',
				status: 'ongoing'
			}
		}
	},
	
	onLoad(options) {
		if (options.id) {
			this.courseId = options.id
			this.loadCourseDetail(options.id)
		}
		this.loadStudents()
	},
	
	methods: {
		async loadCourseDetail(courseId) {
			try {
				const res = await courseAPI.getDetail(courseId)
				this.form = {
					title: res.data.title,
					date: res.data.date,
					start_time: res.data.start_time,
					end_time: res.data.end_time,
					location: res.data.location,
					content: res.data.content,
					status: res.data.status
				}
				
				if (res.data.student_ids) {
					this.selectedStudents = [...res.data.student_ids]
				}
				
				this.loadMedia(courseId)
			} catch (e) {
				console.error('加载课程详情失败:', e)
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
		
		async loadMedia(courseId) {
			try {
				const res = await mediaAPI.getList(courseId)
				this.mediaList = res.data.list
			} catch (e) {
				console.error('加载多媒体失败:', e)
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
			
			if (this.isSubmitting) return
			
			this.isSubmitting = true
			this.loading = true
			
			try {
				await courseAPI.update(this.courseId, {
					title: this.form.title,
					date: this.form.date,
					start_time: this.form.start_time,
					end_time: this.form.end_time,
					location: this.form.location,
					content: this.form.content,
					status: this.form.status,
					student_ids: this.selectedStudents
				})
				
				uni.showToast({
					title: '保存成功',
					icon: 'success'
				})
				
				setTimeout(() => {
					uni.navigateBack()
				}, 1500)
			} catch (e) {
				console.error('保存失败:', e)
			} finally {
				this.loading = false
				this.isSubmitting = false
			}
		},
		
		goToUpload() {
			uni.navigateTo({
				url: `/pages/coach/media-upload/media-upload?courseId=${this.courseId}`
			})
		},
		
		previewImage(url) {
			uni.previewImage({
				urls: [url],
				current: 0
			})
		},
		
		async deleteMedia(media) {
			uni.showModal({
				title: '确认删除',
				content: '确定要删除这个多媒体文件吗？',
				success: async (res) => {
					if (res.confirm) {
						try {
							await mediaAPI.delete(media._id)
							
							uni.showToast({
								title: '删除成功',
								icon: 'success'
							})
							
							this.loadMedia(this.courseId)
						} catch (e) {
							console.error('删除多媒体失败:', e)
						}
					}
				}
			})
		},
		
		goBack() {
			uni.navigateBack()
		},
		
		formatDate,
		formatDuration
	}
}
</script>

<style scoped>
.container {
	min-height: 100vh;
	background: #f8f8f8;
}

.header {
	background: #ffffff;
	padding: 30rpx 40rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
}

.form {
	background: #ffffff;
	margin: 20rpx;
	border-radius: 16rpx;
	padding: 40rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
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

.label {
	display: block;
	font-size: 28rpx;
	color: #333;
	margin-bottom: 20rpx;
	font-weight: bold;
}

.input {
	width: 100%;
	height: 88rpx;
	background: #fafafa;
	border-radius: 12rpx;
	padding: 0 24rpx;
	font-size: 28rpx;
	border: 1rpx solid #dbdbdb;
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
	box-sizing: border-box;
}

.textarea:focus {
	border-color: #a8a8a8;
	background: #ffffff;
}

.placeholder {
	color: #8e8e8e;
}

.picker {
	width: 100%;
	height: 88rpx;
	background: #f5f5f5;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	color: #333;
}

.status-tabs {
	display: flex;
	gap: 10rpx;
}

.status-tab {
	flex: 1;
	height: 72rpx;
	background: #f5f5f5;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 26rpx;
	color: #666;
	transition: all 0.3s;
}

.status-tab.active {
	background: #3cc51f;
	color: #ffffff;
	font-weight: bold;
}

.student-selector {
	display: flex;
	flex-wrap: wrap;
	gap: 20rpx;
}

.student-tag {
	display: flex;
	align-items: center;
	padding: 16rpx 24rpx;
	background: #f5f5f5;
	border-radius: 12rpx;
	border: 2rpx solid transparent;
	transition: all 0.3s;
}

.student-tag.selected {
	background: #3cc51f;
	border-color: #3cc51f;
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
}

.actions {
	background: #ffffff;
	padding: 30rpx;
	display: flex;
	gap: 20rpx;
	box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.action-btn {
	flex: 1;
	height: 88rpx;
	border-radius: 12rpx;
	font-size: 32rpx;
	font-weight: bold;
	border: none;
}

.action-btn.cancel {
	background: #f5f5f5;
	color: #666;
}

.action-btn.submit {
	background: #3cc51f;
	color: #ffffff;
}

.action-btn::after {
	border: none;
}

.media-section {
	background: #ffffff;
	margin: 20rpx;
	border-radius: 16rpx;
	padding: 30rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.upload-btn {
	height: 72rpx;
	background: #3cc51f;
	color: #ffffff;
	border: none;
	border-radius: 12rpx;
	padding: 0 30rpx;
	font-size: 28rpx;
}

.upload-btn::after {
	border: none;
}

.empty {
	text-align: center;
	padding: 60rpx 0;
	color: #999;
	font-size: 28rpx;
}

.media-list {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 20rpx;
}

.media-item {
	position: relative;
}

.media-image {
	width: 100%;
	height: 200rpx;
	border-radius: 12rpx;
	background: #f5f5f5;
}

.media-video {
	width: 100%;
	height: 200rpx;
	border-radius: 12rpx;
	background: #000000;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 10rpx;
}

.video-icon {
	font-size: 60rpx;
	color: #ffffff;
}

.video-duration {
	font-size: 24rpx;
	color: #ffffff;
}

.media-desc {
	margin-top: 10rpx;
	font-size: 24rpx;
	color: #999;
	text-align: center;
}

.delete-btn {
	position: absolute;
	top: 10rpx;
	right: 10rpx;
	width: 60rpx;
	height: 60rpx;
	background: rgba(0, 0, 0, 0.5);
	color: #ffffff;
	border-radius: 50%;
	font-size: 24rpx;
	border: none;
}

.delete-btn::after {
	border: none;
}
</style>
