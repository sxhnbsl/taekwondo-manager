<template>
	<view class="container">
		<view class="header">
			<text class="title">上传照片</text>
		</view>
		
		<view class="upload-area">
			<view class="upload-box" @click="chooseFile">
				<text class="upload-icon">📷</text>
				<text class="upload-text">点击选择照片</text>
				<text class="upload-tip">支持jpg、png格式</text>
			</view>
		</view>
		
		<view class="file-list">
			<view 
				v-for="(file, index) in fileList" 
				:key="index" 
				class="file-item"
			>
				<image 
					class="file-preview" 
					:src="file.url || file.path" 
					mode="aspectFill"
				></image>
				
				<view class="file-info">
					<view class="file-name">{{ file.name }}</view>
					<view class="file-size">{{ formatFileSize(file.size) }}</view>
				</view>
				
				<view class="file-desc">
					<input 
						class="desc-input" 
						v-model="file.description" 
						placeholder="添加描述（可选）"
						placeholder-class="placeholder"
					/>
				</view>
				
				<button class="remove-btn" @click="removeFile(index)">✕</button>
			</view>
		</view>
		
		<view class="actions">
			<button class="action-btn cancel" @click="goBack">取消</button>
			<button class="action-btn submit" @click="handleUpload" :loading="loading" :disabled="fileList.length === 0">
				上传 ({{ fileList.length }})
			</button>
		</view>
	</view>
</template>

<script>
import { uploadFile } from '@/utils/cloud.js'
import { formatFileSize } from '@/utils/common.js'
import { mediaAPI } from '@/utils/api.js'

export default {
	data() {
		return {
			courseId: '',
			fileList: [],
			loading: false
		}
	},
	
	onLoad(options) {
		if (options.courseId) {
			this.courseId = options.courseId
		}
	},
	
	methods: {
		chooseFile() {
			const count = 9 - this.fileList.length
			
			if (count <= 0) {
				uni.showToast({
					title: '最多上传9张照片',
					icon: 'none'
				})
				return
			}
			
			uni.chooseImage({
				count: count,
				sizeType: ['original', 'compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					this.handleChooseFiles(res.tempFilePaths)
				}
			})
		},
		
		handleChooseFiles(filePaths) {
			filePaths.forEach(filePath => {
				uni.getFileInfo({
					filePath,
					success: (res) => {
						this.fileList.push({
							path: filePath,
							name: filePath.split('/').pop(),
							size: res.size,
							url: '',
							description: ''
						})
					}
				})
			})
		},
		
		removeFile(index) {
			this.fileList.splice(index, 1)
		},
		
		async handleUpload() {
			if (this.fileList.length === 0) {
				uni.showToast({
					title: '请先选择文件',
					icon: 'none'
				})
				return
			}
			
			this.loading = true
			
			try {
				const uploadPromises = this.fileList.map(async (file, index) => {
					const ext = file.path.split('.').pop()
					const cloudPath = `course/${this.courseId}/${Date.now()}_${index}.${ext}`
					
					const uploadRes = await uploadFile(file.path, cloudPath)
					
					return {
						...file,
						url: uploadRes.fileID,
						cloudPath,
						type: 'image'
					}
				})
				
				const uploadedFiles = await Promise.all(uploadPromises)
				
				const descriptions = uploadedFiles.map(file => file.description)
				
				const mediaRes = await mediaAPI.upload(this.courseId, uploadedFiles, descriptions)
				
				uni.showToast({
					title: '上传成功',
					icon: 'success'
				})
				
				setTimeout(() => {
					uni.redirectTo({
						url: `/pages/coach/class-detail/class-detail?id=${this.courseId}`
					})
				}, 1500)
			} catch (e) {
				console.error('上传失败:', e)
				uni.showToast({
					title: '上传失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},
		
		goBack() {
			uni.navigateBack()
		},
		
		formatFileSize
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

.upload-area {
	background: #ffffff;
	margin: 20rpx;
	border-radius: 16rpx;
	padding: 40rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.upload-type-tabs {
	display: flex;
	gap: 20rpx;
	margin-bottom: 40rpx;
}

.type-tab {
	flex: 1;
	height: 88rpx;
	background: #f5f5f5;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	color: #666;
	transition: all 0.3s;
}

.type-tab.active {
	background: #3cc51f;
	color: #ffffff;
	font-weight: bold;
}

.upload-box {
	border: 2rpx dashed #3cc51f;
	border-radius: 16rpx;
	padding: 80rpx 40rpx;
	text-align: center;
	margin-bottom: 40rpx;
}

.upload-icon {
	font-size: 80rpx;
	display: block;
	margin-bottom: 20rpx;
}

.upload-text {
	font-size: 32rpx;
	color: #333;
	font-weight: bold;
	display: block;
	margin-bottom: 10rpx;
}

.upload-tip {
	font-size: 24rpx;
	color: #999;
}

.file-list {
	background: #ffffff;
	margin: 20rpx;
	border-radius: 16rpx;
	padding: 30rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.file-item {
	position: relative;
	display: flex;
	gap: 20rpx;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
}

.file-preview {
	width: 120rpx;
	height: 120rpx;
	border-radius: 12rpx;
	background: #f5f5f5;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.file-preview.video {
	background: #000000;
}

.video-icon {
	font-size: 48rpx;
	color: #ffffff;
}

.file-info {
	flex: 1;
}

.file-name {
	font-size: 28rpx;
	color: #333;
	font-weight: bold;
	margin-bottom: 8rpx;
}

.file-size {
	font-size: 24rpx;
	color: #999;
}

.file-desc {
	flex: 1;
}

.desc-input {
	width: 100%;
	height: 72rpx;
	background: #f5f5f5;
	border-radius: 12rpx;
	padding: 0 20rpx;
	font-size: 26rpx;
}

.placeholder {
	color: #999;
}

.remove-btn {
	width: 60rpx;
	height: 60rpx;
	background: #dd524d;
	color: #ffffff;
	border-radius: 50%;
	font-size: 32rpx;
	border: none;
	flex-shrink: 0;
}

.remove-btn::after {
	border: none;
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

.action-btn:disabled {
	opacity: 0.5;
}

.action-btn::after {
	border: none;
}
</style>
