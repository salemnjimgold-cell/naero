package com.salemnjimgold.naeroapp

import android.content.pm.PackageManager
import android.util.Base64
import android.util.Log
import com.facebook.react.bridge.*
import java.security.MessageDigest

class KeyHashModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "KeyHashModule"

    @ReactMethod
    fun getAppInfo(promise: Promise) {
        try {
            val ctx = reactApplicationContext
            val pm = ctx.packageManager
            val packageName = ctx.packageName
            val info = pm.getPackageInfo(packageName, PackageManager.GET_SIGNATURES)
            val hashes = mutableListOf<String>()

            val signatures = info.signatures ?: emptyArray()
            for (sig in signatures) {
                val digest = MessageDigest.getInstance("SHA-1")
                digest.update(sig.toByteArray())
                val hash = Base64.encodeToString(digest.digest(), Base64.NO_WRAP)
                hashes.add(hash)
            }

            val result = Arguments.createMap()
            result.putString("packageName", packageName)
            val hashArray = Arguments.createArray()
            for (h in hashes) {
                hashArray.pushString(h)
            }
            result.putArray("keyHashes", hashArray)
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("KEY_HASH_ERROR", e.message, e)
        }
    }
}
