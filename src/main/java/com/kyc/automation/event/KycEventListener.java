package com.kyc.automation.event;

import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class KycEventListener {

    @EventListener
    public void onKycCompleted(KycCompletedEvent event) {
        System.out.println("EVENT RECEIVED: KYC Completed for Customer ID: " + event.getCustomerId());
        System.out.println("Status: " + event.getStatus());
        
        if (event.getStatus() == com.kyc.automation.entity.KycStatus.APPROVED) {
            System.out.println("-> Action: Unlocking account features...");
            System.out.println("-> Action: Sending Welcome Email...");
        } else if (event.getStatus() == com.kyc.automation.entity.KycStatus.REJECTED) {
             System.out.println("-> Action: Sending Rejection Notification...");
        } else if (event.getStatus() == com.kyc.automation.entity.KycStatus.ACTION_REQUIRED) {
             System.out.println("-> Action: Requesting Resubmission...");
        }
    }
}
