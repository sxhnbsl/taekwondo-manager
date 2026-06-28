<template>
	<view class="container">
		<view class="header">
			<text class="title">{{ isEdit ? '编辑学生' : '添加学生' }}</text>
		</view>
		
		<view class="form">
			<view class="form-item">
				<text class="label">学生姓名 *</text>
				<input 
					class="input" 
					v-model="form.name" 
					placeholder="请输入学生姓名"
					placeholder-class="placeholder"
				/>
			</view>
			
			<view class="form-item">
				<text class="label">性别 *</text>
				<view class="radio-group">
					<view 
						class="radio-item" 
						:class="{ active: form.gender === 'male' }"
						@click="form.gender = 'male'"
					>
						<text class="radio-text">男</text>
					</view>
					<view 
						class="radio-item" 
						:class="{ active: form.gender === 'female' }"
						@click="form.gender = 'female'"
					>
						<text class="radio-text">女</text>
					</view>
				</view>
			</view>
			
			<view class="form-item">
				<text class="label">出生日期</text>
				<picker 
					mode="date" 
					:value="form.birth_date" 
					@change="onDateChange"
				>
					<view class="picker">
						{{ form.birth_date ? formatDate(form.birth_date) : '请选择出生日期' }}
					</view>
				</picker>
			</view>
			
			<view class="form-item">
				<text class="label">跆拳道等级</text>
				<picker 
					mode="selector" 
					:range="levelLabels" 
					:value="levelIndex" 
					@change="onLevelChange"
				>
					<view class="picker level-picker">
						<view 
							class="level-color-indicator" 
							:style="{ backgroundColor: LEVEL_COLORS[form.level] || '#ffffff', border: form.level.includes('black') ? '2rpx solid #333' : '2rpx solid #dbdbdb' }"
						></view>
						<text class="level-text">{{ getLevelLabel(form.level) }}</text>
					</view>
				</picker>
			</view>
			
			<view class="form-item">
				<text class="label">家长手机号 *</text>
				<input 
					class="input" 
					v-model="form.parent_mobile" 
					type="number"
					maxlength="11"
					placeholder="请输入家长手机号"
					placeholder-class="placeholder"
				/>
			</view>
			
			<view v-if="!isEdit" class="form-item">
			<text class="label">初始课时</text>
			<input 
				class="input" 
				v-model="form.initial_hours" 
				type="number"
				placeholder="请输入初始课时"
				placeholder-class="placeholder"
			/>
		</view>
		<view v-if="!isEdit" class="form-item">
			<text class="label">初始课时是否限时</text>
			<view class="switch-container" @click="toggleHoursLimit">
				<view class="switch" :class="{ active: !form.hours_is_unlimited }">
					<view class="switch-handle"></view>
				</view>
			</view>
		</view>
		<view v-if="!isEdit && !form.hours_is_unlimited" class="form-item">
			<text class="label">初始课时到期日期</text>
			<view class="date-picker-container" @click="showHoursDatePicker">
				<view class="date-input">
					<text class="date-text">{{ form.hours_expire_date || '请选择日期时间' }}</text>
				</view>
			</view>
		</view>
		<view v-if="!isEdit" class="form-item">
			<text class="label">初始天数课时</text>
			<input 
				class="input" 
				v-model="form.initial_days" 
				type="number"
				placeholder="请输入初始天数"
				placeholder-class="placeholder"
			/>
		</view>
		<view v-if="!isEdit" class="form-item">
			<text class="label">初始天数是否限时</text>
			<view class="switch-container" @click="toggleDaysLimit">
				<view class="switch" :class="{ active: !form.days_is_unlimited }">
					<view class="switch-handle"></view>
				</view>
			</view>
		</view>
		<view v-if="!isEdit && !form.days_is_unlimited" class="form-item">
			<text class="label">初始天数到期日期</text>
			<view class="date-picker-container" @click="showDaysDatePicker">
				<view class="date-input">
					<text class="date-text">{{ form.days_expire_date || '请选择日期时间' }}</text>
				</view>
			</view>
		</view>
		<view v-if="!isEdit" class="form-item">
			<text class="label">初始私教课时</text>
			<input 
				class="input" 
				v-model="form.initial_private_hours" 
				type="number"
				placeholder="请输入初始私教课时"
				placeholder-class="placeholder"
			/>
		</view>
		</view>
		
		<view class="actions">
			<button class="action-btn cancel" @click="goBack">取消</button>
			<button class="action-btn submit" @click="handleSubmit" :loading="loading">
				{{ isEdit ? '保存' : '添加' }}
			</button>
		</view>
		
		<!-- 日期选择器弹窗 -->
		<view v-if="showDatePickerModal" class="date-picker-modal" @click="hideDatePicker">
			<view class="date-picker-modal-content" @click.stop>
				<view class="date-picker-modal-header">
					<text class="date-picker-modal-title">选择到期日期</text>
				</view>
				<picker-view 
					class="date-picker-modal-view"
					@change="onDatePickerChange"
					:value="datePickerValue"
				>
					<picker-view-column>
						<view 
							v-for="year in years" 
							:key="year"
						>
							{{ year }}年
						</view>
					</picker-view-column>
					<picker-view-column>
						<view 
							v-for="month in months" 
							:key="month"
						>
							{{ month }}月
						</view>
					</picker-view-column>
					<picker-view-column>
						<view 
							v-for="day in days" 
							:key="day"
						>
							{{ day }}日
						</view>
					</picker-view-column>
					<picker-view-column>
						<view 
							v-for="hour in hours" 
							:key="hour"
						>
							{{ hour }}时
						</view>
					</picker-view-column>
					<picker-view-column>
						<view 
							v-for="minute in minutes" 
							:key="minute"
						>
							{{ minute }}分
						</view>
					</picker-view-column>
				</picker-view>
				<view class="date-picker-modal-actions">
					<button class="picker-modal-btn cancel" @click="hideDatePicker">取消</button>
					<button class="picker-modal-btn confirm" @click="confirmDatePicker">确定</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { studentAPI } from '@/utils/api.js'
import { getLevelLabel, LEVEL_OPTIONS, formatDate } from '@/utils/common.js'

// 等级颜色映射
const LEVEL_COLORS = {
	'white': '#ffffff',
	'white-yellow': '#fffacd',
	'yellow': '#ffd700',
	'yellow-green': '#9acd32',
	'green': '#008000',
	'green-blue': '#0066cc',
	'blue': '#0000ff',
	'blue-red': '#ff6600',
	'red': '#ff0000',
	'red-black': '#800000',
	'black-1': '#000000',
	'black-2': '#000000',
	'black-3': '#000000',
	'black-4': '#000000',
	'black-5': '#000000',
	'black-6': '#000000',
	'black-7': '#000000',
	'black-8': '#000000',
	'black-9': '#000000'
}

export default {
	data() {
			return {
				isEdit: false,
				studentId: '',
				loading: false,
				isSubmitting: false,
				userInfo: null,
				LEVEL_COLORS: LEVEL_COLORS,
				form: {
					name: '',
					gender: 'male',
					birth_date: '',
					level: 'white',
					parent_mobile: '',
					initial_hours: 0,
					initial_days: 0,
					initial_private_hours: 0,
					hours_is_unlimited: true,
					hours_expire_date: '',
					days_is_unlimited: true,
					days_expire_date: ''
				},
				levelOptions: LEVEL_OPTIONS,
				showDatePickerModal: false,
				datePickerType: '', // 'hours' or 'days'
				years: [],
				months: [],
				days: [],
				hours: [],
				minutes: [],
				currentDate: {
					year: new Date().getFullYear(),
					month: new Date().getMonth() + 1,
					day: new Date().getDate(),
					hour: new Date().getHours(),
					minute: new Date().getMinutes()
				},
				datePickerValue: [0, 0, 0, 0, 0]
			}
		},
	
	computed: {
		levelLabels() {
			return this.levelOptions.map(item => item.label)
		},
		levelIndex() {
			const index = this.levelOptions.findIndex(item => item.value === this.form.level)
			return index >= 0 ? index : 0
		},
		isAdmin() {
			return this.userInfo && this.userInfo.role === 'admin'
		}
	},
	
	onLoad(options) {
			this.userInfo = uni.getStorageSync('userInfo')
			
			// 检查是否为管理员
			if (!this.isAdmin) {
				uni.showToast({
					title: '权限不足，只有管理员可以编辑学生',
					icon: 'none'
				})
				setTimeout(() => {
					uni.navigateBack()
				}, 1500)
				return
			}
			
			if (options.id) {
				this.isEdit = true
				this.studentId = options.id
				this.loadStudentDetail(options.id)
			}
			
			this.initDateData()
		},
	
	methods: {
		async loadStudentDetail(id) {
			try {
				const res = await studentAPI.getDetail(id)
				this.form = {
					name: res.data.name,
					gender: res.data.gender,
					birth_date: res.data.birth_date,
					level: res.data.level,
					parent_mobile: res.data.parent_mobile || ''
				}
			} catch (e) {
				console.error('加载学生详情失败:', e)
			}
		},
		
		onDateChange(e) {
			this.form.birth_date = e.detail.value
		},
		
		onLevelChange(e) {
			const index = e.detail.value
			this.form.level = this.levelOptions[index].value
		},
		
		async handleSubmit() {
			if (!this.form.name || !this.form.parent_mobile) {
				uni.showToast({
					title: '请填写必填项',
					icon: 'none'
				})
				return
			}

			if (!/^1[3-9]\d{9}$/.test(this.form.parent_mobile)) {
				uni.showToast({
					title: '手机号格式不正确',
					icon: 'none'
				})
				return
			}
			
			// 验证限时课时是否设置了到期日期
			if (this.form.initial_hours > 0 && !this.form.hours_is_unlimited && !this.form.hours_expire_date) {
				uni.showToast({
					title: '请设置初始课时的到期日期',
					icon: 'none'
				})
				return
			}
			
			if (this.form.initial_days > 0 && !this.form.days_is_unlimited && !this.form.days_expire_date) {
				uni.showToast({
					title: '请设置初始天数的到期日期',
					icon: 'none'
				})
				return
			}
			
			if (this.isSubmitting) return
			
			this.isSubmitting = true
			this.loading = true
			
			try {
				if (this.isEdit) {
					await studentAPI.update(this.studentId, {
						name: this.form.name,
						gender: this.form.gender,
						birth_date: this.form.birth_date,
						level: this.form.level,
						parent_mobile: this.form.parent_mobile
					})
				} else {
					await studentAPI.create({
							name: this.form.name,
							gender: this.form.gender,
							birth_date: this.form.birth_date,
							level: this.form.level,
							parent_mobile: this.form.parent_mobile,
							initial_hours: this.form.initial_hours,
							initial_days: this.form.initial_days,
							initial_private_hours: this.form.initial_private_hours,
							hours_is_unlimited: this.form.hours_is_unlimited,
							hours_expire_date: this.form.hours_expire_date,
							days_is_unlimited: this.form.days_is_unlimited,
							days_expire_date: this.form.days_expire_date
						})
				}
				
				uni.showToast({
					title: this.isEdit ? '保存成功' : '添加成功',
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
		
		goBack() {
			uni.navigateBack()
		},
		
		toggleHoursLimit() {
			this.form.hours_is_unlimited = !this.form.hours_is_unlimited
			if (this.form.hours_is_unlimited) {
				this.form.hours_expire_date = ''
			}
		},
		
		toggleDaysLimit() {
			this.form.days_is_unlimited = !this.form.days_is_unlimited
			if (this.form.days_is_unlimited) {
				this.form.days_expire_date = ''
			}
		},
		
		showHoursDatePicker() {
			this.datePickerType = 'hours'
			this.showDatePicker()
		},
		
		showDaysDatePicker() {
			this.datePickerType = 'days'
			this.showDatePicker()
		},
		
		initDateData() {
			// 初始化年份（当前年份开始，往后10年）
			const currentYear = new Date().getFullYear()
			for (let i = 0; i < 10; i++) {
				this.years.push(currentYear + i)
			}
			
			// 初始化月份
			for (let i = 1; i <= 12; i++) {
				this.months.push(i)
			}
			
			// 初始化天数
			for (let i = 1; i <= 31; i++) {
				this.days.push(i)
			}
			
			// 初始化小时
			for (let i = 0; i <= 23; i++) {
				this.hours.push(i)
			}
			
			// 初始化分钟（每5分钟一个选项）
			for (let i = 0; i <= 55; i += 5) {
				this.minutes.push(i)
			}
		},
		
		showDatePicker() {
			// 初始化datePickerValue
			const now = new Date()
			const currentYear = now.getFullYear()
			const currentMonth = now.getMonth() + 1
			const currentDay = now.getDate()
			const currentHour = now.getHours()
			const currentMinute = now.getMinutes()
			
			// 计算各列的索引
			const yearIndex = this.years.indexOf(currentYear)
			const monthIndex = this.months.indexOf(currentMonth)
			const dayIndex = this.days.indexOf(currentDay) - 1 // 因为days数组从1开始
			const hourIndex = this.hours.indexOf(currentHour)
			const minuteIndex = this.minutes.indexOf(Math.round(currentMinute / 5) * 5)
			
			this.datePickerValue = [
				yearIndex >= 0 ? yearIndex : 0,
				monthIndex >= 0 ? monthIndex : 0,
				dayIndex >= 0 ? dayIndex : 0,
				hourIndex >= 0 ? hourIndex : 0,
				minuteIndex >= 0 ? minuteIndex : 0
			]
			
			// 初始化currentDate
			this.currentDate = {
				year: currentYear,
				month: currentMonth,
				day: currentDay,
				hour: currentHour,
				minute: Math.round(currentMinute / 5) * 5
			}
			
			this.showDatePickerModal = true
		},
		
		hideDatePicker() {
			this.showDatePickerModal = false
		},
		
		onDatePickerChange(e) {
			const value = e.detail.value
			this.currentDate = {
				year: this.years[value[0]],
				month: this.months[value[1]],
				day: this.days[value[2]],
				hour: this.hours[value[3]],
				minute: this.minutes[value[4]]
			}
		},
		
		confirmDatePicker() {
			const { year, month, day, hour, minute } = this.currentDate
			const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
			
			// 验证日期是否晚于当前时间
			const now = new Date()
			const selectedDateTime = new Date(formattedDate)
			if (selectedDateTime < now) {
				uni.showToast({
					title: '到期日期时间不能早于当前时间',
					icon: 'none'
				})
				return
			}
			
			if (this.datePickerType === 'hours') {
				this.form.hours_expire_date = formattedDate
			} else if (this.datePickerType === 'days') {
				this.form.days_expire_date = formattedDate
			}
			
			this.showDatePickerModal = false
		},
		
		getLevelLabel,
		formatDate
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
	padding: 30rpx;
}

.form-item {
	margin-bottom: 30rpx;
}

.form-item:last-child {
	margin-bottom: 0;
}

.label {
	display: block;
	font-size: 28rpx;
	color: #333;
	margin-bottom: 16rpx;
	font-weight: 500;
}

.input {
	width: 100%;
	height: 80rpx;
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

.placeholder {
	color: #8e8e8e;
}

.picker {
			width: 100%;
			height: 80rpx;
			background: #fafafa;
			border-radius: 12rpx;
			padding: 0 24rpx;
			font-size: 28rpx;
			line-height: 80rpx;
			color: #262626;
			border: 1rpx solid #dbdbdb;
			box-sizing: border-box;
		}

		.level-picker {
			display: flex;
			align-items: center;
			gap: 20rpx;
		}

		.level-color-indicator {
			width: 40rpx;
			height: 40rpx;
			border-radius: 50%;
			flex-shrink: 0;
		}

		.level-text {
			flex: 1;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			color: #262626;
			font-size: 28rpx;
		}

.radio-group {
	display: flex;
	gap: 20rpx;
}

.radio-item {
	flex: 1;
	height: 80rpx;
	background: #f5f5f5;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 2rpx solid transparent;
}

.radio-item.active {
	background: #e6f7e6;
	border-color: #3cc51f;
}

.radio-text {
	font-size: 28rpx;
	color: #666;
}

.radio-item.active .radio-text {
	color: #3cc51f;
	font-weight: bold;
}

.actions {
	display: flex;
	gap: 20rpx;
	padding: 40rpx;
}

.action-btn {
	flex: 1;
	height: 88rpx;
	border: none;
	border-radius: 12rpx;
	font-size: 32rpx;
	font-weight: bold;
}

.action-btn::after {
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

		.switch-container {
			display: flex;
			align-items: center;
		}

		.switch {
			width: 100rpx;
			height: 60rpx;
			background: #e0e0e0;
			border-radius: 30rpx;
			position: relative;
			transition: all 0.3s ease;
		}

		.switch.active {
			background: #3cc51f;
		}

		.switch-handle {
			width: 52rpx;
			height: 52rpx;
			background: #fff;
			border-radius: 50%;
			position: absolute;
			top: 4rpx;
			left: 4rpx;
			transition: all 0.3s ease;
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
		}

		.switch.active .switch-handle {
			left: 44rpx;
		}

		.date-picker-container {
			width: 100%;
			height: 80rpx;
		}

		.date-input {
			width: 100%;
			height: 80rpx;
			background: #fafafa;
			border-radius: 12rpx;
			padding: 0 24rpx;
			font-size: 28rpx;
			border: 1rpx solid #dbdbdb;
			box-sizing: border-box;
			display: flex;
			align-items: center;
			color: #333;
		}

		.date-text {
			font-size: 28rpx;
			color: #333;
		}

		.date-picker-modal {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(0, 0, 0, 0.5);
			display: flex;
			align-items: flex-end;
			justify-content: center;
			z-index: 1000;
		}

		.date-picker-modal-content {
			background: #fff;
			width: 100%;
			border-radius: 20rpx 20rpx 0 0;
		}

		.date-picker-modal-header {
			padding: 30rpx;
			border-bottom: 1rpx solid #f0f0f0;
			text-align: center;
		}

		.date-picker-modal-title {
			font-size: 32rpx;
			font-weight: 600;
			color: #333;
		}

		.date-picker-modal-view {
			height: 400rpx;
			background: #fff;
		}

		.date-picker-modal-actions {
			display: flex;
			padding: 20rpx 30rpx;
			border-top: 1rpx solid #f0f0f0;
			background: #fff;
		}

		.picker-modal-btn {
			flex: 1;
			height: 80rpx;
			line-height: 80rpx;
			border-radius: 40rpx;
			font-size: 28rpx;
			border: none;
			margin: 0 10rpx;
		}

		.picker-modal-btn.cancel {
			background: #f5f5f5;
			color: #666;
		}

		.picker-modal-btn.confirm {
			background: #3cc51f;
			color: #fff;
		}
</style>
