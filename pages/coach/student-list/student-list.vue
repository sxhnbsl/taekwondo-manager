<template>
	<view class="container">
		<view class="header">
			<view class="search-box">
				<text class="search-icon">🔍</text>
				<input 
					class="search-input" 
					v-model="keyword" 
					placeholder="搜索学生姓名"
					placeholder-class="placeholder"
					@input="onSearchInput"
				/>
				<text v-if="keyword" class="clear-icon" @click="clearSearch">✕</text>
			</view>
			<button v-if="isAdmin" class="add-btn" @click="goToAdd">
				<text class="add-icon">➕</text>
				<text class="add-text">添加</text>
			</button>
		</view>
		
		<view v-if="students.length === 0 && !loading" class="empty">
			<view class="empty-icon">👥</view>
			<text class="empty-text">暂无学生信息</text>
			<text class="empty-tip">点击右上角"添加"按钮开始添加学生</text>
		</view>
		
		<view v-else class="student-list">
			<view 
				v-for="student in students" 
				:key="student._id" 
				class="student-card"
			>
				<view class="student-info" @click="goToDetail(student._id)">
					<view class="avatar-placeholder">{{ student.name.charAt(0) }}</view>
					<view class="info">
						<view class="name">{{ student.name }}</view>
						<view class="detail">
							<text class="level">{{ getLevelLabel(student.level) }}</text>
							<text class="separator">•</text>
							<text class="mobile">{{ student.parent_mobile }}</text>
						</view>
					</view>
				</view>
				<view class="hours-info">
				<view class="hours-item">
						<text class="label">剩余总课时</text>
						<text class="value primary">{{ (student.remaining_hours || 0) + (student.remaining_days || 0) + (student.remaining_private_hours || 0) }}</text>
					</view>
				<view class="hours-divider"></view>
				<view class="hours-item">
					<text class="label">剩余节数课时</text>
					<text class="value primary">{{ student.remaining_hours || 0 }}</text>
				</view>
				<view class="hours-divider"></view>
				<view class="hours-item">
					<text class="label">剩余天数</text>
					<text class="value primary">{{ student.remaining_days || 0 }}</text>
				</view>
				<view class="hours-divider"></view>
				<view class="hours-item">
					<text class="label">剩余私教</text>
					<text class="value primary">{{ student.remaining_private_hours || 0 }}</text>
				</view>
			</view>
				<view class="actions">
					<button v-if="isAdmin" class="action-btn edit" @click="goToEdit(student._id)">
						<text class="btn-icon">✏️</text>
						<text>编辑</text>
					</button>
					<button v-if="isAdmin" class="action-btn delete" @click="confirmDelete(student)">
						<text class="btn-icon">🗑️</text>
						<text>删除</text>
					</button>
				</view>
			</view>
		</view>
		
		<view v-if="loading" class="loading">
			<text>加载中...</text>
		</view>
		
		<view v-if="hasMore && !loading" class="load-more" @click="loadMore">
			<text>加载更多</text>
		</view>
	</view>
</template>

<script>
import { studentAPI } from '@/utils/api.js'
import { getLevelLabel } from '@/utils/common.js'
import { getShareConfig, getTimelineConfig } from '@/utils/share.js'

export default {
	data() {
		return {
			students: [],
			keyword: '',
			page: 1,
			pageSize: 20,
			total: 0,
			loading: false,
			hasMore: false,
			searchTimer: null,
			userInfo: null
		}
	},
	
	onLoad() {
		this.userInfo = uni.getStorageSync('userInfo')
		this.loadStudents()
	},
	
	computed: {
		isAdmin() {
			return this.userInfo && this.userInfo.role === 'admin'
		},
		isCoach() {
			return this.userInfo && this.userInfo.role === 'coach'
		}
	},
	
	onShow() {
		this.loadStudents()
	},
	
	onShareAppMessage() {
		return getShareConfig('/pages/coach/student-list/student-list', '欣兰体育 - 学生管理')
	},
	
	onShareTimeline() {
		return getTimelineConfig('欣兰体育')
	},
	
	methods: {
		async loadStudents() {
			this.loading = true
			
			try {
				const res = await studentAPI.getList({
					keyword: this.keyword,
					page: this.page,
					pageSize: this.pageSize
				})
				
				if (this.page === 1) {
					this.students = res.data.list
				} else {
					this.students = [...this.students, ...res.data.list]
				}
				
				this.total = res.data.total
				this.hasMore = this.students.length < this.total
			} catch (e) {
				console.error('加载学生列表失败:', e)
			} finally {
				this.loading = false
			}
		},
		
		onSearchInput() {
			if (this.searchTimer) {
				clearTimeout(this.searchTimer)
			}
			this.searchTimer = setTimeout(() => {
				this.page = 1
				this.loadStudents()
			}, 500)
		},
		
		clearSearch() {
			this.keyword = ''
			this.page = 1
			this.loadStudents()
		},
		
		loadMore() {
			if (!this.loading && this.hasMore) {
				this.page++
				this.loadStudents()
			}
		},
		
		goToAdd() {
			uni.navigateTo({
				url: '/pages/coach/student-edit/student-edit'
			})
		},
		
		goToDetail(id) {
			uni.navigateTo({
				url: `/pages/coach/student-edit/student-edit?id=${id}`
			})
		},
		
		goToEdit(id) {
			uni.navigateTo({
				url: `/pages/coach/student-edit/student-edit?id=${id}`
			})
		},
		
		confirmDelete(student) {
			uni.showModal({
				title: '确认删除',
				content: `确定要删除学生"${student.name}"吗？`,
				success: async (res) => {
					if (res.confirm) {
						await this.deleteStudent(student._id)
					}
				}
			})
		},
		
		async deleteStudent(id) {
			try {
				await studentAPI.delete(id)
				
				uni.showToast({
					title: '删除成功',
					icon: 'success'
				})
				
				this.page = 1
				this.loadStudents()
			} catch (e) {
				console.error('删除学生失败:', e)
			}
		},
		
		getLevelLabel
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
	padding: 20rpx;
	display: flex;
	align-items: center;
	gap: 20rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
	position: sticky;
	top: 0;
	z-index: 100;
}

.search-box {
	flex: 1;
	position: relative;
	background: #fafafa;
	border: 1rpx solid #dbdbdb;
	border-radius: 36rpx;
	display: flex;
	align-items: center;
	padding: 0 20rpx;
	height: 72rpx;
	box-sizing: border-box;
}

.search-icon {
	font-size: 32rpx;
	margin-right: 10rpx;
}

.search-input {
	flex: 1;
	height: 72rpx;
	font-size: 28rpx;
	background: transparent;
}

.clear-icon {
	font-size: 28rpx;
	color: #999;
	padding: 10rpx;
	margin-left: 10rpx;
}

.add-btn {
	width: 140rpx;
	height: 72rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: #ffffff;
	border: none;
	border-radius: 36rpx;
	font-size: 26rpx;
	padding: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6rpx;
	box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
}

.add-btn::after {
	border: none;
}

.add-icon {
	font-size: 28rpx;
}

.add-text {
	font-size: 26rpx;
}

.empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding-top: 200rpx;
}

.empty-icon {
	font-size: 120rpx;
	margin-bottom: 30rpx;
}

.empty-text {
	font-size: 30rpx;
	color: #999;
	margin-bottom: 10rpx;
}

.empty-tip {
	font-size: 24rpx;
	color: #ccc;
}

.student-list {
	padding: 20rpx;
}

.student-card {
	background: #ffffff;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
	transition: transform 0.2s;
}

.student-card:active {
	transform: scale(0.98);
}

.student-info {
	display: flex;
	align-items: center;
	margin-bottom: 24rpx;
}

.avatar-placeholder {
	width: 90rpx;
	height: 90rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 40rpx;
	color: #ffffff;
	margin-right: 24rpx;
	box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
}

.info .name {
	font-size: 34rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 12rpx;
}

.info .detail {
	font-size: 24rpx;
	color: #999;
	display: flex;
	align-items: center;
}

.info .separator {
	margin: 0 12rpx;
	font-size: 20rpx;
}

.hours-info {
	display: flex;
	justify-content: space-around;
	align-items: center;
	padding: 24rpx 0;
	background: #f8f9fa;
	border-radius: 12rpx;
	margin-bottom: 24rpx;
}

.hours-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	flex: 1;
}

.hours-item .label {
	font-size: 24rpx;
	color: #999;
	margin-bottom: 8rpx;
}

.hours-item .value {
	font-size: 40rpx;
	font-weight: bold;
	color: #333;
}

.hours-item .value.primary {
	color: #3cc51f;
}

.hours-divider {
	width: 1rpx;
	height: 60rpx;
	background: #e0e0e0;
}

.actions {
	display: flex;
	gap: 20rpx;
}

.action-btn {
	flex: 1;
	height: 72rpx;
	border: none;
	border-radius: 16rpx;
	font-size: 28rpx;
	padding: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
	transition: transform 0.2s;
}

.action-btn::after {
	border: none;
}

.action-btn:active {
	transform: scale(0.95);
}

.action-btn .btn-icon {
	font-size: 28rpx;
}

.action-btn.edit {
	background: linear-gradient(135deg, #e6f7e6 0%, #d4edda 100%);
	color: #3cc51f;
}

.action-btn.delete {
	background: linear-gradient(135deg, #ffe6e6 0%, #f8d7da 100%);
	color: #ff6b6b;
}

.loading {
	text-align: center;
	padding: 40rpx;
	font-size: 28rpx;
	color: #999;
}

.load-more {
	text-align: center;
	padding: 30rpx;
	font-size: 28rpx;
	color: #666;
	background: #ffffff;
	margin: 20rpx;
	border-radius: 16rpx;
}

.placeholder {
	color: #999;
}
</style>
