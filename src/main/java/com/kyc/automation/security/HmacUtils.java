package com.kyc.automation.security;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.MessageDigest;
import java.util.HexFormat;

public class HmacUtils {
    public static boolean isValidSignature(String payload, String signature, String secret) {
        try {
            Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
            SecretKeySpec secret_key = new SecretKeySpec(secret.getBytes(), "HmacSHA256");
            sha256_HMAC.init(secret_key);
            byte[] hash = sha256_HMAC.doFinal(payload.getBytes());
            
            // Java 17+ HexFormat
            String computedSignature = HexFormat.of().formatHex(hash);
            
            // Use MessageDigest.isEqual to prevent timing attacks
            return MessageDigest.isEqual(computedSignature.getBytes(), signature.getBytes());
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}
