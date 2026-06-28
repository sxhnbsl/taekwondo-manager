<template>
	<view class="container">
		<view class="form-section">
			<view class="section-title">基本信息</view>
			
			<view class="form-item">
				<text class="label">角色 <text class="required">*</text></text>
				<view class="radio-group">
					<view 
						class="radio-item" 
						:class="{ active: form.role === 'coach' }"
						@click="form.role = 'coach'"
					>
						<view class="radio-dot"></view>
						<text>教练</text>
					</view>
					<view 
						class="radio-item" 
						:class="{ active: form.role === 'admin' }"
						@click="form.role = 'admin'"
					>
						<view class="radio-dot"></view>
						<text>管理员</text>
					</view>
				</view>
			</view>
			
			<view class="form-item">
				<text class="label">用户名 <text class="required">*</text></text>
				<input 
					class="input" 
					v-model="form.username" 
					placeholder="请输入用户名"
					:disabled="isEdit"
				/>
				<text v-if="isEdit" class="tip">用户名不可修改</text>
			</view>
			
			<view class="form-item">
				<text class="label">昵称 <text class="required">*</text></text>
				<input 
					class="input" 
					v-model="form.nickname" 
					placeholder="请输入昵称"
				/>
			</view>
			
			<view class="form-item" v-if="!isEdit">
				<text class="label">密码 <text class="required">*</text></text>
				<input 
					class="input" 
					v-model="form.password" 
					type="password"
					placeholder="请输入密码"
				/>
				<text class="tip">默认密码：123456</text>
			</view>

			<view class="form-item">
				<text class="label">状态</text>
				<view class="radio-group">
					<view 
						class="radio-item" 
						:class="{ active: form.status === 'active' }"
						@click="form.status = 'active'"
					>
						<view class="radio-dot"></view>
						<text>正常</text>
					</view>
					<view 
						class="radio-item" 
						:class="{ active: form.status === 'inactive' }"
						@click="form.status = 'inactive'"
					>
						<view class="radio-dot"></view>
						<text>禁用</text>
					</view>
				</view>
			</view>
			
			<view class="form-item">
				<text class="label">备注</text>
				<textarea 
					class="textarea" 
					v-model="form.remark" 
					placeholder="请输入备注信息"
					maxlength="200"
				/>
				<text class="count">{{ form.remark.length }}/200</text>
			</view>
		</view>
		
		<view class="btn-group">
			<button class="btn cancel" @click="goBack">取消</button>
			<button class="btn submit" @click="submit">{{ isEdit ? '保存' : '创建' }}</button>
		</view>
	</view>
</template>

<script>
import { coachAPI } from '@/utils/api.js'

export default {
	data() {
		return {
			isEdit: false,
			coachId: '',
			currentUserId: '',
			form: {
				username: '',
				nickname: '',
				password: '123456',
				role: 'coach',
				status: 'active',
				remark: ''
			}
		}
	},
	
	onLoad(options) {
		const userInfo = uni.getStorageSync('userInfo')
		this.currentUserId = userInfo._id
		
		if (options.id) {
			this.isEdit = true
			this.coachId = options.id
			this.loadCoachDetail()
		}
	},
	
	methods: {
		async loadCoachDetail() {
			uni.showLoading({ title: '加载中...' })
			
			try {
				const res = await coachAPI.getDetail(this.coachId)
				
				if (res.code === 0) {
					const coach = res.data
					
					if (coach._id === this.currentUserId) {
						uni.showToast({
							title: '不能编辑自己的信息',
							icon: 'none'
						})
						setTimeout(() => {
							uni.navigateBack()
						}, 1500)
						return
					}
					
					this.form = {
						username: coach.username,
						nickname: coach.nickname || '',
						password: '',
						role: coach.role || 'coach',
						status: coach.status || 'active',
						remark: coach.remark || ''
					}
				}
			} catch (e) {
				console.error('加载教练详情失败:', e)
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
			} finally {
				uni.hideLoading()
			}
		},
		
		validate() {
			if (!this.form.username.trim()) {
				uni.showToast({
					title: '请输入用户名',
					icon: 'none'
				})
				return false
			}
			
			if (!this.form.nickname.trim()) {
				uni.showToast({
					title: '请输入昵称',
					icon: 'none'
				})
				return false
			}
			
			if (!this.isEdit && !this.form.password.trim()) {
			uni.showToast({
				title: '请输入密码',
				icon: 'none'
			})
			return false
		}

		return true
	},

	async submit() {
		if (!this.validate()) return

		uni.showLoading({ title: this.isEdit ? '保存中...' : '创建中...' })

		try {
			let res

			if (this.isEdit) {
				res = await coachAPI.update(this.coachId, {
					nickname: this.form.nickname,
					status: this.form.status,
					remark: this.form.remark
				})
			} else {
				res = await coachAPI.create({
					username: this.form.username,
					nickname: this.form.nickname,
					password: this.form.password,
					role: this.form.role,
					status: this.form.status,
					remark: this.form.remark
				})
			}
				
				if (res.code === 0) {
					uni.showToast({
						title: this.isEdit ? '保存成功' : '创建成功',
						icon: 'success'
					})
					
					setTimeout(() => {
						uni.navigateBack()
					}, 1500)
				}
			} catch (e) {
				console.error(this.isEdit ? '保存教练失败:' : '创建教练失败:', e)
				uni.showToast({
					title: e.message || (this.isEdit ? '保存失败' : '创建失败'),
					icon: 'none'
				})
			} finally {
				uni.hideLoading()
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
	background-color: #f5f7fa;
	padding: 20rpx;
}

.form-section {
	background: #fff;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 30rpx;
	padding-bottom: 20rpx;
	border-bottom: 2rpx solid #f0f0f0;
}

.form-item {
	margin-bottom: 30rpx;
}

.label {
	display: block;
	font-size: 28rpx;
	color: #333;
	margin-bottom: 16rpx;
	font-weight: 500;
}

.required {
	color: #f44336;
	margin-left: 4rpx;
}

.input {
	width: 100%;
	height: 88rpx;
	background: #fafafa;
	border: 1rpx solid #dbdbdb;
	border-radius: 12rpx;
	padding: 0 24rpx;
	font-size: 28rpx;
	color: #262626;
	box-sizing: border-box;
	transition: all 0.2s ease;
}

.input:focus {
	border-color: #a8a8a8;
	background: #ffffff;
}

.input:disabled {
	background: #f0f0f0;
	color: #8e8e8e;
}

.textarea {
	width: 100%;
	height: 200rpx;
	background: #fafafa;
	border: 1rpx solid #dbdbdb;
	border-radius: 12rpx;
	padding: 20rpx 24rpx;
	font-size: 28rpx;
	color: #262626;
	box-sizing: border-box;
	transition: all 0.2s ease;
}

.textarea:focus {
	border-color: #a8a8a8;
	background: #ffffff;
}

.tip {
	display: block;
	font-size: 24rpx;
	color: #999;
	margin-top: 8rpx;
}

.count {
	display: block;
	text-align: right;
	font-size: 24rpx;
	color: #999;
	margin-top: 8rpx;
}

.radio-group {
	display: flex;
	gap: 40rpx;
}

.radio-item {
	display: flex;
	align-items: center;
	font-size: 28rpx;
	color: #666;
	cursor: pointer;
}

.radio-dot {
	width: 32rpx;
	height: 32rpx;
	border: 4rpx solid #ddd;
	border-radius: 50%;
	margin-right: 12rpx;
	position: relative;
	transition: all 0.3s;
}

.radio-item.active .radio-dot {
	border-color: #667eea;
	background: #667eea;
}

.radio-item.active .radio-dot::after {
	content: '';
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 12rpx;
	height: 12rpx;
	background: #fff;
	border-radius: 50%;
}

.radio-item.active {
	color: #667eea;
}

.btn-group {
	display: flex;
	gap: 20rpx;
	padding: 20rpx 0;
}

.btn {
	flex: 1;
	height: 88rpx;
	line-height: 88rpx;
	border-radius: 44rpx;
	font-size: 30rpx;
	font-weight: 500;
	border: none;
}

.btn::after {
	border: none;
}

.btn.cancel {
	background: #f0f0f0;
	color: #666;
}

.btn.submit {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: #fff;
}
</style>
