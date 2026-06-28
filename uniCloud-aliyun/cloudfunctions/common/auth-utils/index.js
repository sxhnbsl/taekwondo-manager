const crypto = require('crypto')
const config = require('./config.js')

function createToken(uid, role) {
	const exp = Date.now() + (config.tokenExpiresIn || 7200) * 1000
	const payload = JSON.stringify({ uid, role, exp })
	const payloadBase = Buffer.from(payload).toString('base64')
	const signature = crypto.createHmac('sha256', config.tokenSecret).update(payloadBase).digest('hex')
	return { token: `${payloadBase}.${signature}`, exp }
}

function verifyToken(token) {
	if (!token) return null
	const parts = token.split('.')
	if (parts.length !== 2) return null
	const [payloadBase, signature] = parts
	const expected = crypto.createHmac('sha256', config.tokenSecret).update(payloadBase).digest('hex')
	if (expected !== signature) return null
	let payload
	try {
		payload = JSON.parse(Buffer.from(payloadBase, 'base64').toString())
	} catch (e) {
		return null
	}
	if (!payload.uid || !payload.role || !payload.exp) return null
	if (payload.exp < Date.now()) return null
	return payload
}

module.exports = { createToken, verifyToken }
