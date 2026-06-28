<template>
	<view class="agreement-container">
		<view class="agreement-content">
			<view class="title">用户协议</view>
			<view class="intro">
				<view class="intro-text">
					欢迎使用欣兰体育课时管理系统（以下简称"本小程序"）。本用户协议（以下简称"本协议"）是您与本小程序运营方之间就使用本小程序所订立的协议。请您仔细阅读并理解本协议的各条款内容，特别是免除或限制责任的条款。
				</view>
				<view class="update-time">
					<text>更新日期：2024年</text>
					<text class="link" @click="goToPrivacyPolicy">查看隐私政策</text>
				</view>
			</view>

			<view class="section">
				<view class="section-title">一、定义与解释</view>
				<view class="section-text">
					1.1 <text class="bold">用户</text>：指使用本小程序的家长、教练、管理员等用户。
					
					1.2 <text class="bold">小程序</text>：指欣兰体育课时管理系统微信小程序。
					
					1.3 <text class="bold">运营方</text>：指本小程序的开发者和运营者。
					
					1.4 <text class="bold">服务</text>：指本小程序提供的课时管理、学生管理、课程安排等服务。
				</view>
			</view>

			<view class="section">
				<view class="section-title">二、协议的接受与修改</view>
				<view class="section-text">
					2.1 <text class="bold">协议的接受</text>：您点击"同意"或使用本小程序，即表示您已阅读、理解并同意本协议的全部内容。
					
					2.2 <text class="bold">协议的修改</text>：运营方有权根据需要修改本协议，修改后的协议将在本小程序公布。如您不同意修改后的协议，请停止使用本小程序。
					
					2.3 <text class="bold">协议的生效</text>：本协议自您点击"同意"或首次使用本小程序时生效。
				</view>
			</view>

			<view class="section">
				<view class="section-title">三、用户注册与登录</view>
				<view class="section-text">
					3.1 <text class="bold">注册条件</text>：您必须具备完全民事行为能力，才能注册成为本小程序的用户。如您不具备完全民事行为能力，应在监护人的陪同下使用本小程序。
					
					3.2 <text class="bold">注册信息</text>：您在注册时应提供真实、准确、完整的个人信息，并及时更新。
					
					3.3 <text class="bold">账号安全</text>：您应妥善保管账号和密码，对使用该账号进行的所有活动承担责任。如发现账号被盗用，应立即通知运营方。
					
					3.4 <text class="bold">账号注销</text>：您可以随时申请注销账号，注销后您的个人信息将被删除。
				</view>
			</view>

			<view class="section">
				<view class="section-title">四、服务内容</view>
				<view class="section-text">
					4.1 <text class="bold">服务范围</text>：本小程序提供以下服务：
					- 学生信息管理
					- 课程安排与管理
					- 课时统计与查询
					- 课程提醒与通知
					- 家长端查看孩子信息
					
					4.2 <text class="bold">服务变更</text>：运营方有权根据业务需要调整服务内容，如有重大变更，将提前通知用户。
					
					4.3 <text class="bold">服务中断</text>：因系统维护、设备故障等原因可能导致服务中断，运营方将尽量提前通知。
				</view>
			</view>

			<view class="section">
				<view class="section-title">五、用户行为规范</view>
				<view class="section-text">
					5.1 <text class="bold">合法使用</text>：您应遵守法律法规，不得利用本小程序从事违法活动。
					
					5.2 <text class="bold">禁止行为</text>：您不得：
					- 传播违法、有害、虚假信息
					- 侵犯他人知识产权、隐私权等合法权益
					- 使用技术手段干扰本小程序正常运行
					- 恶意攻击、破坏本小程序系统
					- 冒充他人或虚假注册账号
					
					5.3 <text class="bold">信息真实性</text>：您提供的信息应真实、准确，不得提供虚假信息。
					
					5.4 <text class="bold">责任承担</text>：如您违反本协议，运营方有权暂停或终止为您提供服务，并保留追究法律责任的权利。
				</view>
			</view>

			<view class="section">
				<view class="section-title">六、个人信息保护</view>
				<view class="section-text">
					6.1 <text class="bold">信息收集</text>：我们将按照《隐私政策》的约定收集和使用您的个人信息。
					
					6.2 <text class="bold">信息保护</text>：我们将采取合理的安全措施保护您的个人信息安全。
					
					6.3 <text class="bold">信息使用</text>：我们仅在实现服务目的所必需的范围内使用您的个人信息。
					
					6.4 <text class="bold">信息删除</text>：您可以申请删除个人信息或注销账号，我们将按照法律规定处理。
				</view>
			</view>

			<view class="section">
				<view class="section-title">七、知识产权</view>
				<view class="section-text">
					7.1 <text class="bold">平台权利</text>：本小程序的软件、设计、文字、图片等知识产权归运营方所有。
					
					7.2 <text class="bold">用户授权</text>：您在使用本小程序时产生的内容，您授权运营方在提供服务范围内使用。
					
					7.3 <text class="bold">禁止侵权</text>：未经运营方许可，不得复制、传播、修改本小程序的任何内容。
				</view>
			</view>

			<view class="section">
				<view class="section-title">八、免责声明</view>
				<view class="section-text">
					8.1 <text class="bold">服务按现状提供</text>：本小程序按"现状"提供服务，不保证服务完全无错误、无中断。
					
					8.2 <text class="bold">第三方内容</text>：本小程序可能包含第三方链接或内容，运营方不对第三方内容负责。
					
					8.3 <text class="bold">不可抗力</text>：因不可抗力导致的服务中断或数据丢失，运营方不承担责任。
					
					8.4 <text class="bold">用户行为</text>：因用户违反本协议或法律法规导致的一切损失，由用户自行承担。
				</view>
			</view>

			<view class="section">
				<view class="section-title">九、违约责任</view>
				<view class="section-text">
					9.1 <text class="bold">用户违约</text>：如您违反本协议，运营方有权采取以下措施：
					- 警告
					- 限制功能使用
					- 暂停服务
					- 终止服务
					- 追究法律责任
					
					9.2 <text class="bold">运营方违约</text>：如运营方违反本协议，应承担相应的法律责任。
				</view>
			</view>

			<view class="section">
				<view class="section-title">十、协议的终止</view>
				<view class="section-text">
					10.1 <text class="bold">用户终止</text>：您可以随时停止使用本小程序，或申请注销账号。
					
					10.2 <text class="bold">运营方终止</text>：在以下情况下，运营方可以终止服务：
					- 用户违反本协议
					- 用户提供的注册信息不真实
					- 用户利用本小程序从事违法活动
					
					10.3 <text class="bold">终止后果</text>：服务终止后，您的账号将被注销，个人信息将被删除。
				</view>
			</view>

			<view class="section">
				<view class="section-title">十一、争议解决</view>
				<view class="section-text">
					11.1 <text class="bold">适用法律</text>：本协议的订立、执行和解释适用中华人民共和国法律。
					
					11.2 <text class="bold">争议解决</text>：如发生争议，双方应友好协商解决；协商不成的，可向运营方所在地人民法院提起诉讼。
					
					11.3 <text class="bold">管辖法院</text>：本协议争议由运营方所在地人民法院管辖。
				</view>
			</view>

			<view class="section">
				<view class="section-title">十二、其他条款</view>
				<view class="section-text">
					12.1 <text class="bold">协议完整性</text>：本协议构成双方就本小程序服务的完整协议。
					
					12.2 <text class="bold">条款可分割性</text>：如本协议的任何条款被认定为无效，不影响其他条款的效力。
					
					12.3 <text class="bold">不弃权</text>：运营方未行使或延迟行使权利，不视为放弃该权利。
					
					12.4 <text class="bold">标题效力</text>：本协议的标题仅为方便阅读，不影响条款的解释。
				</view>
			</view>

			<view class="section">
				<view class="section-title">十三、联系我们</view>
				<view class="section-text">
					如您对本协议有任何疑问或建议，请联系我们：
					
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
		return getShareConfig('/pages/parent/user-agreement/user-agreement', '欣兰体育 - 用户协议')
	},
	
	onShareTimeline() {
		return getTimelineConfig('欣兰体育')
	},

	methods: {
		goToPrivacyPolicy() {
			uni.navigateTo({
				url: '/pages/parent/privacy-policy/privacy-policy'
			})
		}
	}
}
</script>

<style scoped>
.agreement-container {
	min-height: 100vh;
	background: #ffffff;
	padding: 40rpx 30rpx;
}

.agreement-content {
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
