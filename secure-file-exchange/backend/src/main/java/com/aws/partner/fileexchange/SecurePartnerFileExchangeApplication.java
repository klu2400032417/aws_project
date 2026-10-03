package com.aws.partner.fileexchange;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SecurePartnerFileExchangeApplication {
    private static final Logger log = LoggerFactory.getLogger(SecurePartnerFileExchangeApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(SecurePartnerFileExchangeApplication.class, args);
        log.info("================================================================================");
        log.info(" Secure Partner File Exchange Platform (Enterprise Edition)");
        log.info(" Storage Architecture: Configured Amazon S3 or local persistent storage");
        log.info(" Active Ingestion: REST API + backend validation + relational database");
        log.info(" Backend running on: http://localhost:8080");
        log.info("================================================================================");
    }
}
