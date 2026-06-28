<template>
	<view class="container">
		<view class="header">
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
		</view>
		
		<view class="hours-overview">
			<view class="hours-card remaining">
				<view class="hours-value">{{ (student.remaining_hours || 0) + (student.remaining_days || 0) + (student.remaining_private_hours || 0) }}</view>
				<view class="hours-label">剩余总课时</view>
			</view>
			<view class="hours-card used">
				<view class="hours-value">{{ (student.used_hours || 0) + (student.used_days || 0) + (student.used_private_hours || 0) }}</view>
				<view class="hours-label">已用总课时</view>
			</view>
			<view class="hours-card remaining">
				<view class="hours-value">{{ student.remaining_hours || 0 }}</view>
				<view class="hours-label">剩余节数课时</view>
			</view>
			<view class="hours-card used">
				<view class="hours-value">{{ student.used_hours || 0 }}</view>
				<view class="hours-label">已用节数课时</view>
			</view>
			<view class="hours-card remaining">
				<view class="hours-value">{{ student.remaining_days || 0 }}</view>
				<view class="hours-label">剩余天数</view>
			</view>
			<view class="hours-card used">
				<view class="hours-value">{{ student.used_days || 0 }}</view>
				<view class="hours-label">已用天数</view>
			</view>
			<view class="hours-card remaining">
				<view class="hours-value">{{ student.remaining_private_hours || 0 }}</view>
				<view class="hours-label">剩余私教</view>
			</view>
			<view class="hours-card used">
				<view class="hours-value">{{ student.used_private_hours || 0 }}</view>
				<view class="hours-label">已用私教</view>
			</view>
		</view>
		
		<view class="actions-section">
			<view class="section-title">课时操作</view>
			<view class="action-buttons">
				<button v-if="isAdmin" class="action-btn add" @click="showAddModal">增加课时</button>
				<button v-if="isAdmin" class="action-btn consume" @click="showConsumeModal">扣减课时</button>
				<button class="action-btn package" @click="goToPackageManage">课时包管理</button>
				<view v-if="!isAdmin" class="tip">只有管理员可以操作课时</view>
			</view>
		</view>
		
		<view class="records-section">
			<view class="section-title">课时记录</view>
			<view v-if="records.length === 0" class="empty">
				<text>暂无课时记录</text>
			</view>
			<view v-else class="record-list">
				<view 
					v-for="record in records" 
					:key="record._id"
					class="record-item"
				>
					<view class="record-header">
						<view class="record-type" :class="getRecordTypeClass(record)">
							{{ getRecordTypeText(record) }}
						</view>
						<view class="record-time">
							{{ formatDate(record.create_time) }}
							<view v-if="record.status === 'undone'" class="undone-tag">已撤销</view>
						</view>
					</view>
					<view class="record-body">
						<view class="record-hours" :class="getRecordTypeClass(record)">
							{{ getRecordHoursText(record) }}
						</view>
					<view class="record-remaining">{{ getRecordRemainingText(record) }}</view>
					</view>
					<view v-if="record.reason" class="record-reason">
						原因: {{ record.reason }}
					</view>
					<view v-if="record.status === 'undone'" class="record-undo-info">
						撤销时间: {{ formatDate(record.undo_time) }}
						<text v-if="record.undo_reason" class="undo-reason"> | 撤销原因: {{ record.undo_reason }}</text>
					</view>
					<view class="record-actions" v-if="isAdmin && canUndoRecord(record)">
						<button class="undo-btn" @click="showUndoModal(record._id)">撤销</button>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 增加课时弹窗 -->
		<view v-if="showAdd" class="modal-overlay" @click="closeAddModal">
			<view class="modal-content" @click.stop>
				<view class="modal-title">增加课时</view>
				<view class="form-item">
			<text class="label">课时类型</text>
			<view class="unit-tabs">
				<view class="unit-tab" :class="{ active: addForm.unit === 'lesson' }" @click="addForm.unit = 'lesson'">节数</view>
				<view class="unit-tab" :class="{ active: addForm.unit === 'day' }" @click="addForm.unit = 'day'">天数</view>
				<view class="unit-tab" :class="{ active: addForm.unit === 'private' }" @click="addForm.unit = 'private'">私教</view>
			</view>
		</view>
				<view class="form-item">
					<text class="label">数量</text>
					<input 
						class="input" 
						type="number" 
						v-model="addForm.hours" 
						placeholder="请输入课时数量"
					/>
				</view>
				<view class="form-item">
					<text class="label">原因/备注</text>
					<input 
						class="input" 
						v-model="addForm.reason" 
						placeholder="请输入原因"
					/>
				</view>
				<view class="form-item">
					<text class="label">是否限时</text>
					<view class="switch-container" @click="toggleLimit">
						<view class="switch" :class="{ active: !addForm.is_unlimited }">
							<view class="switch-handle"></view>
						</view>
					</view>
				</view>
				<view v-if="!addForm.is_unlimited" class="form-item">
					<text class="label">到期日期</text>
					<view class="date-picker-container" @click="showDatePicker">
						<view class="date-input">
							<text class="date-text">{{ addForm.expire_date || '请选择日期时间' }}</text>
						</view>
					</view>
				</view>
				<view class="modal-actions">
					<button class="btn cancel" @click="closeAddModal" :disabled="isSubmitting">取消</button>
					<button class="btn confirm" @click="confirmAdd" :loading="isSubmitting" :disabled="isSubmitting">确定</button>
				</view>
			</view>
		</view>
		
		<!-- 扣减课时弹窗 -->
		<view v-if="showConsume" class="modal-overlay" @click="closeConsumeModal">
			<view class="modal-content" @click.stop>
				<view class="modal-title">扣减课时</view>
				<view class="form-item">
			<text class="label">课时类型</text>
			<view class="unit-tabs">
				<view class="unit-tab" :class="{ active: consumeForm.unit === 'lesson' }" @click="consumeForm.unit = 'lesson'">节数</view>
				<view class="unit-tab" :class="{ active: consumeForm.unit === 'day' }" @click="consumeForm.unit = 'day'">天数</view>
				<view class="unit-tab" :class="{ active: consumeForm.unit === 'private' }" @click="consumeForm.unit = 'private'">私教</view>
			</view>
		</view>
				<view class="form-item">
					<text class="label">数量</text>
					<input 
						class="input" 
						type="number" 
						v-model="consumeForm.hours" 
						placeholder="请输入课时数量"
					/>
				</view>
				<view class="form-item">
					<text class="label">原因/备注</text>
					<input 
						class="input" 
						v-model="consumeForm.reason" 
						placeholder="请输入原因"
					/>
				</view>
				<view class="modal-actions">
					<button class="btn cancel" @click="closeConsumeModal" :disabled="isSubmitting">取消</button>
					<button class="btn confirm" @click="confirmConsume" :loading="isSubmitting" :disabled="isSubmitting">确定</button>
				</view>
			</view>
		</view>
		
		<!-- 撤销课时弹窗 -->
		<view v-if="showUndo" class="modal-overlay" @click="closeUndoModal">
			<view class="modal-content" @click.stop>
				<view class="modal-title">撤销课时扣减</view>
				<view class="form-item">
					<text class="label">撤销原因（必填）</text>
					<input 
						class="input" 
						v-model="undoForm.reason" 
						placeholder="请输入撤销原因"
					/>
				</view>
				<view class="modal-actions">
					<button class="btn cancel" @click="closeUndoModal" :disabled="isSubmitting">取消</button>
					<button class="btn confirm" @click="confirmUndo" :loading="isSubmitting" :disabled="isSubmitting">确定</button>
				</view>
			</view>
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
import { studentAPI, hoursAPI } from '@/utils/api.js'
import { getLevelLabel, formatDate } from '@/utils/common.js'
import { getShareConfig, getTimelineConfig } from '@/utils/share.js'

export default {
	data() {
		return {
			studentId: '',
			student: {
				name: '',
				level: 'white',
				parent_mobile: '',
				remaining_hours: 0,
				used_hours: 0,
				remaining_days: 0,
				used_days: 0,
				remaining_private_hours: 0,
				used_private_hours: 0
			},
			records: [],
			showAdd: false,
			showConsume: false,
			showUndo: false,
			addForm: {
				hours: '',
				unit: 'lesson',
				reason: '',
				is_unlimited: true,
				expire_date: ''
			},
			consumeForm: {
				hours: '',
				unit: 'lesson',
				reason: ''
			},
			undoForm: {
				recordId: '',
				reason: ''
			},
			userInfo: null,
		isSubmitting: false,
		today: function() {
			const now = new Date()
			const year = now.getFullYear()
			const month = String(now.getMonth() + 1).padStart(2, '0')
			const day = String(now.getDate()).padStart(2, '0')
			return `${year}-${month}-${day}`
		}(),
		showDatePickerModal: false,
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
		isAdmin() {
			return this.userInfo && this.userInfo.role === 'admin'
		}
	},
	
	onLoad(options) {
		this.userInfo = uni.getStorageSync('userInfo')
		
		if (options.studentId) {
			this.studentId = options.studentId
			this.loadStudentDetail()
			this.loadHoursRecords()
		}
		
		this.initDateData()
	},
	
	onShow() {
		if (this.studentId) {
			this.loadStudentDetail()
			this.loadHoursRecords()
		}
	},
	
	onShareAppMessage() {
		const title = this.student.name ? `欣兰体育 - ${this.student.name}的课时详情` : '欣兰体育 - 课时详情'
		return getShareConfig('/pages/coach/hours-manage-detail/hours-manage-detail', title)
	},
	
	onShareTimeline() {
		const title = this.student.name ? `欣兰体育 - ${this.student.name}的课时详情` : '欣兰体育'
		return getTimelineConfig(title)
	},
	
	methods: {
		async loadStudentDetail() {
			try {
				const res = await studentAPI.getDetail(this.studentId)
				this.student = res.data
			} catch (e) {
				console.error('加载学生详情失败:', e)
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
			}
		},
		
		async loadHoursRecords() {
			try {
				const res = await hoursAPI.getRecords({
					student_id: this.studentId
				})
				this.records = res.data.list || []
			} catch (e) {
				console.error('加载课时记录失败:', e)
			}
		},
		
		showAddModal() {
		this.addForm = { hours: '', unit: 'lesson', reason: '', is_unlimited: true, expire_date: '' }
			this.showAdd = true
		},
		
		closeAddModal() {
			this.showAdd = false
		},
		
		async confirmAdd() {
			if (this.isSubmitting) {
				return
			}
			
			const quantity = parseInt(this.addForm.hours)
			if (!quantity || quantity <= 0) {
				uni.showToast({
					title: '请输入有效的课时数量',
					icon: 'none'
				})
				return
			}
		if (!this.addForm.is_unlimited && !this.addForm.expire_date) {
			uni.showToast({
				title: '请选择到期日期',
				icon: 'none'
			})
			return
		}
			
			this.isSubmitting = true
			
			try {
			await hoursAPI.add(this.studentId, quantity, this.addForm.reason || '手动添加', null, null, this.addForm.unit, {
				is_unlimited: this.addForm.is_unlimited,
				expire_at: this.addForm.is_unlimited ? '' : this.addForm.expire_date
			})
				uni.showToast({
					title: '添加成功',
					icon: 'success'
				})
				this.closeAddModal()
				this.loadStudentDetail()
				this.loadHoursRecords()
			} catch (e) {
				uni.showToast({
					title: e.message || '添加失败',
					icon: 'none'
				})
			} finally {
				this.isSubmitting = false
			}
		},
	
	onAddLimitChange(e) {
		const checked = e.detail.value
		this.addForm.is_unlimited = !checked
		if (this.addForm.is_unlimited) {
			this.addForm.expire_date = ''
		} else {
			this.addForm.expire_date = ''
		}
	},
	
	toggleLimit() {
			this.addForm.is_unlimited = !this.addForm.is_unlimited
			if (this.addForm.is_unlimited) {
				this.addForm.expire_date = ''
			} else {
				this.addForm.expire_date = ''
			}
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
			
			this.addForm.expire_date = formattedDate
			this.showDatePickerModal = false
		},
		
		showConsumeModal() {
			this.consumeForm = { hours: '', unit: 'lesson', reason: '' }
			this.showConsume = true
		},
		
		closeConsumeModal() {
			this.showConsume = false
		},
		
		async confirmConsume() {
			if (this.isSubmitting) {
				return
			}
			
			const quantity = parseInt(this.consumeForm.hours)
			if (!quantity || quantity <= 0) {
				uni.showToast({
					title: '请输入有效的课时数量',
					icon: 'none'
				})
				return
			}
			if (this.consumeForm.unit === 'lesson' && quantity > (this.student.remaining_hours || 0)) {
				uni.showToast({
					title: '剩余课时不足',
					icon: 'none'
				})
				return
			}
			if (this.consumeForm.unit === 'day' && quantity > (this.student.remaining_days || 0)) {
				uni.showToast({
					title: '剩余天数不足',
					icon: 'none'
				})
				return
			}
			if (this.consumeForm.unit === 'private' && quantity > (this.student.remaining_private_hours || 0)) {
				uni.showToast({
					title: '剩余私教课时不足',
					icon: 'none'
				})
				return
			}
			
			this.isSubmitting = true
			
			try {
				await hoursAPI.consume(this.studentId, null, quantity, this.consumeForm.reason || '手动扣减', this.consumeForm.unit)
				uni.showToast({
					title: '扣减成功',
					icon: 'success'
				})
				this.closeConsumeModal()
				this.loadStudentDetail()
				this.loadHoursRecords()
			} catch (e) {
				uni.showToast({
					title: e.message || '扣减失败',
					icon: 'none'
				})
			} finally {
				this.isSubmitting = false
			}
		},
		
		showUndoModal(recordId) {
			this.undoForm = { recordId: recordId, reason: '' }
			this.showUndo = true
		},
		
		closeUndoModal() {
			this.showUndo = false
		},
		
		async confirmUndo() {
			if (this.isSubmitting) {
				return
			}
			
			if (!this.undoForm.reason || this.undoForm.reason.trim() === '') {
				uni.showToast({
					title: '请输入撤销原因',
					icon: 'none'
				})
				return
			}
			
			this.isSubmitting = true
			
			try {
				// 根据记录类型调用不同的撤销接口
				const record = this.records.find(r => r._id === this.undoForm.recordId)
				const recordType = record ? (record.type || record.change_type) : ''
				
				let result
				if (recordType === 'add') {
					result = await hoursAPI.undoAdd(this.undoForm.recordId, this.undoForm.reason)
				} else {
					result = await hoursAPI.undoConsume(this.undoForm.recordId, this.undoForm.reason)
				}
				
				if (result.code === 0) {
					uni.showToast({
						title: '撤销成功',
						icon: 'success'
					})
					this.closeUndoModal()
					this.loadStudentDetail()
					this.loadHoursRecords()
				} else {
					uni.showToast({
						title: result.message || '撤销失败',
						icon: 'none'
					})
				}
			} catch (e) {
				uni.showToast({
					title: e.message || '操作失败',
					icon: 'none'
				})
			} finally {
				this.isSubmitting = false
			}
		},
		
		getLevelLabel(level) {
			return getLevelLabel(level)
		},
		
		formatDate(date) {
			return formatDate(date, 'YYYY-MM-DD HH:mm')
		},
		
		getRecordTypeClass(record) {
			if (!record) {
				return ''
			}
			const type = record.type || record.change_type
			switch(type) {
				case 'refund': return 'refund'
				case 'add': return 'add'
				case 'consume': return 'consume'
				case 'expire': return 'consume'
				default: return ''
			}
		},
		
		getRecordTypeText(record) {
			if (!record) {
				return '未知'
			}
			const type = record.type || record.change_type
			switch(type) {
				case 'refund': return '返还'
				case 'add': return '增加'
				case 'consume': return '扣减'
				case 'expire': return '到期扣除'
				default: return type || '未知'
			}
		},
		
		getRecordHoursText(record) {
			if (!record) {
				return '0 课时'
			}
			const type = record.type || record.change_type
			const unit = record.unit || 'lesson'
			let hours = 0
			let unitText = '课时'
			if (unit === 'lesson') {
				hours = record.hours || record.change_hours || 0
			} else if (unit === 'day') {
				hours = record.days || 0
				unitText = '天'
			} else if (unit === 'private') {
				hours = record.private_hours || 0
				unitText = '私教课'
			}
			switch(type) {
				case 'refund':
				case 'add':
					return `+${hours} ${unitText}`
				case 'consume':
					return `${hours} ${unitText}`
				case 'expire':
					return `-${hours} ${unitText}`
				default:
					return `${hours} ${unitText}`
			}
		},
		
		getRecordRemainingText(record) {
			const unit = record.unit || 'lesson'
			if (unit === 'day') {
				const remaining = record.remaining_days || record.after_days || 0
				return `剩余: ${remaining} 天`
			} else if (unit === 'private') {
				const remaining = record.after_private_hours || 0
				return `剩余: ${remaining} 私教课`
			}
			const remaining = record.remaining_hours || record.after_hours || 0
			return `剩余: ${remaining} 课时`
		},
		
		canUndoRecord(record) {
			if (!record) {
				return false
			}
			
			const type = record.type || record.change_type
			const status = record.status
			
			if (!type) {
				return false
			}
			
			// 可以撤销添加或扣减记录
			return (type === 'consume' || type === 'add') && status !== 'undone'
		},
		
		goToPackageManage() {
			uni.navigateTo({
				url: `/pages/coach/hours-package-manage/hours-package-manage?studentId=${this.studentId}`
			})
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
	background: linear-gradient(135deg, #3cc51f 0%, #2ba30f 100%);
	padding: 40rpx 30rpx;
}

.student-info {
	display: flex;
	align-items: center;
}

.avatar {
	width: 100rpx;
	height: 100rpx;
	background: rgba(255, 255, 255, 0.3);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 40rpx;
	color: #fff;
	margin-right: 24rpx;
}

.info {
	flex: 1;
}

.name {
	font-size: 36rpx;
	font-weight: bold;
	color: #fff;
	margin-bottom: 8rpx;
}

.detail {
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.9);
}

.separator {
	margin: 0 12rpx;
	opacity: 0.6;
}

.hours-overview {
	display: flex;
	padding: 30rpx;
	gap: 20rpx;
	flex-wrap: wrap;
}

.hours-card {
	flex: 1 1 45%;
	background: #fff;
	border-radius: 16rpx;
	padding: 30rpx;
	text-align: center;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.hours-card.remaining .hours-value {
	color: #3cc51f;
}

.hours-card.used .hours-value {
	color: #ff6b6b;
}

.hours-value {
	font-size: 48rpx;
	font-weight: bold;
	margin-bottom: 8rpx;
}

.hours-label {
	font-size: 26rpx;
	color: #666;
}

.actions-section {
	background: #fff;
	margin: 0 30rpx 20rpx;
	border-radius: 16rpx;
	padding: 30rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 20rpx;
}

.action-buttons {
	display: flex;
	gap: 20rpx;
}

.action-btn {
	flex: 1;
	height: 80rpx;
	line-height: 80rpx;
	border-radius: 40rpx;
	font-size: 28rpx;
	color: #fff;
	border: none;
}

.action-btn.add {
	background: #3cc51f;
}

.action-btn.consume {
		background: #ff6b6b;
	}

	.action-btn.package {
		background: #4facfe;
	}

.records-section {
	background: #fff;
	margin: 0 30rpx;
	border-radius: 16rpx;
	padding: 30rpx;
	min-height: 400rpx;
}

.empty {
	text-align: center;
	padding: 60rpx 0;
	color: #999;
	font-size: 28rpx;
}

.record-list {
	padding-top: 10rpx;
}

.record-item {
	border-bottom: 1rpx solid #f0f0f0;
	padding: 24rpx 0;
}

.record-item:last-child {
	border-bottom: none;
}

.record-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12rpx;
}

.record-type {
	font-size: 24rpx;
	padding: 4rpx 16rpx;
	border-radius: 8rpx;
}

.record-type.add {
	background: #e8f5e9;
	color: #3cc51f;
}

.record-type.refund {
	background: #e6f7ff;
	color: #1890ff;
}

.record-type.consume {
	background: #ffebee;
	color: #ff6b6b;
}

.record-time {
	font-size: 24rpx;
	color: #999;
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.record-body {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.record-hours {
	font-size: 32rpx;
	font-weight: bold;
}

.record-hours.add {
	color: #3cc51f;
}

.record-hours.consume {
	color: #ff6b6b;
}

.record-remaining {
	font-size: 26rpx;
	color: #666;
}

.record-reason {
	font-size: 24rpx;
	color: #999;
	margin-top: 8rpx;
}

.record-undo-info {
	font-size: 22rpx;
	color: #ff6b6b;
	margin-top: 8rpx;
}

.undo-reason {
	color: #666;
}

.record-actions {
	margin-top: 16rpx;
}

.undo-btn {
	background: #ff6b6b;
	color: #fff;
	font-size: 24rpx;
	padding: 8rpx 20rpx;
	border-radius: 20rpx;
	border: none;
	min-height: 50rpx;
	line-height: 50rpx;
}

.undone-tag {
	background: #ffebee;
	color: #ff6b6b;
	font-size: 20rpx;
	padding: 2rpx 12rpx;
	border-radius: 12rpx;
}

.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 999;
}

.modal-content {
	background: #fff;
	border-radius: 20rpx;
	padding: 40rpx;
	width: 560rpx;
}
.unit-tabs {
	display: flex;
	background: #f5f5f5;
	border-radius: 12rpx;
	padding: 6rpx;
}
.unit-tab {
	flex: 1;
	text-align: center;
	padding: 14rpx 0;
	font-size: 26rpx;
	color: #8e8e8e;
	border-radius: 10rpx;
}
.unit-tab.active {
	background: #ffffff;
	color: #262626;
	font-weight: 600;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}

.modal-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
	text-align: center;
	margin-bottom: 30rpx;
}

.form-item {
	margin-bottom: 24rpx;
}

.label {
	display: block;
	font-size: 28rpx;
	color: #666;
	margin-bottom: 12rpx;
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

.picker-text {
	font-size: 28rpx;
	color: #333;
}

.date-picker {
	width: 100%;
	height: 80rpx;
}

.picker-content {
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

.date-picker-view {
	width: 100%;
	height: 300rpx;
	background: #fff;
	border-radius: 12rpx;
	margin-top: 10rpx;
	border: 1rpx solid #dbdbdb;
}

.date-picker-actions {
	display: flex;
	justify-content: flex-end;
	padding: 10rpx 0;
	background: transparent;
	box-shadow: none;
	margin-top: 10rpx;
	margin-bottom: 10rpx;
}

.picker-btn {
	padding: 0 30rpx;
	height: 60rpx;
	line-height: 60rpx;
	border-radius: 30rpx;
	font-size: 26rpx;
	border: none;
	margin-left: 15rpx;
}

.picker-btn.cancel {
	background: #f5f5f5;
	color: #666;
}

.picker-btn.confirm {
	background: #3cc51f;
	color: #fff;
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

.input:focus {
	border-color: #a8a8a8;
	background: #ffffff;
}

.modal-actions {
	display: flex;
	gap: 20rpx;
	margin-top: 30rpx;
}

.btn {
	flex: 1;
	height: 80rpx;
	line-height: 80rpx;
	border-radius: 40rpx;
	font-size: 28rpx;
	border: none;
}

.btn.cancel {
	background: #f5f5f5;
	color: #666;
}

.btn.confirm {
	background: #3cc51f;
	color: #fff;
}
</style>
