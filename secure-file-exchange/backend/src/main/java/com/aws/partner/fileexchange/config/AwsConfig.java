package com.aws.partner.fileexchange.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cloudwatch.CloudWatchClient;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
public class AwsConfig {
    private static final Logger log = LoggerFactory.getLogger(AwsConfig.class);

    @Value("${aws.region:us-east-1}")
    private String awsRegion;

    private boolean awsCredentialsAvailable = false;

    @Bean
    public S3Client s3Client() {
        try {
            DefaultCredentialsProvider credentialsProvider = DefaultCredentialsProvider.create();
            // Test if credentials can be resolved
            credentialsProvider.resolveCredentials();
            awsCredentialsAvailable = true;
            log.info("AWS credentials resolved successfully. Initializing real S3Client for region {}", awsRegion);
            return S3Client.builder()
                    .region(Region.of(awsRegion))
                    .credentialsProvider(credentialsProvider)
                    .build();
        } catch (Exception e) {
            log.info("AWS credentials are unavailable ({}); configured file storage will use the local persistent directory.", e.getMessage());
            awsCredentialsAvailable = false;
            return null;
        }
    }

    @Bean
    public CloudWatchClient cloudWatchClient() {
        if (!awsCredentialsAvailable) {
            return null;
        }
        try {
            return CloudWatchClient.builder()
                    .region(Region.of(awsRegion))
                    .credentialsProvider(DefaultCredentialsProvider.create())
                    .build();
        } catch (Exception e) {
            log.warn("CloudWatch client initialization failed: {}", e.getMessage());
            return null;
        }
    }

    public boolean isAwsCredentialsAvailable() {
        return awsCredentialsAvailable;
    }

    public String getAwsRegion() {
        return awsRegion;
    }
}
