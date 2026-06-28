<template>
	<view class="policy-container">
		<view class="policy-content">
			<view class="title">隐私政策</view>
			<view class="intro">
				<view class="intro-text">
					欢迎使用欣兰体育课时管理系统（以下简称"本小程序"）。我们深知个人信息对您的重要性，并致力于保护您的个人信息安全与隐私。本隐私政策旨在向您说明，在您使用本小程序时，我们如何收集、使用、存储和保护您的个人信息。请您仔细阅读并理解本政策。
				</view>
				<view class="update-time">
					<text>更新日期：2024年</text>
					<text class="link" @click="goToUserAgreement">查看用户协议</text>
				</view>
			</view>

			<view class="section">
				<view class="section-title">一、定义与解释</view>
				<view class="section-text">
					1.1 <text class="bold">用户</text>：指使用本小程序的家长、教练、管理员等用户。
					
					1.2 <text class="bold">小程序</text>：指欣兰体育课时管理系统微信小程序。
					
					1.3 <text class="bold">个人信息</text>：指以电子或者其他方式记录的，能够单独或者与其他信息结合识别特定自然人身份的各种信息，包括但不限于姓名、手机号码、微信昵称、头像等。
					
					1.4 <text class="bold">敏感个人信息</text>：指一旦泄露或者非法使用，容易导致用户人身、财产安全受到严重危害的个人信息，包括手机号码、身份证件号码等。
					
					1.5 <text class="bold">未成年人</text>：指不满18周岁的自然人。
				</view>
			</view>

			<view class="section">
				<view class="section-title">二、用户个人信息保护原则</view>
				<view class="section-text">
					2.1 <text class="bold">合法、正当、必要原则</text>：我们收集和使用您的个人信息时，将遵循合法、正当、必要的原则，不收集与提供服务无关的个人信息。
					
					2.2 <text class="bold">明示同意原则</text>：我们会通过弹窗、勾选框等方式，明示收集个人信息的目的、方式和范围，并征求您的明确同意。
					
					2.3 <text class="bold">目的限制原则</text>：我们收集和使用您的个人信息仅限于实现本小程序功能所必需的范围，不会超出该范围使用。
					
					2.4 <text class="bold">安全保障原则</text>：我们将采取相应的安全保护措施，保护您的个人信息安全。
					
					2.5 <text class="bold">诚信原则</text>：我们将以诚实信用的方式处理您的个人信息。
				</view>
			</view>

			<view class="section">
				<view class="section-title">三、我们收集的个人信息</view>
				<view class="section-text">
					3.1 <text class="bold">收集目的</text>：为了向您提供课时管理服务，我们需要收集以下信息：
					
					3.2 <text class="bold">收集方式</text>：我们通过以下方式收集您的个人信息：
					- 您主动提供的信息（如填写学生信息时提供的家长手机号）
					- 微信授权信息（如微信昵称、头像、openid）
					- 设备信息（如设备型号、操作系统版本）
					
					3.3 <text class="bold">收集内容</text>：
					1. <text class="bold">账号信息</text>：用户名、密码等登录凭证。
					2. <text class="bold">微信信息</text>：微信昵称、头像、openid等。
					3. <text class="bold">学生信息</text>：学生姓名、性别、出生日期、家长姓名、家长手机号等。
					4. <text class="bold">课程信息</text>：课程安排、上课记录、课时消耗等。
					5. <text class="bold">设备信息</text>：设备型号、操作系统版本、网络状态等技术信息。
				</view>
			</view>

			<view class="section">
				<view class="section-title">四、个人信息的使用</view>
				<view class="section-text">
					我们收集您的信息主要用于以下目的：
					
					1. 提供课时管理服务，包括学生管理、课程安排、课时统计等
					2. 向您发送课程提醒、课时不足提醒等通知
					3. <text class="highlight">家长手机号用于识别和绑定孩子，确保家长只能查看自己孩子的信息</text>
					4. 改进和优化我们的服务
					5. 保障账号安全，防止欺诈行为
					6. 遵守法律法规要求
					
					我们承诺不会将您的个人信息用于其他目的，不会在未经您同意的情况下向第三方共享您的个人信息。
				</view>
			</view>

			<view class="section">
				<view class="section-title">五、个人信息的共享与披露</view>
				<view class="section-text">
					我们承诺：
					
					1. <text class="bold">不会将您的个人信息出售给任何第三方</text>
					
					2. 仅在以下情况下可能共享您的信息：
					   - 获得您的明确同意
					   - 与关联公司共享以提供服务
					   - 根据法律法规要求或政府部门的合法要求
					   - 为保护我们的合法权益或用户安全
					
					3. <text class="bold">共享范围限制</text>：我们只会在实现服务所必需的范围内共享您的信息，且会要求接收方采取相应的安全保护措施。
				</view>
			</view>

			<view class="section">
				<view class="section-title">六、个人信息的存储与安全</view>
				<view class="section-text">
					1. <text class="bold">存储地点</text>：您的个人信息存储在中华人民共和国境内的服务器上。
					
					2. <text class="bold">存储期限</text>：我们仅在实现本政策所述目的所需的期间内保留您的个人信息，超出保留期限后，我们会删除或匿名化处理您的个人信息。
					
					3. <text class="bold">安全措施</text>：我们采取合理的安全措施保护您的个人信息，包括但不限于：
					   - 数据加密传输和存储
					   - 访问权限控制
					   - 安全审计和监控
					   - 定期安全评估
					
					4. <text class="bold">数据备份</text>：我们会定期备份您的个人信息，以防止数据丢失。
				</view>
			</view>

			<view class="section">
				<view class="section-title">七、您的权利</view>
				<view class="section-text">
					您对自己的个人信息享有以下权利：
					
					1. <text class="bold">访问权</text>：您可以随时查看自己的个人信息。
					
					2. <text class="bold">更正权</text>：如发现个人信息不准确，您可以要求更正。
					
					3. <text class="bold">删除权</text>：在符合法律规定的情况下，您可以要求删除个人信息。您也可以通过小程序内的"注销账号"功能删除您的账号及相关数据。
					
					4. <text class="bold">撤回同意权</text>：您可以随时撤回之前给予的同意。
					
					5. <text class="bold">注销账号权</text>：您可以申请注销账号，注销后您的个人信息将被删除。
					
					如需行使上述权利，请通过小程序内的反馈功能联系我们。
				</view>
			</view>

			<view class="section">
				<view class="section-title">八、未成年人保护</view>
				<view class="section-text">
					我们非常重视未成年人的信息保护：
					
					1. 本系统主要面向跆拳道培训机构及其学员家长
					
					2. 未成年人的信息由其监护人提供和管理
					
					3. 如发现未成年人的信息被不当收集，请联系我们删除
					
					4. 我们不会主动收集未成年人的个人信息，除非在监护人同意的情况下
				</view>
			</view>

			<view class="section">
				<view class="section-title">九、Cookie和类似技术</view>
				<view class="section-text">
					我们可能使用Cookie或类似技术来：
					1. 记住您的登录状态
					2. 了解您的使用偏好
					3. 改善用户体验
					
					您可以通过设备设置管理Cookie。
				</view>
			</view>

			<view class="section">
				<view class="section-title">十、隐私政策的更新</view>
				<view class="section-text">
					1. 我们可能会根据业务需要或法律法规变化更新本隐私政策。
					
					2. 更新后的政策将在本小程序公布，重大变更我们会通过适当方式通知您。
					
					3. 您继续使用本小程序即视为接受更新后的隐私政策。
					
					4. 如您不同意更新后的政策，请停止使用本小程序，并可以申请注销账号。
				</view>
			</view>

			<view class="section">
				<view class="section-title">十一、联系我们</view>
				<view class="section-text">
					如您对本隐私政策有任何疑问或建议，请联系我们：
					
					<text class="highlight">联系方式：请通过小程序内的反馈功能联系</text>
					
					我们将在收到您的反馈后尽快回复。
				</view>
			</view>

			<view class="footer">
				<view class="footer-text">欣兰体育课时管理系统</view>
				<view class="footer-text">更新日期：2024年</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getShareConfig, getTimelineConfig } from '@/utils/share.js'

export default {
	data() {
		return {}
	},
	
	onShareAppMessage() {
		return getShareConfig('/pages/parent/privacy-policy/privacy-policy', '欣兰体育 - 隐私政策')
	},
	
	onShareTimeline() {
		return getTimelineConfig('欣兰体育')
	},

	methods: {
		goToUserAgreement() {
			uni.navigateTo({
				url: '/pages/parent/user-agreement/user-agreement'
			})
		}
	}
}
</script>

<style scoped>
.policy-container {
	min-height: 100vh;
	background: #ffffff;
	padding: 40rpx 30rpx;
}

.policy-content {
	max-width: 100%;
}

.title {
	font-size: 40rpx;
	font-weight: 600;
	color: #262626;
	text-align: center;
	margin-bottom: 40rpx;
}

.intro {
	margin-bottom: 50rpx;
	padding: 30rpx;
	background: #f8f9fa;
	border-radius: 12rpx;
}

.intro-text {
	font-size: 28rpx;
	color: #595959;
	line-height: 1.8;
	margin-bottom: 20rpx;
}

.update-time {
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-size: 26rpx;
	color: #8e8e8e;
}

.link {
	color: #0095f6;
}

.section {
	margin-bottom: 50rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #262626;
	margin-bottom: 20rpx;
	padding-bottom: 15rpx;
	border-bottom: 2rpx solid #f0f0f0;
}

.section-text {
	font-size: 28rpx;
	color: #595959;
	line-height: 1.8;
	white-space: pre-wrap;
}

.bold {
	font-weight: 600;
	color: #262626;
}

.highlight {
	color: #0095f6;
	font-weight: 600;
}

.footer {
	margin-top: 60rpx;
	padding-top: 40rpx;
	border-top: 1rpx solid #f0f0f0;
}

.footer-text {
	font-size: 26rpx;
	color: #8e8e8e;
	text-align: center;
	margin-bottom: 10rpx;
}
</style>
