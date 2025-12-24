package com.kyc.automation.event;

import com.kyc.automation.entity.KycStatus;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class KycCompletedEvent extends ApplicationEvent {
    private final Long applicationId;
    private final Long customerId;
    private final KycStatus status;

    public KycCompletedEvent(Object source, Long applicationId, Long customerId, KycStatus status) {
        super(source);
        this.applicationId = applicationId;
        this.customerId = customerId;
        this.status = status;
    }
}
