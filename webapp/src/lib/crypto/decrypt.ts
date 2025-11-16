// TODO: should be same source code as used in the plugin!!

import { AES, enc, HmacSHA256 } from 'crypto-js';

type CryptData = {
	ciphertext: string;
	key: string;
	iv?: string;
	hmac?: string;
};

type CryptData_v1 = CryptData & {
	hmac: string;
};

type CryptData_v3 = CryptData & {
	iv: string;
};

export async function decrypt(cryptData: CryptData, version: string): Promise<string> {
	console.log(`[decrypt] Starting decryption with crypto suite version: ${version}`);
	try {
		if (version === 'v1') {
			return await decrypt_v1(cryptData as CryptData_v1);
		}
		if (version === 'v2') {
			return await decrypt_v2(cryptData as CryptData_v1);
		}
		if (version === 'v3') {
			return await decrypt_v3(cryptData as CryptData_v3);
		}
		console.error(`[decrypt] Unsupported crypto version: ${version}`);
		throw new Error(`Unsupported crypto version: ${version}`);
	} catch (error) {
		console.error(`[decrypt] Decryption failed for version ${version}:`, error);
		throw error;
	}
}

export async function decrypt_v1(cryptData: {
	ciphertext: string;
	hmac: string;
	key: string;
}): Promise<string> {
	console.log('[decrypt_v1] Starting v1 decryption');
	console.log('[decrypt_v1] Ciphertext length:', cryptData.ciphertext.length);
	console.log('[decrypt_v1] Key length:', cryptData.key.length);

	try {
		const hmac_calculated = HmacSHA256(cryptData.ciphertext, cryptData.key).toString();
		const is_authentic = hmac_calculated == cryptData.hmac;
		console.log('[decrypt_v1] HMAC verification:', is_authentic ? 'PASSED' : 'FAILED');

		if (!is_authentic) {
			console.error('[decrypt_v1] HMAC check failed - data may be tampered');
			throw Error('Failed HMAC check');
		}
		const md = AES.decrypt(cryptData.ciphertext, cryptData.key).toString(enc.Utf8);
		console.log('[decrypt_v1] Decryption successful, plaintext length:', md.length);
		return md;
	} catch (error) {
		console.error('[decrypt_v1] Decryption failed:', error);
		throw error;
	}
}

export async function decrypt_v2(cryptData: {
	ciphertext: string;
	hmac: string;
	key: string;
}): Promise<string> {
	console.log('[decrypt_v2] Starting v2 decryption');
	console.log('[decrypt_v2] Ciphertext length:', cryptData.ciphertext.length);
	console.log('[decrypt_v2] Key length:', cryptData.key.length);

	try {
		const secret = base64ToArrayBuffer(cryptData.key);
		const ciphertext_buf = base64ToArrayBuffer(cryptData.ciphertext);
		const hmac_buf = base64ToArrayBuffer(cryptData.hmac);
		console.log('[decrypt_v2] Decoded buffers - secret:', secret.byteLength, 'ciphertext:', ciphertext_buf.byteLength, 'hmac:', hmac_buf.byteLength);

		const is_authentic = await window.crypto.subtle.verify(
			{ name: 'HMAC', hash: 'SHA-256' },
			await _getSignKey(secret),
			hmac_buf,
			ciphertext_buf
		);
		console.log('[decrypt_v2] HMAC verification:', is_authentic ? 'PASSED' : 'FAILED');

		if (!is_authentic) {
			console.error('[decrypt_v2] HMAC check failed - data may be tampered');
			throw Error('Failed HMAC check');
		}

		const md = await window.crypto.subtle.decrypt(
			{ name: 'AES-CBC', iv: new Uint8Array(16) },
			await _getAesCbcKey(secret),
			ciphertext_buf
		);
		const plaintext = new TextDecoder().decode(md);
		console.log('[decrypt_v2] Decryption successful, plaintext length:', plaintext.length);
		return plaintext;
	} catch (error) {
		console.error('[decrypt_v2] Decryption failed:', error);
		throw error;
	}
}

export async function decrypt_v3(cryptData: {
	ciphertext: string;
	iv: string;
	key: string;
}): Promise<string> {
	console.log('[decrypt_v3] Starting v3 decryption');
	console.log('[decrypt_v3] Ciphertext length:', cryptData.ciphertext.length);
	console.log('[decrypt_v3] Key length:', cryptData.key.length);
	console.log('[decrypt_v3] IV length:', cryptData.iv.length);

	const secret = base64ToArrayBuffer(cryptData.key);
	const ciphertext_buf = base64ToArrayBuffer(cryptData.ciphertext);
	const iv_buf = base64ToArrayBuffer(cryptData.iv);
	console.log('[decrypt_v3] Decoded buffers - secret:', secret.byteLength, 'ciphertext:', ciphertext_buf.byteLength, 'iv:', iv_buf.byteLength);

	try {
		const md = await window.crypto.subtle.decrypt(
			{ name: 'AES-GCM', iv: iv_buf },
			await _getAesGcmKey(secret),
			ciphertext_buf
		);
		const plaintext = new TextDecoder().decode(md);
		console.log('[decrypt_v3] Decryption successful, plaintext length:', plaintext.length);
		return plaintext;
	} catch (error) {
		console.error('[decrypt_v3] Decryption failed:', error);
		throw error;
	}
}

function _getAesCbcKey(secret: ArrayBuffer): Promise<CryptoKey> {
	return window.crypto.subtle.importKey('raw', secret, { name: 'AES-CBC', length: 256 }, false, [
		'decrypt'
	]);
}

function _getAesGcmKey(secret: ArrayBuffer): Promise<CryptoKey> {
	return window.crypto.subtle.importKey('raw', secret, { name: 'AES-GCM', length: 256 }, false, [
		'decrypt'
	]);
}

function _getSignKey(secret: ArrayBuffer): Promise<CryptoKey> {
	return window.crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, [
		'sign',
		'verify'
	]);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
	return Uint8Array.from(window.atob(base64), (c) => c.charCodeAt(0)).buffer;
}
