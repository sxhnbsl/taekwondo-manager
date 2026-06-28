const db = uniCloud.database()

export function callCloudFunction(name, data) {
	return new Promise((resolve, reject) => {
		const token = uni.getStorageSync('token')
		
		const requestData = {
			...data,
			_token: token
		}
		
		uniCloud.callFunction({
			name,
			data: requestData,
			success: (res) => {
				if (res.result.code === 0) {
					resolve(res.result)
				} else {
					uni.showToast({
						title: res.result.message || '操作失败',
						icon: 'none'
					})
					reject(res.result)
				}
			},
			fail: (err) => {
				console.error(`callCloudFunction fail - name: ${name}, error:`, err)
				uni.showToast({
					title: '网络错误，请重试',
					icon: 'none'
				})
				reject(err)
			}
		})
	})
}

export function uploadFile(filePath, cloudPath) {
	return new Promise((resolve, reject) => {
		uniCloud.uploadFile({
			filePath,
			cloudPath,
			success: (res) => {
				resolve(res)
			},
			fail: (err) => {
				console.error('上传失败，err:', err)
				uni.showToast({
					title: '上传失败: ' + (err.errMsg || '未知错误'),
					icon: 'none'
				})
				reject(err)
			}
		})
	})
}

export function deleteFile(fileList) {
	return new Promise((resolve, reject) => {
		uniCloud.deleteFile({
			fileList,
			success: (res) => {
				resolve(res)
			},
			fail: (err) => {
				uni.showToast({
					title: '删除失败',
					icon: 'none'
				})
				reject(err)
			}
		})
	})
}

export function getTempFileURL(fileList) {
	return new Promise((resolve, reject) => {
		uniCloud.getTempFileURL({
			fileList,
			success: (res) => {
				resolve(res)
			},
			fail: (err) => {
				reject(err)
			}
		})
	})
}
